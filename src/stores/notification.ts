import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'
import router from '@/router'
import * as systemApi from '@/api/system'
import { useAuthStore } from '@/stores/auth'
import { normalizeListData } from '@/modules/shared/response'
import type { AppNotification, NotificationConnectionStatus, NotificationLevel, NotificationSocketMessage } from '@/types/notification'
import { Logger } from '@/utils/logger'
import { translate } from '@/locales'
import { normalizeNotificationActionUrl } from '@/utils/notificationAction'

const NOTIFICATION_PERSIST_KEY = 'notification'
const NOTIFICATION_PANEL_LIMIT = 50
const RECONNECT_DELAYS_MS = [3000, 10000, 20000, 30000, 40000, 60000]
const HEARTBEAT_INTERVAL_MS = 30000
const HEARTBEAT_TIMEOUT_MS = 90000
// 服务端会话强踢 Close code：4001 会话失效/被撤销，4002 被强制下线/主动登出。
// 收到这两类应停止重连并跳登录，不可继续重连（否则会无限拿新 ticket 重连被拒）。
const SESSION_TERMINATED_CODES = new Set([4001, 4002])

// 通用频道处理器类型
export type ChannelHandler = (data: unknown) => void

// 频道订阅管理
const channelHandlers = new Map<string, Set<ChannelHandler>>()
const subscribedChannels = new Set<string>()

// 订阅频道
export function subscribeChannel(channel: string, handler: ChannelHandler) {
    if (!channel || !handler) return
    const shouldSubscribe = !subscribedChannels.has(channel)
    let handlers = channelHandlers.get(channel)
    if (!handlers) {
        handlers = new Set()
        channelHandlers.set(channel, handlers)
    }
    handlers.add(handler)
    subscribedChannels.add(channel)
    // 如果 socket 已连接，发送订阅消息
    if (shouldSubscribe && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: 'subscribe', channel }))
    }
}

// 退订频道
export function unsubscribeChannel(channel: string, handler?: ChannelHandler) {
    if (!channel) return
    let shouldUnsubscribe = subscribedChannels.has(channel)
    if (handler) {
        const handlers = channelHandlers.get(channel)
        if (handlers) {
            handlers.delete(handler)
            if (handlers.size === 0) {
                channelHandlers.delete(channel)
                subscribedChannels.delete(channel)
            } else {
                shouldUnsubscribe = false
            }
        } else {
            shouldUnsubscribe = false
        }
    } else {
        channelHandlers.delete(channel)
        subscribedChannels.delete(channel)
    }
    // 如果 socket 已连接，发送退订消息
    if (shouldUnsubscribe && socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ action: 'unsubscribe', channel }))
    }
}

// 重新订阅所有频道（连接建立时调用）
function resubscribeAllChannels() {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    for (const channel of subscribedChannels) {
        socket.send(JSON.stringify({ action: 'subscribe', channel }))
    }
}

// 分发频道消息
function dispatchChannelMessage(channel: string, data: unknown) {
    const handlers = channelHandlers.get(channel)
    if (!handlers || handlers.size === 0) return
    for (const handler of handlers) {
        try {
            handler(data)
        } catch (error) {
            Logger.error(`频道 ${channel} 处理器执行失败:`, error)
        }
    }
}

// 全局 socket 引用，供频道订阅使用
let socket: WebSocket | null = null

function normalizeEnvValue(value: unknown) {
    return typeof value === 'string' ? value.trim() : ''
}

