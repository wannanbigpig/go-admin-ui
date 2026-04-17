import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useRefreshStore = defineStore('refresh', () => {
    // ==================== State ====================
    /** 刷新标志位 */
    const refreshKey = ref(0)

    // ==================== Actions ====================
    /** 触发刷新 */
    const triggerRefresh = () => {
        refreshKey.value += 1
    }

    return {
        refreshKey,
        triggerRefresh,
    }
})
