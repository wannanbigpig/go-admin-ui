import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { normalizeNotificationActionUrl } from '@/utils/notificationAction'

const hoisted = vi.hoisted(() => {
    const mockGetNotificationList = vi.fn()
    const mockGetNotificationUnreadCount = vi.fn()
    const mockMarkNotificationRead = vi.fn()
    const mockRouter = {
        push: vi.fn(),
    }
    return {
        mockGetNotificationList,
        mockGetNotificationUnreadCount,
        mockMarkNotificationRead,
        mockRouter,
    }
})

vi.mock('@/api/system', () => ({
    getNotificationList: hoisted.mockGetNotificationList,
    getNotificationUnreadCount: hoisted.mockGetNotificationUnreadCount,
    markNotificationRead: hoisted.mockMarkNotificationRead,
    markAllNotificationsRead: vi.fn(),
    getWsTicket: vi.fn().mockResolvedValue({ ticket: 'mock-ticket' }),
}))

vi.mock('@/router', () => ({
    default: hoisted.mockRouter,
}))

vi.mock('@/locales', () => ({
    translate: (key: string) => key,
}))

vi.mock('@/utils/logger', () => ({
    Logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    },
}))

const originalWebSocket = globalThis.WebSocket
const mockSockets: MockWebSocket[] = []

class MockWebSocket {
    static readonly OPEN = 1
    static readonly CLOSED = 3

    readyState = MockWebSocket.OPEN
    sent: string[] = []
    onopen: ((event: Event) => void) | null = null
    onmessage: ((event: MessageEvent<string>) => void) | null = null
    onclose: ((event: CloseEvent) => void) | null = null
    onerror: ((event: Event) => void) | null = null

    constructor(public url: string) {
        mockSockets.push(this)
        setTimeout(() => {
            this.onopen?.(new Event('open'))
        }, 0)
    }

    send(data: string) {
        this.sent.push(data)
    }

    close() {
        this.readyState = MockWebSocket.CLOSED
    }

    emitMessage(data: string) {
        this.onmessage?.({ data } as MessageEvent<string>)
    }
}

const sentActions = (socket: MockWebSocket, action: string) => socket.sent.map((item) => JSON.parse(item) as { action?: string; channel?: string }).filter((item) => item.action === action)

import { subscribeChannel, unsubscribeChannel, useNotificationStore } from '@/stores/notification'

