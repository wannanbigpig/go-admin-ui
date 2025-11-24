import constantRoutes from './constantRoutes'
import { createWebHistory, createRouter } from 'vue-router'
import router from './index'
import { isEmpty } from '@/utils/helper'

// ==================== 常量定义 ====================
/** 按钮类型标识 */
const BUTTON_TYPE = 3

/** 动态导入所有视图组件 */
// 使用 import.meta.glob 预加载所有视图组件，返回路径到导入函数的映射
const views = import.meta.glob('../views/**/*.vue')

/** 降级组件路径（使用相对路径） */
const NOT_FOUND_COMPONENT = '../views/other/notFound.vue'

// ==================== 工具函数 ====================
/**
 * 处理组件路径，返回动态导入函数
 * @param {string} componentPath - 组件路径（可能是 'home/index.vue' 或 '@/views/home/index.vue' 等格式）
 */
const getComponentLoader = (componentPath) => {
    if (!componentPath) return undefined

    // 标准化路径：统一转换为相对路径格式
    let normalizedPath = componentPath

    // 处理 @ 别名路径：@/views/xxx -> ../views/xxx
    if (normalizedPath.startsWith('@/')) {
        normalizedPath = normalizedPath.replace('@/', '../')
    }

    // 处理不以 . 开头的路径：home/index.vue -> ../views/home/index.vue
    if (!normalizedPath.startsWith('.')) {
        normalizedPath = `../views/${normalizedPath}`
    }

    // 确保路径以 .vue 结尾（如果后端返回的路径没有扩展名）
    if (!normalizedPath.endsWith('.vue')) {
        normalizedPath = `${normalizedPath}.vue`
    }

    // 从 views 映射中查找匹配的路径
    // import.meta.glob 返回的键是相对于当前文件的路径
    // 需要精确匹配或尝试不同的路径格式
    const possibleKeys = [
        normalizedPath, // ../views/home/index.vue
        normalizedPath.replace('../views/', './views/'), // ./views/home/index.vue (备用)
    ]

    // 查找第一个存在的路径
    for (const key of possibleKeys) {
        if (views[key]) {
            // 返回 import.meta.glob 提供的导入函数
            return views[key]
        }
    }

    // 如果找不到，尝试直接使用标准化路径（让 Vite 在运行时处理）
    // 但这种情况应该很少，因为 import.meta.glob 应该已经包含了所有文件
    console.warn(`组件路径未找到: ${componentPath}，尝试直接导入: ${normalizedPath}`)

    // 使用动态导入，如果失败则降级到 404 组件
    return () => {
        return import(/* @vite-ignore */ normalizedPath).catch((error) => {
            console.error(`导入组件失败: ${normalizedPath}`, error)
            // 降级到 404 组件
            return import(/* @vite-ignore */ NOT_FOUND_COMPONENT)
        })
    }
}

/**
 * 将后端返回的路由数据转换为 Vue Router 可用的路由配置
 * @param {Array} routesData - 后端返回的路由数据数组
 * @returns {Array} - 转换后的 Vue Router 路由配置数组
 */
export function convertRoute(routesData) {
    return routesData.map((route) => {
        const converted = {
            path: route.path,
            name: route.name,
            redirect: (route.redirect || '') !== '' ? { name: route.redirect } : undefined,
            meta: {
                title: route.title || '',
                isDynamic: true,
                icon: route.icon || '',
                show: route.is_show === 1,
                isAuth: route.is_auth === 1,
                isNewWindow: route.is_new_window === 1,
                isExternalLinks: route.is_external_links === 1,
            },
        }

        // 处理组件路径
        if (route.component) {
            converted.component = getComponentLoader(route.component)
        }

        // 处理子路由（过滤掉按钮类型）
        if (route.children?.length > 0) {
            const validChildren = route.children.filter((child) => child.type !== BUTTON_TYPE)
            if (validChildren.length > 0) {
                converted.children = convertRoute(validChildren)
            }
        }

        return converted
    })
}

// ==================== 路由管理 ====================
/**
 * 添加动态路由
 * @param {Array} routesData - 路由数据数组
 */
export function addDynamicRoutes(routesData) {
    if (isEmpty(routesData)) return

    // 如果已存在动态路由，先移除
    if (checkDynamicRouteExists()) {
        removeDynamicRoute()
    }

    // 添加新的动态路由
    routesData.forEach((route) => {
        router.addRoute('Layout', route)
    })
}

/**
 * 移除动态添加的路由
 */
export function removeDynamicRoute() {
    const routes = router.getRoutes()
    routes.forEach((route) => {
        if (route.meta?.isDynamic) {
            router.removeRoute(route.name)
        }
    })
}

/**
 * 检查动态路由是否存在
 * @returns {boolean}
 */
export function checkDynamicRouteExists() {
    return router.getRoutes().some((route) => route.name === 'Home')
}

/**
 * 重置路由，移除所有动态添加的路由，仅保留基础路由
 */
export function resetRouter() {
    const newRouter = createRouter({
        history: createWebHistory(),
        routes: constantRoutes,
    })
    // 替换路由匹配器，移除所有动态路由
    router.matcher = newRouter.matcher
}
