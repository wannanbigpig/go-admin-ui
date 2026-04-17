import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SettingState {
    isCollapse: boolean
    watermarkEnabled: boolean
    watermarkContent: string
    theme: 'light' | 'dark'
}

export const useSettingStore = defineStore(
    'setting',
    () => {
        // ==================== State ====================
        const isCollapse = ref(false)
        const watermarkEnabled = ref(true)
        const watermarkContent = ref('X-L-Admin')
        const theme = ref<'light' | 'dark'>('light')

        // ==================== Actions ====================
        const toggleCollapse = () => {
            isCollapse.value = !isCollapse.value
        }

        const updateWatermark = (content: string) => {
            watermarkContent.value = content
        }

        const toggleWatermark = (enabled: boolean) => {
            watermarkEnabled.value = enabled
        }

        return {
            isCollapse,
            watermarkEnabled,
            watermarkContent,
            theme,
            toggleCollapse,
            updateWatermark,
            toggleWatermark,
        }
    },
    {
        persist: {
            key: 'setting',
            storage: localStorage,
            paths: ['isCollapse', 'watermarkEnabled', 'watermarkContent', 'theme'],
        },
    }
)
