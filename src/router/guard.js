import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useAuthStore } from '@/stores/auth'
import { addDynamicRoutes, checkDynamicRouteExists } from './dynamicRoutes'
import { isEmpty } from '@/utils/helper'

// ==================== 配置 ====================
NProgress.configure({ showSpinner: false })

// ==================== 常量 ====================
const ROUTE_NAME = {
    LOGIN: 'Login',
}

const ROUTE_PATH = {
    HOME: '/',
}

const appTitle = import.meta.env.VITE_APP_TITLE

// ==================== 路由守卫 ====================
/**
 * 路由跳转前逻辑
 * @param {Object} to - 即将跳转的目标路由对象
 * @returns {string|Object|undefined} - 返回重定向路径、路由对象或 undefined
 */
export async function beforeEach(to) {
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
/**
 * 处理登录页面逻辑
 * @param {Object} authStore - 认证状态管理
 * @param {Object} to - 目标路由对象
 * @returns {string|undefined} - 返回重定向路径或 undefined
 */
function handleLoginRoute(authStore, to) {
    // 如果用户已登录，跳转到 redirect 参数指定页面或首页
    if (authStore.token) {
        return to.query.redirect || ROUTE_PATH.HOME
    }
    // 未登录，允许访问登录页
    return undefined
}

/**
 * 重定向到登录页面
 * @param {Object} to - 目标路由对象
 * @returns {Object} - 返回登录页面的路由对象
 */
function redirectToLogin(to) {
    return {
        name: ROUTE_NAME.LOGIN,
        query: { redirect: to.fullPath },
    }
}

/**
 * 刷新用户信息（如果需要）
 * @param {Object} authStore - 认证状态管理
 */
async function refreshUserInfoIfNeeded(authStore) {
    const needRefresh = isEmpty(authStore.userInfo) || isEmpty(authStore.routerData)
    if (needRefresh) {
        try {
            await authStore.refreshUserInfo()
        } catch (error) {
            console.error('刷新用户信息失败:', error)
            // 刷新失败时，如果 token 存在但用户信息为空，可能需要重新登录
            // 这里可以根据实际需求决定是否要清除 token 并跳转到登录页
        }
    }
}

/**
 * 处理动态路由添加
 * @param {Object} authStore - 认证状态管理
 * @param {Object} to - 目标路由对象
 * @returns {Object|undefined} - 返回重建后的路由对象或 undefined
 */
async function handleDynamicRoutes(authStore, to) {
    // 如果动态路由已存在，无需处理
    if (checkDynamicRouteExists()) {
        return undefined
    }

    // 如果路由数据为空，无法添加动态路由
    if (isEmpty(authStore.routerData)) {
        console.warn('路由数据为空，无法添加动态路由')
        return undefined
    }

    try {
        addDynamicRoutes(authStore.routerData)
        // 重建路由对象以触发重新导航
        return rebuildToRoute(to)
    } catch (error) {
        console.error('添加动态路由失败:', error)
        // 添加路由失败时，重定向到首页
        return ROUTE_PATH.HOME
    }
}

/**
 * 重建路由对象以触发重新导航
 * @param {Object} to - 目标路由对象
 * @returns {Object} - 重建后的路由对象
 */
function rebuildToRoute(to) {
    return {
        path: to.path,
        query: to.query,
        replace: true,
    }
}

/**
 * 路由跳转后逻辑
 * @param {Object} to - 目标路由对象
 */
export function afterEach(to) {
    // 设置页面标题
    setPageTitle(to)

    // 完成进度条
    NProgress.done()
}

/**
 * 设置页面标题
 * @param {Object} to - 目标路由对象
 */
function setPageTitle(to) {
    const title = to.meta?.title || ''
    if (title) {
        document.title = `${title} - ${appTitle}`
    } else {
        document.title = appTitle
    }
}
