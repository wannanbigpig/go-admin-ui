import { defineStore } from 'pinia'
import { ref } from 'vue'

// ==================== Store 定义 ====================
/**
 * 刷新状态管理 Store
 * 用于控制页面刷新和加载状态
 */
export const useRefreshStore = defineStore('refresh', () => {
  // ==================== State ====================
  /** 刷新键值，用于触发组件重新渲染 */
  const key = ref(0)

  /** 是否正在刷新 */
  const isRefreshing = ref(false)

  // ==================== Actions ====================
  /**
   * 更新刷新键值，触发组件重新渲染
   */
  const setKey = () => {
    key.value += 1
  }

  // ==================== 返回值 ====================
  return {
    key,
    isRefreshing,
    setKey,
  }
})
