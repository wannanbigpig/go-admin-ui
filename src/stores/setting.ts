import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface SettingState {
    isCollapse: boolean
    watermarkEnabled: boolean
    watermarkContent: string
    theme: ThemeMode
}

export const useSettingStore = defineStore(
    'setting',
    () => {
        // ==================== State ====================
        const isCollapse = ref(false)
        const watermarkEnabled = ref(true)
        const watermarkContent = ref('X-L-Admin')
        const theme = ref<ThemeMode>('system')

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

        const setTheme = (mode: ThemeMode) => {
            theme.value = mode
        }

        return {
            isCollapse,
            watermarkEnabled,
            watermarkContent,
            theme,
            toggleCollapse,
            updateWatermark,
            toggleWatermark,
            setTheme,
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
