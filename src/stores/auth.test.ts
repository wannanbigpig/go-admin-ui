import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { createApp, nextTick } from 'vue'
import { createPersistedState } from 'pinia-plugin-persistedstate'

const hoisted = vi.hoisted(() => {
    const mockFetchCurrentUser = vi.fn()
    const mockFetchUserMenuTree = vi.fn()
    const mockSubmitLogin = vi.fn()
    const mockSubmitSmsLogin = vi.fn()
    const mockConvertRoute = vi.fn()
    const mockAddDynamicRoutes = vi.fn()
    const mockRemoveDynamicRoute = vi.fn()
    const mockFindFirstValidRoute = vi.fn()
    const mockRefreshAccessTokenApi = vi.fn()
    const mockApiCacheClear = vi.fn()

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
        mockSubmitSmsLogin,
        mockConvertRoute,
        mockAddDynamicRoutes,
        mockRemoveDynamicRoute,
        mockFindFirstValidRoute,
        mockLocalStorage,
        mockRefreshAccessTokenApi,
        mockApiCacheClear,
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
    loginWithSmsCode: hoisted.mockSubmitSmsLogin,
}))

vi.mock('@/api/auth', () => ({
    checkToken: vi.fn(),
    refreshAccessToken: hoisted.mockRefreshAccessTokenApi,
}))

