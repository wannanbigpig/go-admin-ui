import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const hoisted = vi.hoisted(() => {
    const mockFetchCurrentUser = vi.fn()
    const mockFetchUserMenuTree = vi.fn()
    const mockSubmitLogin = vi.fn()
    const mockConvertRoute = vi.fn()
    const mockAddDynamicRoutes = vi.fn()
    const mockRemoveDynamicRoute = vi.fn()

    return {
        mockFetchCurrentUser,
        mockFetchUserMenuTree,
        mockSubmitLogin,
        mockConvertRoute,
        mockAddDynamicRoutes,
        mockRemoveDynamicRoute,
        mockRouter: {
            push: vi.fn(),
            currentRoute: {
                value: {
                    fullPath: '/system/user',
                },
            },
        },
        mockLogger: {
            error: vi.fn(),
        },
    }
})

vi.mock('@/modules/auth/service', () => ({
    fetchCurrentUser: hoisted.mockFetchCurrentUser,
    fetchUserMenuTree: hoisted.mockFetchUserMenuTree,
    loginWithCredentials: hoisted.mockSubmitLogin,
}))

vi.mock('@/modules/auth/model', () => ({
    createEmptyUserInfo: () => ({
        id: 0,
        username: '',
        nickname: '',
        avatar: '',
    }),
}))

vi.mock('@/router', () => ({
    default: hoisted.mockRouter,
}))

vi.mock('@/router/dynamicRoutes', () => ({
    convertRoute: hoisted.mockConvertRoute,
    addDynamicRoutes: hoisted.mockAddDynamicRoutes,
    removeDynamicRoute: hoisted.mockRemoveDynamicRoute,
}))

vi.mock('element-plus', () => ({
    ElMessageBox: {
        alert: vi.fn(),
    },
}))

vi.mock('@/utils/logger', () => ({
    Logger: hoisted.mockLogger,
}))

vi.mock('@/locales', () => ({
    translate: (key: string) => key,
}))

import { useAuthStore } from '@/stores/auth'
import type { UserPermission } from '@/types/auth'

describe('stores/auth.ts', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        hoisted.mockFetchCurrentUser.mockReset()
        hoisted.mockFetchUserMenuTree.mockReset()
        hoisted.mockSubmitLogin.mockReset()
        hoisted.mockConvertRoute.mockReset()
        hoisted.mockAddDynamicRoutes.mockReset()
        hoisted.mockRemoveDynamicRoute.mockReset()
        hoisted.mockRouter.push.mockReset()
    })

    it('refreshUserInfo 应在菜单刷新后立即同步动态路由', async () => {
        const store = useAuthStore()
        const menuList = [{ id: 1, title: '用户管理', path: '/permission/adminUser' }] as UserPermission[]
        const convertedRoutes = [{ path: '/permission/adminUser', name: 'adminUser' }]

        hoisted.mockFetchCurrentUser.mockResolvedValue({
            id: 1,
            username: 'admin',
            nickname: '管理员',
            avatar: '',
        })
        hoisted.mockFetchUserMenuTree.mockResolvedValue(menuList)
        hoisted.mockConvertRoute.mockReturnValue(convertedRoutes)

        await store.refreshUserInfo()

        expect(store.userInfo.username).toBe('admin')
        expect(store.menu).toEqual(menuList)
        expect(hoisted.mockConvertRoute).toHaveBeenCalledWith(menuList)
        expect(hoisted.mockAddDynamicRoutes).toHaveBeenCalledWith(convertedRoutes)
        expect(hoisted.mockRemoveDynamicRoute).not.toHaveBeenCalled()
    })

    it('refreshUserInfo 在菜单为空时应清理旧动态路由', async () => {
        const store = useAuthStore()
        const menuList = [] as UserPermission[]

        hoisted.mockFetchCurrentUser.mockResolvedValue({
            id: 1,
            username: 'admin',
            nickname: '管理员',
            avatar: '',
        })
        hoisted.mockFetchUserMenuTree.mockResolvedValue(menuList)
        hoisted.mockConvertRoute.mockReturnValue([])

        await store.refreshUserInfo()

        expect(hoisted.mockAddDynamicRoutes).not.toHaveBeenCalled()
        expect(hoisted.mockRemoveDynamicRoute).toHaveBeenCalledTimes(1)
    })
})