describe('stores/notification.ts', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        Object.defineProperty(globalThis, 'WebSocket', {
            value: MockWebSocket,
            configurable: true,
        })
        mockSockets.length = 0
        hoisted.mockGetNotificationList.mockReset()
        hoisted.mockGetNotificationUnreadCount.mockReset()
        hoisted.mockMarkNotificationRead.mockReset()
        hoisted.mockRouter.push.mockReset()
        hoisted.mockGetNotificationList.mockResolvedValue({ list: [], total: 0 })
        hoisted.mockGetNotificationUnreadCount.mockResolvedValue({ unread_count: 0 })
    })

    afterEach(() => {
        useNotificationStore().stop()
        unsubscribeChannel('monitor')
        Object.defineProperty(globalThis, 'WebSocket', {
            value: originalWebSocket,
            configurable: true,
        })
    })

    it('loadNotifications 应当能把后端的文件下载 action_url 自动规一化为前端路由，以防止 404', async () => {
        const store = useNotificationStore()

        // 模拟后端返回的通知列表，带有文件下载链接的 action_url
        const mockResponse = {
            list: [
                {
                    id: '123',
                    title: '请求日志导出完成',
                    message: '请求日志导出已完成，可前往任务中心下载。',
                    level: 'success',
                    category: 'export',
                    topic: 'export.finished',
                    action_url: '/admin/v1/file/bca241ce21304189a63736138ce00527',
                    created_at: new Date().toISOString(),
                },
            ],
            total: 1,
        }

        hoisted.mockGetNotificationList.mockResolvedValue(mockResponse)

        // 启动并注入 token
        store.start('valid-token', 'zh-CN')

        await store.loadNotifications()

        expect(store.notifications.length).toBe(1)
        // 关键断言：action_url 必须已被清洗为前端路由
        expect(store.notifications[0].action_url).toBe('/task/center?tab=export')
    })

    it('normalizeNotificationActionUrl 应该能正确清洗和白名单验证 action_url', () => {
        expect(normalizeNotificationActionUrl('/task/center')).toBe('/task/center')
        expect(normalizeNotificationActionUrl('https://example.com')).toBeUndefined()
        expect(normalizeNotificationActionUrl('//example.com')).toBeUndefined()
        expect(normalizeNotificationActionUrl('javascript:alert(1)')).toBeUndefined()
        expect(normalizeNotificationActionUrl('/task\\center')).toBeUndefined()
        expect(normalizeNotificationActionUrl(undefined)).toBeUndefined()
    })

    it('markRead 在本地缓存未命中时仍应调用后端并同步未读数', async () => {
        const store = useNotificationStore()
        hoisted.mockMarkNotificationRead.mockResolvedValue({ updated: true, unread_count: 3 })

        const success = await store.markRead('123')

        expect(success).toBe(true)
        expect(hoisted.mockMarkNotificationRead).toHaveBeenCalledWith({ id: 123 })
        expect(store.unreadCount).toBe(3)
    })

    it('markRead 调用后端失败时应回滚本地缓存状态', async () => {
        const store = useNotificationStore()
        store.notifications.push({
            id: '123',
            title: 'title',
            message: 'message',
            level: 'info',
            source: 'websocket',
            read: false,
            created_at: new Date().toISOString(),
        })
        store.unreadCount = 1
        hoisted.mockMarkNotificationRead.mockRejectedValue(new Error('boom'))

        const success = await store.markRead('123')

        expect(success).toBe(false)
        expect(store.notifications[0].read).toBe(false)
        expect(store.unreadCount).toBe(1)
    })

    it('message_read 事件不应被频道分发逻辑吞掉', async () => {
        const store = useNotificationStore()
        store.start('valid-token', 'zh-CN')
        await vi.waitFor(() => expect(store.connectionStatus).toBe('connected'))

        store.notifications.push({
            id: '123',
            title: 'title',
            message: 'message',
            level: 'info',
            source: 'websocket',
            read: false,
            created_at: new Date().toISOString(),
        })
        store.unreadCount = 1

        mockSockets[0].emitMessage(
            JSON.stringify({
                type: 'message_read',
                message_id: '123',
                unread_count: 0,
            })
        )

        expect(store.notifications[0].read).toBe(true)
        expect(store.unreadCount).toBe(0)
    })

    it('同一频道仍有其它 handler 时不应向服务端退订', async () => {
        const store = useNotificationStore()
        store.start('valid-token', 'zh-CN')
        await vi.waitFor(() => expect(store.connectionStatus).toBe('connected'))

        const socket = mockSockets[0]
        const firstHandler = vi.fn()
        const secondHandler = vi.fn()

        subscribeChannel('monitor', firstHandler)
        subscribeChannel('monitor', secondHandler)
        expect(sentActions(socket, 'subscribe')).toEqual([{ action: 'subscribe', channel: 'monitor' }])

        unsubscribeChannel('monitor', firstHandler)
        expect(sentActions(socket, 'unsubscribe')).toEqual([])

        unsubscribeChannel('monitor', secondHandler)
        expect(sentActions(socket, 'unsubscribe')).toEqual([{ action: 'unsubscribe', channel: 'monitor' }])
    })

    it('stop 应当彻底清理 channelHandlers, subscribedChannels 和 exportFinishedTime', async () => {
        const store = useNotificationStore()
        store.start('valid-token', 'zh-CN')
        await vi.waitFor(() => expect(store.connectionStatus).toBe('connected'))

        // 订阅一个频道，改变 exportFinishedTime
        const handler = vi.fn()
        subscribeChannel('test-channel', handler)
        store.exportFinishedTime = 123456

        store.stop()

        expect(store.exportFinishedTime).toBe(0)

        // 验证全局订阅列表是否被清空：如果被清空，那么再次登录时不会重新订阅 'test-channel'
        store.start('valid-token', 'zh-CN')
        await vi.waitFor(() => expect(store.connectionStatus).toBe('connected'))
        const socket = mockSockets[1] // 新创建的 socket 应该是第二个了
        expect(sentActions(socket, 'subscribe')).toEqual([])
    })

    it('接收到 topic 为 export.finished 时应当拦截并更新 exportFinishedTime', async () => {
        const store = useNotificationStore()
        store.start('valid-token', 'zh-CN')
        await vi.waitFor(() => expect(store.connectionStatus).toBe('connected'))

        expect(store.exportFinishedTime).toBe(0)

        mockSockets[0].emitMessage(
            JSON.stringify({
                topic: 'export.finished',
                id: '999',
                title: 'Export success',
                message: 'Your export is done',
                level: 'success',
                category: 'export',
            })
        )

        expect(store.exportFinishedTime).toBeGreaterThan(0)
    })

    it('连接建立后应定时发送 ping 保活', async () => {
        vi.useFakeTimers()
        try {
            const store = useNotificationStore()
            store.start('valid-token', 'zh-CN')
            await vi.advanceTimersByTimeAsync(0)
            await vi.waitFor(() => expect(store.connectionStatus).toBe('connected'))

            const socket = mockSockets[0]
            await vi.advanceTimersByTimeAsync(30000)

            expect(sentActions(socket, 'ping')).toEqual([{ action: 'ping' }])
        } finally {
            useNotificationStore().stop()
            vi.useRealTimers()
        }
    })

    it('收到 pong 后应刷新心跳时间，避免空闲连接被误断开', async () => {
        vi.useFakeTimers()
        try {
            const store = useNotificationStore()
            store.start('valid-token', 'zh-CN')
            await vi.advanceTimersByTimeAsync(0)
            await vi.waitFor(() => expect(store.connectionStatus).toBe('connected'))

            const socket = mockSockets[0]
            await vi.advanceTimersByTimeAsync(60000)
            socket.emitMessage(JSON.stringify({ type: 'pong' }))
            await vi.advanceTimersByTimeAsync(60000)

            expect(socket.readyState).toBe(MockWebSocket.OPEN)
            expect(store.notifications).toEqual([])
        } finally {
            useNotificationStore().stop()
            vi.useRealTimers()
        }
    })

    it('心跳超时时应主动关闭半开连接以触发重连', async () => {
        vi.useFakeTimers()
        try {
            const store = useNotificationStore()
            store.start('valid-token', 'zh-CN')
            await vi.advanceTimersByTimeAsync(0)
            await vi.waitFor(() => expect(store.connectionStatus).toBe('connected'))

            const socket = mockSockets[0]
            await vi.advanceTimersByTimeAsync(120000)

            expect(socket.readyState).toBe(MockWebSocket.CLOSED)
        } finally {
            useNotificationStore().stop()
            vi.useRealTimers()
        }
    })
})
