import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ElNotification } from 'element-plus'
import router from '@/router'
import * as systemApi from '@/api/system'
import { normalizeListData } from '@/modules/shared/response'
import type { AppNotification, NotificationConnectionStatus, NotificationLevel, NotificationSocketMessage } from '@/types/notification'
import { Logger } from '@/utils/logger'
import { translate } from '@/locales'

const NOTIFICATION_PERSIST_KEY = 'notification'
const NOTIFICATION_PANEL_LIMIT = 50
const RECONNECT_BASE_DELAY_MS = 3000
const RECONNECT_MAX_DELAY_MS = 30000

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

function resolveWebSocketURL(token: string, locale: string) {
    const explicitURL = normalizeEnvValue(import.meta.env.VITE_NOTIFICATION_WS_URL)
    const base = toWsOrigin()
    let rawURL = explicitURL
    if (!rawURL) {
        const apiPrefixRaw = normalizeEnvValue(import.meta.env.VITE_BASE_API)
        const apiPrefix = apiPrefixRaw ? (apiPrefixRaw.startsWith('/') ? apiPrefixRaw : `/${apiPrefixRaw}`) : '/admin'
        rawURL = `${apiPrefix}/v1/system/notification/ws`
    }

    const url = rawURL.startsWith('ws://') || rawURL.startsWith('wss://') ? new URL(rawURL) : new URL(rawURL, `${base}/`)
    url.searchParams.set('token', token)
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

function normalizeNotification(input: Partial<AppNotification> & Record<string, unknown>): AppNotification {
    const exportMessage = isExportMessage(input)
    return {
        id: String(input.id || input.message_id || buildNotificationId(exportMessage ? 'export' : 'ws', `${input.title || input.subject || 'msg'}:${input.created_at || Date.now()}`)),
        title: String(input.title || input.subject || translate('layout.notification.defaultTitle')),
        message: String(input.message || input.content || input.body || ''),
        level: toNotificationLevel(input.level || input.severity || input.status),
        source: exportMessage || input.source === 'export' ? 'export' : 'websocket',
        read: Boolean(input.read || input.is_read),
        created_at: String(input.created_at || new Date().toISOString()),
        action_url: typeof input.action_url === 'string' ? input.action_url : exportMessage ? '/task/center?tab=export' : undefined,
        action_label: typeof input.action_label === 'string' ? input.action_label : exportMessage ? translate('layout.notification.viewExportCenter') : undefined,
        meta: typeof input.meta === 'object' && input.meta && !Array.isArray(input.meta) ? (input.meta as Record<string, unknown>) : undefined,
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

    if (String(payload.type || payload.event || '').toLowerCase() === 'ping') {
        return null
    }

    const notification = normalizeNotification(payload as Record<string, unknown>)
    if (!notification.title && !notification.message) {
        return null
    }
    return notification
}

export const useNotificationStore = defineStore(
    'notification',
    () => {
        const notifications = ref<AppNotification[]>([])
        const unreadCount = ref(0)
        const connectionStatus = ref<NotificationConnectionStatus>('idle')
        const listLoading = ref(false)
        const lastError = ref('')
        const initialized = ref(false)
        const reconnectAttempt = ref(0)

        let socket: WebSocket | null = null
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null
        let currentToken = ''
        let currentLocale = 'zh-CN'
        let isStopping = false

        const hasUnread = computed(() => unreadCount.value > 0)

        const resetReconnectTimer = () => {
            if (!reconnectTimer) return
            clearTimeout(reconnectTimer)
            reconnectTimer = null
        }

        const upsertNotification = (notification: AppNotification, showToast = false) => {
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
                    onClick: () => {
                        if (notification.action_url) {
                            router.push(notification.action_url)
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
            if (!target || target.read) return
            target.read = true
            unreadCount.value = Math.max(0, unreadCount.value - 1)
            try {
                await systemApi.markNotificationRead({ id })
            } catch (error) {
                Logger.error('标记通知已读失败:', error)
                target.read = false
                unreadCount.value += 1
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
                const payload = JSON.parse(event.data) as NotificationSocketMessage
                const list = Array.isArray(payload.list) ? payload.list : Array.isArray(payload.data) ? payload.data : null
                if (list) {
                    list.forEach((item) => {
                        if (!item || typeof item !== 'object' || Array.isArray(item)) return
                        const normalized = normalizeSocketPayload(item as NotificationSocketMessage)
                        if (!normalized) return
                        upsertNotification(normalized, normalized.source === 'export' && !normalized.read)
                    })
                    const lastUnreadCount = Number(payload.unread_count ?? 0)
                    if (!Number.isNaN(lastUnreadCount) && lastUnreadCount >= 0) {
                        unreadCount.value = lastUnreadCount
                    }
                    return
                }

                const normalized = normalizeSocketPayload(payload)
                if (!normalized) return
                upsertNotification(normalized, normalized.source === 'export' && !normalized.read)
                const unread = Number(payload.unread_count ?? 0)
                if (!Number.isNaN(unread) && unread >= 0) {
                    unreadCount.value = unread
                }
            } catch (error) {
                Logger.error('解析通知 WebSocket 消息失败:', error)
            }
        }

        const disconnect = () => {
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
            const delay = Math.min(RECONNECT_BASE_DELAY_MS * Math.max(1, reconnectAttempt.value), RECONNECT_MAX_DELAY_MS)
            reconnectTimer = setTimeout(() => {
                reconnectTimer = null
                connectSocket()
            }, delay)
        }

        const connectSocket = () => {
            if (!currentToken) {
                connectionStatus.value = 'disabled'
                return
            }

            resetReconnectTimer()
            disconnect()

            try {
                connectionStatus.value = reconnectAttempt.value > 0 ? 'reconnecting' : 'connecting'
                socket = new WebSocket(resolveWebSocketURL(currentToken, currentLocale))
                socket.onopen = () => {
                    connectionStatus.value = 'connected'
                    lastError.value = ''
                    reconnectAttempt.value = 0
                }
                socket.onmessage = handleSocketMessage
                socket.onerror = () => {
                    connectionStatus.value = 'error'
                    lastError.value = translate('layout.notification.connectionError')
                }
                socket.onclose = () => {
                    disconnect()
                    if (isStopping) {
                        connectionStatus.value = 'idle'
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

            unreadCount.value = 0
            void Promise.all([loadNotifications(), refreshUnreadCount()])
            connectSocket()
        }

        const stop = () => {
            isStopping = true
            currentToken = ''
            disconnect()
            resetReconnectTimer()
            reconnectAttempt.value = 0
            connectionStatus.value = 'idle'
            lastError.value = ''
            unreadCount.value = 0
        }

        const reconnect = () => {
            if (!currentToken) return
            reconnectAttempt.value = 0
            connectSocket()
        }

        return {
            notifications,
            unreadCount,
            hasUnread,
            connectionStatus,
            listLoading,
            lastError,
            initialized,
            loadNotifications,
            refreshUnreadCount,
            markRead,
            markAllRead,
            start,
            stop,
            reconnect,
        }
    },
    {
        persist: {
            key: NOTIFICATION_PERSIST_KEY,
            storage: localStorage,
            paths: ['notifications', 'unreadCount'],
        },
    }
)
