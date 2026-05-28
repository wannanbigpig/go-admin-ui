import { RouterView, type RouteRecordRaw, type RouteLocationRaw } from 'vue-router'
import { h } from 'vue'
import router from './index'
import { isEmpty } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import type { UserPermission } from '@/types/auth'
import componentMap from './componentMap'

// ==================== 常量定义 ====================
/** 按钮类型标识 */
const BUTTON_TYPE = 3
const BUTTON_TYPE_TEXT = 'button'

/** 降级组件 key */
const NOT_FOUND_KEY = 'other:notFound'

// ==================== 工具函数 ====================
const isButtonRouteNode = (route: UserPermission) => {
    const t = route.type
    if (typeof t === 'number') return t === BUTTON_TYPE
    if (typeof t === 'string') return t === BUTTON_TYPE_TEXT || Number(t) === BUTTON_TYPE
    return false
}

/**
 * 通过组件映射表解析组件懒加载函数
 * 后端 component_key 字段存储语义化 key（如 'system:config'），前端查表获取真实组件
 */
const resolveComponent = (componentKey?: string) => {
    if (!componentKey) return undefined

    const loader = componentMap[componentKey]
    if (loader) return loader

    Logger.warn(`组件映射未找到: ${componentKey}，将降级到 404 页面`)
    return componentMap[NOT_FOUND_KEY]
}

/**
 * 开发模式启动期预校验：递归遍历后端菜单，所有 component_key 字段必须能命中映射表，
 * 否则抛错让开发者立即修复，而不是访问路由时才 warn。
 */
export function validateRouteComponents(routesData: UserPermission[]): string[] {
    const missing: string[] = []
    const walk = (nodes: UserPermission[]) => {
        for (const node of nodes) {
            if (isButtonRouteNode(node)) continue
            if (node.component_key && !componentMap[node.component_key]) {
                missing.push(node.component_key)
            }
            if (node.children && node.children.length > 0) {
                walk(node.children)
            }
        }
    }
    walk(routesData)

    if (missing.length > 0 && import.meta.env.DEV) {
        const message = `[dynamicRoutes] 以下组件 key 未在 componentMap 中找到：\n${missing.map((m) => `  - ${m}`).join('\n')}`
        throw new Error(message)
    }
    return missing
}

/**
 * 将后端返回的路由数据转换为 Vue Router 可用的路由配置
 */
export function convertRoute(routesData: UserPermission[], seenNames = new Set<string>(), seenPaths = new Set<string>()): RouteRecordRaw[] {
    return routesData
        .filter((route) => !isButtonRouteNode(route))
        .flatMap((route) => {
            const routeName = route.name || route.code
            const routePath = route.path || ''
            if (routeName && seenNames.has(routeName)) {
                Logger.warn(`动态路由名称重复，已跳过: ${routeName}，当前菜单为: ${route.title || route.name}`)
                return []
            }
            if (routePath && seenPaths.has(routePath)) {
                Logger.warn(`动态路由路径重复，已跳过: ${routePath}，当前菜单为: ${route.title || route.name}`)
                return []
            }
            if (routeName) seenNames.add(routeName)
            if (routePath) seenPaths.add(routePath)

            const converted = {
                path: routePath,
                name: routeName,
                redirect: route.redirect ? ((route.redirect.startsWith('/') ? { path: route.redirect } : { name: route.redirect }) as RouteLocationRaw) : undefined,
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

            // 处理组件映射
            const hasOwnComponent = !!route.component_key
            if (hasOwnComponent) {
                converted.component = resolveComponent(route.component_key)
            } else if (route.children && route.children.length > 0) {
                converted.component = { render: () => h(RouterView) }
            }

            // 处理子路由
            if (route.children && route.children.length > 0) {
                const validChildren = route.children.filter((child) => !isButtonRouteNode(child))
                if (validChildren.length > 0) {
                    converted.children = convertRoute(validChildren, seenNames, seenPaths)
                }
            }

            // 过滤无效路由：无自有组件且无有效子路由的目录（子项全是按钮类型）应跳过
            if (!hasOwnComponent && (!converted.children || converted.children.length === 0)) {
                return []
            }

            return [converted as RouteRecordRaw]
        })
}

/**
 * 提取第一个可访问的叶子路由路径
 */
export function findFirstValidRoute(routes: RouteRecordRaw[]): string {
    for (const route of routes) {
        if (route.children && route.children.length > 0) {
            const childPath = findFirstValidRoute(route.children)
            if (childPath) return childPath
        }
        if (route.path && !route.path.startsWith('http') && route.component) {
            return route.path
        }
    }
    return ''
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
    return router.getRoutes().some((route) => route.meta?.isDynamic === true)
}