vi.mock('@/utils/apiCache', () => ({
    apiCache: {
        clear: hoisted.mockApiCacheClear,
    },
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
        hoisted.mockSubmitSmsLogin.mockReset()
        hoisted.mockConvertRoute.mockReset()
        hoisted.mockAddDynamicRoutes.mockReset()
        hoisted.mockRemoveDynamicRoute.mockReset()
        hoisted.mockFindFirstValidRoute.mockReset()
        hoisted.mockRouter.push.mockReset()
        hoisted.mockRefreshAccessTokenApi.mockReset()
        hoisted.mockApiCacheClear.mockReset()
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

    it('短信登录应复用 token、用户信息和动态菜单初始化流程', async () => {
        const store = useAuthStore()
        const expiresAt = Math.floor(Date.now() / 1000) + 3600
        const menuList = [{ id: 1, title: '首页', path: '/' }] as UserPermission[]
        hoisted.mockSubmitSmsLogin.mockResolvedValue({ access_token: 'sms-access', token_type: 'Bearer', expires_at: expiresAt })
        hoisted.mockFetchCurrentUser.mockResolvedValue({ id: 1, username: 'sms-user', nickname: '短信用户', avatar: '' })
        hoisted.mockFetchUserMenuTree.mockResolvedValue(menuList)
        hoisted.mockConvertRoute.mockReturnValue([{ path: '/', name: 'Home' }])
        const payload = { country_code: '86', phone_number: '13800138000', sms_code: '123456', challenge_id: 'challenge-id' }

        await store.loginWithSmsCode(payload)

        expect(hoisted.mockSubmitSmsLogin).toHaveBeenCalledWith(payload)
        expect(store.access_token).toBe('sms-access')
        expect(store.userInfo.username).toBe('sms-user')
        expect(store.menu).toEqual(menuList)
        expect(hoisted.mockAddDynamicRoutes).toHaveBeenCalledWith([{ path: '/', name: 'Home' }])
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

    it('refreshAccessToken 应调用刷新接口并只保存 access token', async () => {
        const store = useAuthStore()
        hoisted.mockRefreshAccessTokenApi.mockResolvedValue({
            access_token: 'new-access',
            token_type: 'Bearer',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
        })

        await expect(store.refreshAccessToken()).resolves.toBe('new-access')
        expect(store.access_token).toBe('new-access')
        expect(hoisted.mockLocalStorage.setItem).not.toHaveBeenCalledWith('refresh_token', expect.any(String))
    })

    it('认证 token、用户信息和菜单不应持久化到 localStorage', async () => {
        const pinia = createPinia()
        pinia.use(
            createPersistedState({
                storage: hoisted.mockLocalStorage,
                key: (id) => id,
            })
        )
        createApp({}).use(pinia)
        setActivePinia(pinia)

        const store = useAuthStore()
        expect((store as typeof store & { $persist?: () => void }).$persist).toBeUndefined()
        store.updateToken('memory-only-token', Math.floor(Date.now() / 1000) + 3600)
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(hoisted.mockLocalStorage.setItem).not.toHaveBeenCalled()
    })

    it('refreshAccessToken 不应在退出登录后恢复旧会话 token', async () => {
        const store = useAuthStore()
        let resolveRefresh!: (value: { access_token: string; token_type: 'Bearer'; expires_at: number }) => void
        hoisted.mockRefreshAccessTokenApi.mockReturnValue(
            new Promise((resolve) => {
                resolveRefresh = resolve
            })
        )

        const refreshPromise = store.refreshAccessToken()
        store.resetAuthStore()
        resolveRefresh({
            access_token: 'stale-access',
            token_type: 'Bearer',
            expires_at: Math.floor(Date.now() / 1000) + 3600,
        })

        await expect(refreshPromise).rejects.toThrow('认证会话已变化')
        expect(store.access_token).toBe('')
    })

    it('resetAuthStore 应清空跨账号 API 缓存', () => {
        const store = useAuthStore()

        store.resetAuthStore()

        expect(hoisted.mockApiCacheClear).toHaveBeenCalledTimes(1)
    })

    it('handleTokenExpired 应触发弹窗并在确认时本地退出', async () => {
        const store = useAuthStore()
        store.updateToken('test-access', Math.floor(Date.now() / 1000) + 3600)

        const { ElMessageBox } = await import('element-plus')
        vi.mocked(ElMessageBox.alert).mockImplementation((msg, title, options) => {
            if (options && typeof options.callback === 'function') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                options.callback('confirm', {} as any)
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return Promise.resolve({ action: 'confirm', value: '' } as any)
        })

        store.handleTokenExpired()

        expect(store.access_token).toBe('')
        expect(hoisted.mockRouter.push).toHaveBeenCalledWith({
            name: 'Login',
            query: { redirect: '/system/user' },
        })
    })
    it('同秒刷新应保存新 token，并合并同会话的并发刷新', async () => {
        const store = useAuthStore()
        const exp = Math.floor(Date.now() / 1000) + 3600
        store.updateToken('old-access', exp)
        let resolveRefresh!: (value: { access_token: string; expires_at: number }) => void
        hoisted.mockRefreshAccessTokenApi.mockReturnValue(
            new Promise((resolve) => {
                resolveRefresh = resolve
            })
        )
        const first = store.refreshAccessToken()
        const second = store.refreshAccessToken()
        expect(hoisted.mockRefreshAccessTokenApi).toHaveBeenCalledTimes(1)
        resolveRefresh({ access_token: 'new-access', expires_at: exp })
        await expect(first).resolves.toBe('new-access')
        await expect(second).resolves.toBe('new-access')
        expect(store.access_token).toBe('new-access')
        store.updateToken('older-access', exp - 1)
        expect(store.access_token).toBe('new-access')
    })

    it('在途刷新不得覆盖同一会话已安装的新 token', async () => {
        const store = useAuthStore()
        const exp = Math.floor(Date.now() / 1000) + 3600
        store.updateToken('old-access', exp)
        let resolveRefresh!: (value: { access_token: string; expires_at: number }) => void
        hoisted.mockRefreshAccessTokenApi.mockReturnValue(
            new Promise((resolve) => {
                resolveRefresh = resolve
            })
        )
        const pending = store.refreshAccessToken()
        store.updateToken('newer-access', exp + 1)
        resolveRefresh({ access_token: 'stale-access', expires_at: exp + 2 })
        await expect(pending).resolves.toBe('newer-access')
        expect(store.access_token).toBe('newer-access')
    })
    it('旧会话刷新结束不得清除新会话正在共享的刷新', async () => {
        const store = useAuthStore()
        const exp = Math.floor(Date.now() / 1000) + 3600
        const pending: ((value: { access_token: string; expires_at: number }) => void)[] = []
        hoisted.mockRefreshAccessTokenApi.mockImplementation(() => new Promise((resolve) => pending.push(resolve)))
        store.updateToken('account-a', exp)
        const oldResult = store.refreshAccessToken().catch((error: Error) => error.message)
        store.resetAuthStore()
        store.updateToken('account-b', exp)
        const next = store.refreshAccessToken()
        pending[0]({ access_token: 'stale-a', expires_at: exp })
        expect(await oldResult).toContain('认证会话已变化')
        const shared = store.refreshAccessToken()
        expect(hoisted.mockRefreshAccessTokenApi).toHaveBeenCalledTimes(2)
        pending[1]({ access_token: 'fresh-b', expires_at: exp })
        await expect(next).resolves.toBe('fresh-b')
        await expect(shared).resolves.toBe('fresh-b')
        expect(store.access_token).toBe('fresh-b')
    })
})
