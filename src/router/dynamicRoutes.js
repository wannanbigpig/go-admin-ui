import constantRoutes from './constantRoutes'
import { createWebHistory, createRouter } from 'vue-router'
import router from './index'
import { isEmpty } from '@/utils/helper'

// ==================== 常量定义 ====================
/** 按钮类型标识 */
const BUTTON_TYPE = 3

/** 动态导入所有视图组件 */
const views = import.meta.glob('../views/**/*.vue')

/** 降级组件路径（使用相对路径） */
const NOT_FOUND_COMPONENT = '../views/other/notFound.vue'

// ==================== 工具函数 ====================
/**
 * 处理组件路径，返回动态导入函数
 */
const getComponentLoader = (componentPath) => {
  if (!componentPath) return undefined

  if (componentPath.startsWith('.')) {
    // 以 . 开头的路径，直接动态导入（不检查是否存在）
    return () => import(/* @vite-ignore */ componentPath)
  }

  // 不以 . 开头的路径，从 views 目录导入，并检查是否存在
  const fullPath = `../views/${componentPath}`
  if (views[fullPath]) {
    return () => import(/* @vite-ignore */ fullPath)
  }

  // 降级处理：组件不存在时使用 404 组件
  return () => import(/* @vite-ignore */ NOT_FOUND_COMPONENT)
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
