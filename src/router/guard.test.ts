import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

const hoisted = vi.hoisted(() => ({
    progressStart: vi.fn(),
    progressDone: vi.fn(),
    resetAuthStore: vi.fn(),
    ensureTokenValid: vi.fn(),
    refreshAccessToken: vi.fn(),
    refreshUserInfo: vi.fn(),
    addDynamicRoutes: vi.fn(),
    checkDynamicRouteExists: vi.fn(),
    authStore: {
        token: 'access-token',
        firstPath: '/dashboard',
        userInfo: { id: 1 } as Record<string, unknown>,
        routerData: [{ path: '/dashboard' }] as unknown[],
    },
}))

vi.mock('nprogress', () => ({
    default: {
        configure: vi.fn(),
        start: hoisted.progressStart,
        done: hoisted.progressDone,
    },
}))

vi.mock('@/stores/auth', () => ({
    useAuthStore: () => ({
        get token() {
            return hoisted.authStore.token
        },
        get firstPath() {
            return hoisted.authStore.firstPath
        },
        get userInfo() {
            return hoisted.authStore.userInfo
        },
        get routerData() {
            return hoisted.authStore.routerData
        },
        ensureTokenValid: hoisted.ensureTokenValid,
        resetAuthStore: hoisted.resetAuthStore,
        refreshAccessToken: hoisted.refreshAccessToken,
        refreshUserInfo: hoisted.refreshUserInfo,
    }),
}))

vi.mock('./dynamicRoutes', () => ({
    addDynamicRoutes: hoisted.addDynamicRoutes,
    checkDynamicRouteExists: hoisted.checkDynamicRouteExists,
}))

vi.mock('@/utils/helper', () => ({
    isEmpty: (value: unknown) => !value || (Array.isArray(value) && value.length === 0),
}))

vi.mock('@/utils/logger', () => ({
    Logger: { error: vi.fn(), warn: vi.fn() },
}))

vi.mock('@/utils/routeTitle', () => ({
    resolveRouteTitle: vi.fn(() => ''),
}))

import { beforeEach as beforeNavigation } from './guard'

describe('router/guard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        Object.assign(hoisted.authStore, {
            token: 'access-token',
            firstPath: '/dashboard',
            userInfo: { id: 1 },
            routerData: [{ path: '/dashboard' }],
        })
        hoisted.ensureTokenValid.mockResolvedValue(true)
        hoisted.checkDynamicRouteExists.mockReturnValue(true)
    })

    it('鉴权接口临时失败时应中止导航但保留登录态', async () => {
        hoisted.ensureTokenValid.mockRejectedValueOnce({ response: { status: 503 } })
        const to = {
            name: 'Dashboard',
            path: '/dashboard',
            fullPath: '/dashboard?tab=overview',
            query: { tab: 'overview' },
            matched: [],
            meta: {},
        } as unknown as RouteLocationNormalized

        await expect(beforeNavigation(to)).resolves.toBe(false)
        expect(hoisted.progressStart).toHaveBeenCalledTimes(1)
        expect(hoisted.progressDone).toHaveBeenCalledTimes(1)
        expect(hoisted.resetAuthStore).not.toHaveBeenCalled()
    })

    it('鉴权接口明确返回 401 时应清理登录态并回到登录页', async () => {
        hoisted.ensureTokenValid.mockRejectedValueOnce({ response: { status: 401 } })
        const to = {
            name: 'Dashboard',
            path: '/dashboard',
            fullPath: '/dashboard?tab=overview',
            query: { tab: 'overview' },
            matched: [],
            meta: {},
        } as unknown as RouteLocationNormalized

        await expect(beforeNavigation(to)).resolves.toEqual({
            name: 'Login',
            query: { redirect: '/dashboard?tab=overview' },
        })
        expect(hoisted.progressStart).toHaveBeenCalledTimes(1)
        expect(hoisted.progressDone).toHaveBeenCalledTimes(1)
        expect(hoisted.resetAuthStore).toHaveBeenCalledTimes(1)
    })

    it('整页刷新根路径时应在恢复动态首页后重新匹配当前地址', async () => {
        Object.assign(hoisted.authStore, { token: '', firstPath: '', userInfo: {}, routerData: [] })
        hoisted.refreshAccessToken.mockImplementation(async () => {
            hoisted.authStore.token = 'refreshed-access-token'
            return 'refreshed-access-token'
        })
        hoisted.refreshUserInfo.mockImplementation(async () => {
            hoisted.authStore.userInfo = { id: 1 }
            hoisted.authStore.routerData = [{ path: '', name: 'Home' }]
        })
        const to = {
            name: 'Layout',
            path: '/',
            fullPath: '/',
            query: {},
            matched: [{ name: 'Layout', path: '/', meta: {} }],
            meta: {},
        } as unknown as RouteLocationNormalized

        await expect(beforeNavigation(to)).resolves.toEqual({ path: '/', query: {}, replace: true })
        expect(hoisted.refreshAccessToken).toHaveBeenCalledTimes(1)
        expect(hoisted.refreshUserInfo).toHaveBeenCalledTimes(1)
    })

    it('已匹配普通动态路由时应继续导航', async () => {
        const to = {
            name: 'Dashboard',
            path: '/dashboard',
            fullPath: '/dashboard',
            query: {},
            matched: [{ name: 'Dashboard', path: '/dashboard', meta: { isDynamic: true } }],
            meta: { isDynamic: true },
        } as unknown as RouteLocationNormalized

        await expect(beforeNavigation(to)).resolves.toBeUndefined()
        expect(hoisted.ensureTokenValid).toHaveBeenCalledTimes(1)
    })
})
