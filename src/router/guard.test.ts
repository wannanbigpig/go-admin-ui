import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { RouteLocationNormalized } from 'vue-router'

const hoisted = vi.hoisted(() => ({
    progressStart: vi.fn(),
    progressDone: vi.fn(),
    resetAuthStore: vi.fn(),
    ensureTokenValid: vi.fn(),
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
        token: 'access-token',
        firstPath: '/dashboard',
        userInfo: { id: 1 },
        routerData: [{ path: '/dashboard' }],
        ensureTokenValid: hoisted.ensureTokenValid,
        resetAuthStore: hoisted.resetAuthStore,
    }),
}))

vi.mock('./dynamicRoutes', () => ({
    addDynamicRoutes: vi.fn(),
    checkDynamicRouteExists: vi.fn(() => true),
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
})
