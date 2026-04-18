import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRefreshStore = defineStore('refresh', () => {
    // ==================== State ====================
    /** 刷新键值，用于触发组件重新渲染 */
    const key = ref(0)

    /** 是否正在刷新 */
    const isRefreshing = ref(false)

    // ==================== Actions ====================
    /** 更新刷新键值，触发组件重新渲染 */
    const setKey = () => {
        key.value += 1
    }

    return {
        key,
        isRefreshing,
        setKey,
    }
})
