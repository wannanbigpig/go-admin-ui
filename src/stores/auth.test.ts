import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const hoisted = vi.hoisted(() => {
    const mockFetchCurrentUser = vi.fn()
    const mockFetchUserMenuTree = vi.fn()
    const mockSubmitLogin = vi.fn()
    const mockConvertRoute = vi.fn()
    const mockAddDynamicRoutes = vi.fn()
    const mockRemoveDynamicRoute = vi.fn()
    const mockFindFirstValidRoute = vi.fn()
    const mockLogoutApi = vi.fn()

    const localStorageStore: Record<string, string> = {}
    const mockLocalStorage = {
        getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
            localStorageStore[key] = value
        }),
        removeItem: vi.fn((key: string) => {
            delete localStorageStore[key]
        }),
        clear: vi.fn(() => {
            Object.keys(localStorageStore).forEach((k) => delete localStorageStore[k])
        }),
    }

    return {
        mockFetchCurrentUser,
        mockFetchUserMenuTree,
        mockSubmitLogin,
        mockConvertRoute,
        mockAddDynamicRoutes,
        mockRemoveDynamicRoute,
        mockFindFirstValidRoute,
        mockLocalStorage,
        mockLogoutApi,
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

vi.stubGlobal('localStorage', hoisted.mockLocalStorage)

vi.mock('@/modules/auth/service', () => ({
    fetchCurrentUser: hoisted.mockFetchCurrentUser,
    fetchUserMenuTree: hoisted.mockFetchUserMenuTree,
    loginWithCredentials: hoisted.mockSubmitLogin,
}))

vi.mock('@/api/auth', () => ({
    logout: hoisted.mockLogoutApi,
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
    findFirstValidRoute: hoisted.mockFindFirstValidRoute,
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
        hoisted.mockLocalStorage.clear()
        hoisted.mockLocalStorage.getItem.mockClear()
        hoisted.mockLocalStorage.setItem.mockClear()
        hoisted.mockLocalStorage.removeItem.mockClear()
        hoisted.mockFetchCurrentUser.mockReset()
        hoisted.mockFetchUserMenuTree.mockReset()
        hoisted.mockSubmitLogin.mockReset()
        hoisted.mockConvertRoute.mockReset()
        hoisted.mockAddDynamicRoutes.mockReset()
        hoisted.mockRemoveDynamicRoute.mockReset()
        hoisted.mockFindFirstValidRoute.mockReset()
        hoisted.mockRouter.push.mockReset()
        hoisted.mockLogoutApi.mockReset()
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

    it('refreshUserInfo 不应因滑动刷新 token 更新版本而丢弃用户和菜单响应', async () => {
        const store = useAuthStore()
        const menuList = [{ id: 1, title: '用户管理', path: '/permission/adminUser' }] as UserPermission[]
        const convertedRoutes = [{ path: '/permission/adminUser', name: 'adminUser' }]
        let resolveUserInfo!: (value: { id: number; username: string; nickname: string; avatar: string }) => void
        let resolveMenuList!: (value: UserPermission[]) => void

        hoisted.mockFetchCurrentUser.mockReturnValue(
            new Promise((resolve) => {
                resolveUserInfo = resolve
            })
        )
        hoisted.mockFetchUserMenuTree.mockReturnValue(
            new Promise((resolve) => {
                resolveMenuList = resolve
            })
        )
        hoisted.mockConvertRoute.mockReturnValue(convertedRoutes)

        const refreshPromise = store.refreshUserInfo()
        store.updateToken('sliding-token', Math.floor(Date.now() / 1000) + 3600)

        resolveUserInfo({
            id: 1,
            username: 'admin',
            nickname: '管理员',
            avatar: '',
        })
        resolveMenuList(menuList)
        await refreshPromise

        expect(store.access_token).toBe('sliding-token')
        expect(store.userInfo.username).toBe('admin')
        expect(store.menu).toEqual(menuList)
        expect(hoisted.mockAddDynamicRoutes).toHaveBeenCalledWith(convertedRoutes)
    })

    it('handleTokenExpired 应触发弹窗并在确认时吊销 refresh_token 并本地退出', async () => {
        const store = useAuthStore()
        store.updateToken('test-access', Math.floor(Date.now() / 1000) + 3600, 'test-refresh', Math.floor(Date.now() / 1000) + 7200)

        const { ElMessageBox } = await import('element-plus')
        vi.mocked(ElMessageBox.alert).mockImplementation((msg, title, options) => {
            if (options && typeof options.callback === 'function') {
                options.callback('confirm', {} as any)
            }
            return Promise.resolve({ action: 'confirm', value: '' } as any)
        })

        hoisted.mockLogoutApi.mockResolvedValue({})

        store.handleTokenExpired()

        expect(hoisted.mockLogoutApi).toHaveBeenCalledWith('test-refresh')
        expect(store.access_token).toBe('')
        expect(store.refresh_token).toBe('')
        expect(hoisted.mockRouter.push).toHaveBeenCalledWith({
            name: 'Login',
            query: { redirect: '/system/user' }
        })
    })

    it('handleTokenExpired 在吊销 refresh_token 失败时仍应本地退出', async () => {
        const store = useAuthStore()
        store.updateToken('test-access', Math.floor(Date.now() / 1000) + 3600, 'test-refresh', Math.floor(Date.now() / 1000) + 7200)

        const { ElMessageBox } = await import('element-plus')
        vi.mocked(ElMessageBox.alert).mockImplementation((msg, title, options) => {
            if (options && typeof options.callback === 'function') {
                options.callback('confirm', {} as any)
            }
            return Promise.resolve({ action: 'confirm', value: '' } as any)
        })

        hoisted.mockLogoutApi.mockRejectedValue(new Error('Revoke network error'))

        store.handleTokenExpired()

        expect(hoisted.mockLogoutApi).toHaveBeenCalledWith('test-refresh')
        expect(store.access_token).toBe('')
        expect(store.refresh_token).toBe('')
        expect(hoisted.mockRouter.push).toHaveBeenCalledWith({
            name: 'Login',
            query: { redirect: '/system/user' }
        })
    })
})
