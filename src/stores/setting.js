import { defineStore } from 'pinia'
import { ref } from 'vue'

// ==================== Store 定义 ====================
/**
 * 设置状态管理 Store
 * 用于管理应用设置（布局、侧边栏等）
 * 配置了持久化，设置会自动保存到 localStorage
 */
export const useSettingStore = defineStore(
    'setting',
    () => {
        // ==================== State ====================
        /** 头部是否固定 */
        const isHeaderFixed = ref(true)

        /** 侧边栏是否固定 */
        const isSideFixed = ref(true)

        /** 侧边栏是否折叠 */
        const isCollapse = ref(false)

        /** 是否显示水印 */
        const watermarkEnabled = ref(true)

        /** 水印内容 */
        const watermarkContent = ref(['github.com/wannanbigpig'])

        // ==================== 返回值 ====================
        return {
            isHeaderFixed,
            isSideFixed,
            isCollapse,
            watermarkEnabled,
            watermarkContent,
        }
    },
    {
        persist: true,
    }
)
