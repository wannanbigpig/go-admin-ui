import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAuthStore } from '@/stores/auth'
import { addDynamicRoutes, checkDynamicRouteExists } from './dynamicRoutes'
import { isEmpty } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import { normalizeRedirectPath } from '@/utils/redirect'
import type { RouteLocationNormalized } from 'vue-router'
import { resolveRouteTitle } from '@/utils/routeTitle'

// ==================== 配置 ====================
NProgress.configure({ showSpinner: false })

// ==================== 常量 ====================
const ROUTE_NAME = {
    LOGIN: 'Login',
    NOT_FOUND: 'NotFound',
}

const ROUTE_PATH = {
    HOME: '/',
}

const appTitle = import.meta.env.VITE_APP_TITLE as string

// ==================== 路由守卫 ====================
/**
 * 路由跳转前逻辑
 */
export async function beforeEach(to: RouteLocationNormalized) {
    // 进度条在守卫最开始时无条件启动，以保障在被中断/被重定向等场景下和 afterEach 严格对称配对
    NProgress.start()
    const authStore = useAuthStore()

    // 处理登录页路由
    if (to.name === ROUTE_NAME.LOGIN) {
        return handleLoginRoute(authStore, to)
    }

    // 检查登录状态
    if (!authStore.token) {
        const refreshed = await silentRefreshAccessToken(authStore)
        if (!refreshed) {
            return redirectToLogin(to)
        }
    }

    // 刷新用户信息（如果需要）
    const userInfoState = await refreshUserInfoIfNeeded(authStore, to)
    if (!userInfoState.ready) {
        return redirectToLogin(to)
    }

    // 动态添加路由（如果需要）
    const routeRedirect = await handleDynamicRoutes(authStore, to, userInfoState.refreshed)
    if (routeRedirect) {
        return routeRedirect
    }

    // 访问根路径时，若当前路径未匹配到具体的子页面组件（仅配到了 Layout 壳），才自动跳转到第一个可用菜单
    if (to.path === ROUTE_PATH.HOME && to.matched.length <= 1 && authStore.firstPath) {
        return { path: authStore.firstPath, replace: true }
    }
}

// ==================== 工具函数 ====================
function handleLoginRoute(authStore: ReturnType<typeof useAuthStore>, to: RouteLocationNormalized) {
    if (authStore.token) {
        // 如果已登录，且访问登录页，重定向到指定路径或第一个可用菜单
        const redirect = normalizeRedirectPath(to.query.redirect, authStore.firstPath || ROUTE_PATH.HOME)
        return { path: redirect }
    }
    return undefined
}

function redirectToLogin(to: RouteLocationNormalized) {
    return {
        name: ROUTE_NAME.LOGIN,
        query: { redirect: to.fullPath },
    }
}

async function silentRefreshAccessToken(authStore: ReturnType<typeof useAuthStore>) {
    try {
        await authStore.refreshAccessToken()
        return Boolean(authStore.token)
    } catch (error) {
        Logger.warn('静默刷新 access token 失败:', error)
        authStore.resetAuthStore()
        return false
    }
}

async function refreshUserInfoIfNeeded(authStore: ReturnType<typeof useAuthStore>, to: RouteLocationNormalized) {
    const needRefresh = isEmpty(authStore.userInfo) || isEmpty(authStore.routerData)
    if (needRefresh) {
        try {
            await authStore.refreshUserInfo()
        } catch (error) {
            Logger.error('刷新用户信息失败:', error)
            authStore.resetAuthStore()
            return { ready: false, refreshed: false }
        }
    }

    if (isEmpty(authStore.routerData) && to.path !== ROUTE_PATH.HOME) {
        Logger.warn('用户菜单为空，阻止进入受保护路由')
        return { ready: false, refreshed: needRefresh }
    }
    return { ready: true, refreshed: needRefresh }
}

async function handleDynamicRoutes(authStore: ReturnType<typeof useAuthStore>, to: RouteLocationNormalized, refreshedUserInfo: boolean) {
    if (checkDynamicRouteExists()) {
        if (refreshedUserInfo && isNotFoundRoute(to)) {
            return rebuildToRoute(to)
        }
        return undefined
    }

    if (isEmpty(authStore.routerData)) {
        Logger.warn('路由数据为空，无法添加动态路由')
        return undefined
    }

    try {
        addDynamicRoutes(authStore.routerData)
        return rebuildToRoute(to)
    } catch (error) {
        Logger.error('添加动态路由失败:', error)
        return { path: ROUTE_PATH.HOME }
    }
}

function isNotFoundRoute(to: RouteLocationNormalized) {
    return to.name === ROUTE_NAME.NOT_FOUND || to.matched.some((route) => route.name === ROUTE_NAME.NOT_FOUND)
}

function rebuildToRoute(to: RouteLocationNormalized) {
    return {
        path: to.path,
        query: to.query,
        replace: true,
    }
}

/**
 * 路由跳转后逻辑
 */
export function afterEach(to: RouteLocationNormalized) {
    setPageTitle(to)
    NProgress.done()
}

function setPageTitle(to: RouteLocationNormalized) {
    const title = resolveRouteTitle({
        titleKey: to.meta?.titleKey as string,
        title: to.meta?.title as string,
        name: typeof to.name === 'string' ? to.name : '',
        path: to.path,
    })
    if (title) {
        document.title = `${title} - ${appTitle}`
    } else {
        document.title = appTitle
    }
}
