import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserMenuList } from '@/api/user'

// ==================== Store 定义 ====================
/**
 * 路由状态管理 Store
 * 用于管理动态路由数据
 */
export const useRouteStore = defineStore('route', () => {
  // ==================== State ====================
  /** 路由列表 */
  const routes = ref([])

  // ==================== Actions ====================
  /**
   * 获取路由列表
   */
  const getRoutes = async () => {
    try {
      const response = await getUserMenuList()
      routes.value = response.data
    } catch (error) {
      console.error('获取路由列表失败:', error)
      routes.value = []
      throw error
    }
  }

  // ==================== 返回值 ====================
  return {
    routes,
    getRoutes,
  }
})
