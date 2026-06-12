import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiCache } from '@/utils/apiCache'

const hoisted = vi.hoisted(() => {
    return {
        mockGet: vi.fn(),
        mockPost: vi.fn(),
        locale: 'zh-CN',
    }
})

vi.mock('@/utils/request', () => ({
    get: hoisted.mockGet,
    post: hoisted.mockPost,
}))

vi.mock('@/stores/setting', () => ({
    useSettingStore: () => ({
        locale: hoisted.locale,
    }),
}))

vi.mock('@/locales', () => ({
    DEFAULT_LOCALE: 'zh-CN',
}))

import { getMenuList, refreshAllMenuPermissions } from '@/api/permission'

describe('api/permission.ts', () => {
    beforeEach(() => {
        apiCache.clear()
        hoisted.mockGet.mockReset()
        hoisted.mockPost.mockReset()
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

    it('refreshAllMenuPermissions 应调用后端刷新接口并清理菜单缓存', async () => {
        hoisted.mockGet.mockResolvedValueOnce([{ id: 1, title: '菜单' }])
        await getMenuList({ status: 1 })
        await getMenuList({ status: 1 })
        expect(hoisted.mockGet).toHaveBeenCalledTimes(1)

        hoisted.mockPost.mockResolvedValueOnce({})
        await expect(refreshAllMenuPermissions()).resolves.toEqual({})

        hoisted.mockGet.mockResolvedValueOnce([{ id: 2, title: '菜单2' }])
        await expect(getMenuList({ status: 1 })).resolves.toEqual([{ id: 2, title: '菜单2' }])
        expect(hoisted.mockPost).toHaveBeenCalledWith('/v1/menu/update-all-menu-permissions')
        expect(hoisted.mockGet).toHaveBeenCalledTimes(2)
    })
})
