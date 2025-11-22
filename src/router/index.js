import { createWebHistory, createRouter } from 'vue-router'
import constantRoutes from './constantRoutes'
import { beforeEach as beforeNavigation, afterEach as afterNavigation } from './guard'

// ==================== 创建路由实例 ====================
/**
 * Vue Router 实例
 * 使用 HTML5 History 模式
 * base 路径从环境变量读取，用于 GitHub Pages 部署
 */
const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: constantRoutes,
})

// ==================== 注册导航守卫 ====================
// 路由跳转前守卫
router.beforeEach(beforeNavigation)

// 路由跳转后守卫
router.afterEach(afterNavigation)

// ==================== 导出 ====================
export default router
