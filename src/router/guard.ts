import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAuthStore } from '@/stores/auth'
import { addDynamicRoutes, checkDynamicRouteExists } from './dynamicRoutes'
import { isEmpty } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import type { RouteLocationNormalized } from 'vue-router'
import { resolveRouteTitle } from '@/utils/routeTitle'

// ==================== 配置 ====================
NProgress.configure({ showSpinner: false })

// ==================== 常量 ====================
const ROUTE_NAME = {
    LOGIN: 'Login',
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
    const authStore = useAuthStore()

    // 处理登录页路由
    if (to.name === ROUTE_NAME.LOGIN) {
        return handleLoginRoute(authStore, to)
    }

    // 检查登录状态
    if (!authStore.token) {
        return redirectToLogin(to)
    }

    // 刷新用户信息（如果需要）
    await refreshUserInfoIfNeeded(authStore)

    // 动态添加路由（如果需要）
    const routeRedirect = await handleDynamicRoutes(authStore, to)
    if (routeRedirect) {
        return routeRedirect
    }

    // 启动进度条
    NProgress.start()
}

// ==================== 工具函数 ====================
function handleLoginRoute(authStore: ReturnType<typeof useAuthStore>, to: RouteLocationNormalized) {
    if (authStore.token) {
        return (to.query.redirect as string) || ROUTE_PATH.HOME
    }
    return undefined
}

function redirectToLogin(to: RouteLocationNormalized) {
    return {
        name: ROUTE_NAME.LOGIN,
        query: { redirect: to.fullPath },
    }
}

async function refreshUserInfoIfNeeded(authStore: ReturnType<typeof useAuthStore>) {
    const needRefresh = isEmpty(authStore.userInfo) || isEmpty(authStore.routerData)
    if (needRefresh) {
        try {
            await authStore.refreshUserInfo()
        } catch (error) {
            Logger.error('刷新用户信息失败:', error)
        }
    }
}

async function handleDynamicRoutes(authStore: ReturnType<typeof useAuthStore>, to: RouteLocationNormalized) {
    if (checkDynamicRouteExists()) {
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
        return ROUTE_PATH.HOME
    }
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
