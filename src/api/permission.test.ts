import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiCache } from '@/utils/apiCache'

const hoisted = vi.hoisted(() => {
    return {
        mockGet: vi.fn(),
        locale: 'zh-CN',
    }
})

vi.mock('@/utils/request', () => ({
    get: hoisted.mockGet,
    post: vi.fn(),
}))

vi.mock('@/stores/setting', () => ({
    useSettingStore: () => ({
        locale: hoisted.locale,
    }),
}))

vi.mock('@/locales', () => ({
    DEFAULT_LOCALE: 'zh-CN',
}))

import { getMenuList } from '@/api/permission'

describe('api/permission.ts', () => {
    beforeEach(() => {
        apiCache.clear()
        hoisted.mockGet.mockReset()
        hoisted.locale = 'zh-CN'
    })

    it('getMenuList 缓存 key 应包含当前语言', async () => {
        hoisted.mockGet.mockResolvedValueOnce([{ id: 1, title: '菜单' }]).mockResolvedValueOnce([{ id: 1, title: 'Menu' }])

        await expect(getMenuList({ status: 1 })).resolves.toEqual([{ id: 1, title: '菜单' }])
        await expect(getMenuList({ status: 1 })).resolves.toEqual([{ id: 1, title: '菜单' }])

        hoisted.locale = 'en-US'
        await expect(getMenuList({ status: 1 })).resolves.toEqual([{ id: 1, title: 'Menu' }])

        expect(hoisted.mockGet).toHaveBeenCalledTimes(2)
    })
})
