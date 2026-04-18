import type { RouteRecordRaw, RouteLocationRaw } from 'vue-router'
import router from './index'
import { isEmpty } from '@/utils/helper'
import type { UserPermission } from '@/types/auth'

// ==================== 常量定义 ====================
/** 按钮类型标识 */
const BUTTON_TYPE = 3

/** 动态导入所有视图组件 */
const views = import.meta.glob('../views/**/*.vue')

/** 降级组件路径（使用相对路径） */
const NOT_FOUND_COMPONENT = '../views/other/notFound.vue'

// ==================== 工具函数 ====================
const getComponentLoader = (componentPath?: string) => {
    if (!componentPath) return undefined

    let normalizedPath = componentPath

    if (normalizedPath.startsWith('@/')) {
        normalizedPath = normalizedPath.replace('@/', '../')
    }

    if (!normalizedPath.startsWith('.')) {
        normalizedPath = `../views/${normalizedPath}`
    }

    if (!normalizedPath.endsWith('.vue')) {
        normalizedPath = `${normalizedPath}.vue`
    }

    const possibleKeys = [normalizedPath, normalizedPath.replace('../views/', './views/')]

    for (const key of possibleKeys) {
        if (views[key]) {
            return views[key]
        }
    }

    console.warn(`组件路径未找到: ${componentPath}，尝试直接导入: ${normalizedPath}`)

    return () => {
        return import(/* @vite-ignore */ normalizedPath).catch((error) => {
            console.error(`导入组件失败: ${normalizedPath}`, error)
            return import(/* @vite-ignore */ NOT_FOUND_COMPONENT)
        })
    }
}

/**
 * 将后端返回的路由数据转换为 Vue Router 可用的路由配置
 */
export function convertRoute(routesData: UserPermission[]): RouteRecordRaw[] {
    return routesData.map((route) => {
        const converted = {
            path: route.path || '',
            name: route.name || route.code,
            redirect: (route.redirect || '') !== '' ? ({ name: route.redirect } as RouteLocationRaw) : undefined,
            meta: {
                title: route.title || '',
                isDynamic: true,
                icon: route.icon || '',
                show: Number(route.is_show) === 1,
                isAuth: Number(route.is_auth ?? 1) === 1,
                isNewWindow: Number(route.is_new_window ?? 0) === 1,
                isExternalLinks: Number(route.is_external_links ?? 0) === 1,
            },
        } as RouteRecordRaw & { children?: RouteRecordRaw[]; component?: unknown }

        // 处理组件路径
        if (route.component) {
            converted.component = getComponentLoader(route.component)
        }

        // 处理子路由
        if (route.children && route.children.length > 0) {
            const validChildren = route.children.filter((child) => Number(child.type) !== BUTTON_TYPE)
            if (validChildren.length > 0) {
                converted.children = convertRoute(validChildren)
            }
        }

        return converted as RouteRecordRaw
    })
}

// ==================== 路由管理 ====================
export function addDynamicRoutes(routesData: RouteRecordRaw[]) {
    if (isEmpty(routesData)) return

    if (checkDynamicRouteExists()) {
        removeDynamicRoute()
    }

    routesData.forEach((route) => {
        router.addRoute('Layout', route)
    })
}

export function removeDynamicRoute() {
    const routes = router.getRoutes()
    routes.forEach((route) => {
        if (route.meta?.isDynamic) {
            router.removeRoute(route.name as string)
        }
    })
}

export function checkDynamicRouteExists() {
    return router.getRoutes().some((route) => route.name === 'Home')
}
