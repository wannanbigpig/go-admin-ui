import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const hoisted = vi.hoisted(() => {
    const mockGetNotificationList = vi.fn()
    const mockGetNotificationUnreadCount = vi.fn()
    const mockRouter = {
        push: vi.fn(),
    }
    return {
        mockGetNotificationList,
        mockGetNotificationUnreadCount,
        mockRouter,
    }
})

vi.mock('@/api/system', () => ({
    getNotificationList: hoisted.mockGetNotificationList,
    getNotificationUnreadCount: hoisted.mockGetNotificationUnreadCount,
    markNotificationRead: vi.fn(),
    markAllNotificationsRead: vi.fn(),
    getWsTicket: vi.fn().mockResolvedValue({ ticket: 'mock-ticket' }),
}))

vi.mock('@/router', () => ({
    default: hoisted.mockRouter,
}))

vi.mock('@/locales', () => ({
    translate: (key: string) => key,
}))

import { useNotificationStore } from '@/stores/notification'

describe('stores/notification.ts', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        hoisted.mockGetNotificationList.mockReset()
        hoisted.mockGetNotificationUnreadCount.mockReset()
        hoisted.mockRouter.push.mockReset()
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
})
