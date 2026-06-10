import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

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
})