function toWsOrigin() {
    const baseURL = normalizeEnvValue(import.meta.env.VITE_BASE_URL).replace(/\/+$/, '')
    if (baseURL) {
        return baseURL.replace(/^http:\/\//i, 'ws://').replace(/^https:\/\//i, 'wss://')
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${protocol}//${window.location.host}`
}

function resolveWebSocketURL(ticket: string, locale: string) {
    const explicitURL = normalizeEnvValue(import.meta.env.VITE_NOTIFICATION_WS_URL)
    const base = toWsOrigin()
    let rawURL = explicitURL
    if (!rawURL) {
        const apiPrefixRaw = normalizeEnvValue(import.meta.env.VITE_BASE_API)
        const apiPrefix = apiPrefixRaw ? (apiPrefixRaw.startsWith('/') ? apiPrefixRaw : `/${apiPrefixRaw}`) : '/admin'
        rawURL = `${apiPrefix}/v1/common/ws`
    }

    const url = rawURL.startsWith('ws://') || rawURL.startsWith('wss://') ? new URL(rawURL) : new URL(rawURL, `${base}/`)
    url.searchParams.set('ticket', ticket)
    url.searchParams.set('lang', locale)
    url.searchParams.set('client', 'admin-web')
    return url.toString()
}

function toNotificationLevel(value: unknown): NotificationLevel {
    switch (String(value || '').toLowerCase()) {
        case 'success':
        case 'ok':
        case 'done':
            return 'success'
        case 'warning':
        case 'warn':
        case 'retrying':
        case 'pending':
            return 'warning'
        case 'error':
        case 'danger':
        case 'failed':
            return 'error'
        default:
            return 'info'
    }
}

function buildNotificationId(prefix: string, seed: string) {
    return `${prefix}:${seed || Date.now().toString()}`
}

function toPositiveInteger(value: unknown) {
    const normalized = typeof value === 'string' ? value.trim() : value
    const numeric = Number(normalized)
    if (!Number.isInteger(numeric) || numeric <= 0) {
        return null
    }
    return numeric
}

function isExportMessage(input: Record<string, unknown>) {
    const type = String(input.type || input.event || '').toLowerCase()
    if (type.includes('export')) return true
    if (String(input.category || '').toLowerCase() === 'export') return true
    if (String(input.topic || '').toLowerCase() === 'export.finished') return true
    const actionURL = String(input.action_url || '')
    if (actionURL.includes('/task/center') && actionURL.includes('tab=export')) return true
    const meta = input.meta
    if (meta && typeof meta === 'object' && !Array.isArray(meta)) {
        const scene = String((meta as Record<string, unknown>).scene || '')
        if (scene) return true
    }
    return false
}

export function normalizeNotification(input: Partial<AppNotification> & Record<string, unknown>): AppNotification {
    const exportMessage = isExportMessage(input)

    let msg = ''
    if (typeof input.message === 'string') {
        msg = input.message
    } else if (typeof input.content === 'string') {
        msg = input.content
    } else if (typeof input.body === 'string') {
        msg = input.body
    } else if (input.message && typeof input.message === 'object') {
        const nested = input.message as Record<string, unknown>
        msg = String(nested.message || nested.content || nested.body || '')
    }

    let titleStr = ''
    if (typeof input.title === 'string') {
        titleStr = input.title
    } else if (typeof input.subject === 'string') {
        titleStr = input.subject
    } else if (input.message && typeof input.message === 'object') {
        const nested = input.message as Record<string, unknown>
        titleStr = String(nested.title || nested.subject || '')
    }
    if (!titleStr) {
        titleStr = translate('layout.notification.defaultTitle')
    }

    let actionURL = typeof input.action_url === 'string' ? input.action_url : undefined
    if (actionURL && (actionURL.includes('/v1/file/') || actionURL.includes('/admin/v1/file/'))) {
        actionURL = '/task/center?tab=export'
    }
    actionURL = normalizeNotificationActionUrl(actionURL)

    return {
        id: String(input.id || input.message_id || buildNotificationId(exportMessage ? 'export' : 'ws', `${titleStr}:${input.created_at || Date.now()}`)),
        title: titleStr,
        message: msg,
        level: toNotificationLevel(input.level || input.severity || input.status),
        source: exportMessage || input.source === 'export' ? 'export' : 'websocket',
        read: Boolean(input.read || input.is_read),
        created_at: String(input.created_at || new Date().toISOString()),
        action_url: actionURL || (exportMessage ? '/task/center?tab=export' : undefined),
        action_label: typeof input.action_label === 'string' ? input.action_label : exportMessage ? translate('layout.notification.viewExportCenter') : undefined,
        meta: typeof input.meta === 'object' && input.meta && !Array.isArray(input.meta) ? (input.meta as Record<string, unknown>) : undefined,
        category: typeof input.category === 'string' ? input.category : undefined,
        topic: typeof input.topic === 'string' ? input.topic : undefined,
        read_at: typeof input.read_at === 'string' ? input.read_at : null,
        updated_at: typeof input.updated_at === 'string' ? input.updated_at : undefined,
        payload: input.payload && typeof input.payload === 'object' && !Array.isArray(input.payload) ? (input.payload as Record<string, unknown>) : undefined,
    }
}

function normalizeSocketPayload(rawPayload: NotificationSocketMessage): AppNotification | null {
    let payload = typeof rawPayload.data === 'object' && rawPayload.data && !Array.isArray(rawPayload.data) ? (rawPayload.data as NotificationSocketMessage) : rawPayload

    if (payload.message && typeof payload.message === 'object' && !Array.isArray(payload.message)) {
        payload = {
            ...payload,
            ...(payload.message as Record<string, unknown>),
            message_id: payload.message_id ?? String((payload.message as Record<string, unknown>).id || ''),
        }
    }

    const eventType = String(payload.type || payload.event || '').toLowerCase()
    if (eventType === 'ping' || eventType === 'pong' || eventType === 'message_read' || eventType === 'message_read_all') {
        return null
    }

    const notification = normalizeNotification(payload as Record<string, unknown>)
    if (!notification.message && eventType && eventType !== 'message_created') {
        return null
    }
    if (!notification.title && !notification.message) {
        return null
    }
    return notification
}

function applyRealtimeReadState(payload: NotificationSocketMessage, list: AppNotification[]) {
    const eventType = String(payload.type || payload.event || '').toLowerCase()
    if (eventType === 'message_read') {
        const messageID = toPositiveInteger(payload.message_id ?? payload.id)
        if (!messageID) {
            return false
        }
        const target = list.find((item) => item.id === String(messageID))
        if (target) {
            target.read = true
        }
        return true
    }
    if (eventType === 'message_read_all') {
        list.forEach((item) => {
            item.read = true
        })
        return true
    }
    return false
}

export const useNotificationStore = defineStore(
    'notification',
    () => {
        const notifications = ref<AppNotification[]>([])
        const unreadCount = ref(0)
        const exportFinishedTime = ref<number>(0)
        const connectionStatus = ref<NotificationConnectionStatus>('idle')
        const listLoading = ref(false)
        const lastError = ref('')
        const initialized = ref(false)
        const reconnectAttempt = ref(0)
        const latestAnnouncement = ref('')

        let reconnectTimer: ReturnType<typeof setTimeout> | null = null
        let heartbeatTimer: ReturnType<typeof setInterval> | null = null
        let lastSocketMessageAt = 0
        let currentToken = ''
        let currentLocale = 'zh-CN'
        let isStopping = false

        const hasUnread = computed(() => unreadCount.value > 0)

        const resetReconnectTimer = () => {
            if (!reconnectTimer) return
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }

        const resetHeartbeatTimer = () => {
            if (!heartbeatTimer) return
            clearInterval(heartbeatTimer)
            heartbeatTimer = null
        }

        const startHeartbeat = () => {
            resetHeartbeatTimer()
            lastSocketMessageAt = Date.now()
            heartbeatTimer = setInterval(() => {
                if (!socket || socket.readyState !== WebSocket.OPEN) return
                if (Date.now() - lastSocketMessageAt > HEARTBEAT_TIMEOUT_MS) {
                    Logger.warn('通知 WebSocket 心跳超时，主动断开并等待重连')
                    socket.close()
                    return
                }
                socket.send(JSON.stringify({ action: 'ping' }))
            }, HEARTBEAT_INTERVAL_MS)
        }

        const upsertNotification = (notification: AppNotification, showToast = false) => {
            latestAnnouncement.value = `${notification.title}。${notification.message}`
            const existingIndex = notifications.value.findIndex((item) => item.id === notification.id)
            if (existingIndex >= 0) {
                const existing = notifications.value[existingIndex]
                const nextRead = notification.read ? true : existing.read
                if (existing.read && !nextRead) {
                    unreadCount.value += 1
                }
                notifications.value.splice(existingIndex, 1, {
                    ...existing,
                    ...notification,
                    read: nextRead,
                })
            } else {
                notifications.value.unshift(notification)
                if (!notification.read) {
                    unreadCount.value += 1
                }
                if (notifications.value.length > NOTIFICATION_PANEL_LIMIT) {
                    notifications.value = notifications.value.slice(0, NOTIFICATION_PANEL_LIMIT)
                }
            }

            notifications.value.sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())

            if (showToast) {
                ElNotification({
                    title: notification.title,
                    message: notification.message,
                    type: notification.level,
                    duration: 5000,
                    customClass: 'xl-notification-toast',
                    onClick: () => {
                        const target = normalizeNotificationActionUrl(notification.action_url)
                        if (target) {
                            router.push(target)
                        }
                    },
                })
            }
        }

        const refreshUnreadCount = async () => {
            if (!currentToken) return
            try {
                const result = await systemApi.getNotificationUnreadCount()
                unreadCount.value = Math.max(0, Number(result?.unread_count ?? result?.count ?? 0))
            } catch (error) {
                Logger.error('获取通知未读数失败:', error)
            }
        }

        const loadNotifications = async () => {
            if (!currentToken) return
            listLoading.value = true
            try {
                const response = await systemApi.getNotificationList({ page: 1, per_page: NOTIFICATION_PANEL_LIMIT })
                const normalized = normalizeListData<AppNotification>(response)
                notifications.value = normalized.list
                    .map((item) => normalizeNotification(item as unknown as Record<string, unknown>))
                    .slice(0, NOTIFICATION_PANEL_LIMIT)
                    .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
            } catch (error) {
                Logger.error('获取通知列表失败:', error)
            } finally {
                listLoading.value = false
            }
        }

        const markRead = async (id: string) => {
            const target = notifications.value.find((item) => item.id === id)
            if (target?.read) return true
            const persistedID = toPositiveInteger(id)
            if (!persistedID) {
                if (!target) return false
                target.read = true
                unreadCount.value = Math.max(0, unreadCount.value - 1)
                return true
            }
            if (target) {
                target.read = true
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
            try {
                const result = await systemApi.markNotificationRead({ id: persistedID })
                const nextUnreadCount = Number(result?.unread_count ?? result?.count)
                if (Number.isFinite(nextUnreadCount)) {
                    unreadCount.value = Math.max(0, nextUnreadCount)
                }
                return true
            } catch (error) {
                Logger.error('标记通知已读失败:', error)
                if (target) {
                    target.read = false
                    unreadCount.value += 1
                }
                return false
            }
        }

        const markAllRead = async () => {
            const previous = notifications.value.map((item) => ({ ...item }))
            const previousUnread = unreadCount.value
            notifications.value = notifications.value.map((item) => ({ ...item, read: true }))
            unreadCount.value = 0
            try {
                await systemApi.markAllNotificationsRead()
            } catch (error) {
                Logger.error('全部标记已读失败:', error)
                notifications.value = previous
                unreadCount.value = previousUnread
            }
        }

        const handleSocketMessage = (event: MessageEvent<string>) => {
            try {
                lastSocketMessageAt = Date.now()
                const payload = JSON.parse(event.data) as NotificationSocketMessage

                const topic = String(payload.topic || '').toLowerCase()
                const category = String(payload.category || '').toLowerCase()
                if (topic === 'export.finished' || (category === 'export' && topic === 'export.finished')) {
                    exportFinishedTime.value = Date.now()
                }

                // 检查是否是已订阅的频道消息（type 字段），未订阅的 type 继续走通知事件处理。
                const messageType = String(payload.type || '').toLowerCase()
                if (messageType && messageType !== 'notification' && channelHandlers.has(messageType)) {
                    // 分发到频道处理器
                    dispatchChannelMessage(messageType, payload.data || payload)
                    return
                }

                const list = Array.isArray(payload.list) ? payload.list : Array.isArray(payload.data) ? payload.data : null
                if (list) {
                    list.forEach((item) => {
                        if (!item || typeof item !== 'object' || Array.isArray(item)) return
                        const normalized = normalizeSocketPayload(item as NotificationSocketMessage)
                        if (!normalized) return
                        upsertNotification(normalized, !normalized.read)
                    })
                    if (payload.unread_count != null) {
                        const lastUnreadCount = Number(payload.unread_count)
                        if (!Number.isNaN(lastUnreadCount) && lastUnreadCount >= 0) {
                            unreadCount.value = lastUnreadCount
                        }
                    }
                    return
                }

                if (applyRealtimeReadState(payload, notifications.value)) {
                    if (payload.unread_count != null) {
                        const unread = Number(payload.unread_count)
                        if (!Number.isNaN(unread) && unread >= 0) {
                            unreadCount.value = unread
                        }
                    }
                    return
                }

                const normalized = normalizeSocketPayload(payload)
                if (!normalized) return
                upsertNotification(normalized, !normalized.read)
                if (payload.unread_count != null) {
                    const unread = Number(payload.unread_count)
                    if (!Number.isNaN(unread) && unread >= 0) {
                        unreadCount.value = unread
                    }
                }
            } catch (error) {
                Logger.error('解析通知 WebSocket 消息失败:', error)
            }
        }

        const disconnect = () => {
            resetHeartbeatTimer()
            if (!socket) return
            socket.onopen = null
            socket.onmessage = null
            socket.onclose = null
            socket.onerror = null
            socket.close()
            socket = null
        }

        const scheduleReconnect = () => {
            if (isStopping || !currentToken) return
            resetReconnectTimer()
            reconnectAttempt.value += 1
            connectionStatus.value = 'reconnecting'
            const delay = RECONNECT_DELAYS_MS[reconnectAttempt.value - 1] ?? 60000
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null
                connectSocket()
            }, delay)
        }

        const connectSocket = async () => {
            if (!currentToken) {
                connectionStatus.value = 'disabled'
                return
            }

            resetReconnectTimer()
            disconnect()

            if (import.meta.env.DEV && (import.meta.env.VITE_ENABLE_MOCK === 'true' || import.meta.env.VITE_ENABLE_MOCK_FALLBACK === 'true')) {
                connectionStatus.value = 'connected'
                return
            }

            try {
                connectionStatus.value = reconnectAttempt.value > 0 ? 'reconnecting' : 'connecting'
                const ticketResult = await systemApi.getWsTicket()
                const ticket = ticketResult?.ticket || ''
                if (!ticket) {
                    throw new Error('Get ws ticket failed')
                }

                socket = new WebSocket(resolveWebSocketURL(ticket, currentLocale))
                socket.onopen = () => {
                    connectionStatus.value = 'connected'
                    lastError.value = ''
                    reconnectAttempt.value = 0
                    startHeartbeat()
                    // 重新订阅所有频道
                    resubscribeAllChannels()
                    latestAnnouncement.value = translate('layout.notification.connected') || '通知服务已连接'
                }
                socket.onmessage = handleSocketMessage
                socket.onerror = () => {
                    connectionStatus.value = 'error'
                    lastError.value = translate('layout.notification.connectionError')
                    latestAnnouncement.value = translate('layout.notification.disconnected') || '通知服务连接已断开'
                }
                socket.onclose = (event: CloseEvent) => {
                    disconnect()
                    if (isStopping) {
                        connectionStatus.value = 'idle'
                        return
                    }
                    // 会话被服务端强踢（强制下线/撤销/过期）：停止重连并跳登录，避免无限重连被拒。
                    if (SESSION_TERMINATED_CODES.has(event.code)) {
                        const redirectUrl = router.currentRoute.value.fullPath
                        stop()
                        useAuthStore().logout(redirectUrl)
                        return
                    }
                    scheduleReconnect()
                }
            } catch (error) {
                Logger.error('创建通知 WebSocket 连接失败:', error)
                connectionStatus.value = 'error'
                lastError.value = translate('layout.notification.connectionError')
                scheduleReconnect()
            }
        }

        const start = (token: string, locale: string) => {
            currentToken = token
            currentLocale = locale
            initialized.value = true
            isStopping = false

            if (!token) {
                stop()
                return
            }

            void Promise.all([loadNotifications(), refreshUnreadCount()])
            connectSocket()
        }

        const stop = () => {
            isStopping = true
            currentToken = ''
            disconnect()
            resetReconnectTimer()
            resetHeartbeatTimer()
            reconnectAttempt.value = 0
            connectionStatus.value = 'idle'
            lastError.value = ''
            unreadCount.value = 0
            channelHandlers.clear()
            subscribedChannels.clear()
            exportFinishedTime.value = 0
        }

        const reconnect = () => {
            if (!currentToken) return
            reconnectAttempt.value = 0
            connectSocket()
        }

        return {
            notifications,
            unreadCount,
            exportFinishedTime,
            hasUnread,
            connectionStatus,
            listLoading,
            lastError,
            initialized,
            loadNotifications,
            refreshUnreadCount,
            markRead,
            markAllRead,
            latestAnnouncement,
            start,
            stop,
            reconnect,
            subscribeChannel,
            unsubscribeChannel,
        }
    },
    {
        persist: {
            key: NOTIFICATION_PERSIST_KEY,
            storage: localStorage,
            paths: ['unreadCount'],
        },
    }
)
