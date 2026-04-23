import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { LocaleCode } from '@/types/i18n'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface SettingState {
    isCollapse: boolean
    watermarkEnabled: boolean
    watermarkContent: string
    theme: ThemeMode
    locale: LocaleCode
}

export const useSettingStore = defineStore(
    'setting',
    () => {
        // ==================== State ====================
        const isCollapse = ref(false)
        const watermarkEnabled = ref(true)
        const watermarkContent = ref('X-L-Admin')
        const theme = ref<ThemeMode>('system')
        const locale = ref<LocaleCode>('zh-CN')

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

        const setLocale = (value: LocaleCode) => {
            locale.value = value
        }

        return {
            isCollapse,
            watermarkEnabled,
            watermarkContent,
            theme,
            locale,
            toggleCollapse,
            updateWatermark,
            toggleWatermark,
            setTheme,
            setLocale,
        }
    },
    {
        persist: {
            key: 'setting',
            storage: localStorage,
            paths: ['isCollapse', 'watermarkEnabled', 'watermarkContent', 'theme', 'locale'],
        },
    }
)
