import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAuthStore } from '@/stores/auth'
import { addDynamicRoutes, checkDynamicRouteExists } from './dynamicRoutes'
import { isEmpty } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import { normalizeRedirectPath } from '@/utils/redirect'
import type { RouteLocationNormalized } from 'vue-router'
import { resolveRouteTitle } from '@/utils/routeTitle'
import { isAuthExpiredError } from '@/modules/auth/error'

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
    try {
        // 处理登录页路由
        if (to.name === ROUTE_NAME.LOGIN) {
            if (authStore.token) {
                const redirect = normalizeRedirectPath(to.query.redirect, authStore.firstPath || ROUTE_PATH.HOME)
                return { path: redirect }
            }
            return undefined
        }

        // 检查登录状态
        if (!authStore.token) {
            try {
                await authStore.refreshAccessToken()
            } catch (error) {
                Logger.warn('静默刷新 access token 失败:', error)
                if (isAuthExpiredError(error)) {
                    authStore.resetAuthStore()
                }
            }
            if (!authStore.token) {
                return redirectToLogin(to)
            }
        } else {
            const valid = await authStore.ensureTokenValid()
            if (!valid) {
                return redirectToLogin(to)
            }
        }

        // 刷新用户信息（如果需要）
        const refreshedUserInfo = isEmpty(authStore.userInfo) || isEmpty(authStore.routerData)
        if (refreshedUserInfo) {
            await authStore.refreshUserInfo()
        }
        if (isEmpty(authStore.routerData) && to.path !== ROUTE_PATH.HOME) {
            Logger.warn('用户菜单为空，阻止进入受保护路由')
            return redirectToLogin(to)
        }

        // 动态添加路由（如果需要）
        if (checkDynamicRouteExists()) {
            const matchedNotFound = to.name === ROUTE_NAME.NOT_FOUND || to.matched.some((route) => route.name === ROUTE_NAME.NOT_FOUND)
            const rootOnlyMatchedLayout = to.path === ROUTE_PATH.HOME && to.matched.length <= 1
            if (refreshedUserInfo && (matchedNotFound || rootOnlyMatchedLayout)) {
                return { path: to.path, query: to.query, hash: to.hash, replace: true }
            }
        } else if (isEmpty(authStore.routerData)) {
            Logger.warn('路由数据为空，无法添加动态路由')
        } else {
            try {
                addDynamicRoutes(authStore.routerData)
                return { path: to.path, query: to.query, hash: to.hash, replace: true }
            } catch (error) {
                Logger.error('添加动态路由失败:', error)
                return { path: ROUTE_PATH.HOME }
            }
        }

        // 访问根路径时，若当前路径未匹配到具体的子页面组件（仅配到了 Layout 壳），才自动跳转到第一个可用菜单
        if (to.path === ROUTE_PATH.HOME && to.matched.length <= 1 && authStore.firstPath) {
            return { path: authStore.firstPath, replace: true }
        }
    } catch (error) {
        Logger.error('路由鉴权失败:', error)
        NProgress.done()
        if (isAuthExpiredError(error)) {
            authStore.resetAuthStore()
            return redirectToLogin(to)
        }
        return false
    }
}

function redirectToLogin(to: RouteLocationNormalized) {
    return {
        name: ROUTE_NAME.LOGIN,
        query: { redirect: to.fullPath },
    }
}

/**
 * 路由跳转后逻辑
 */
export function afterEach(to: RouteLocationNormalized) {
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
    NProgress.done()
}
