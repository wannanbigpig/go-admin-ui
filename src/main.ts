import { createApp, type ComponentPublicInstance, watch } from 'vue'
import 'animate.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@/assets/styles/index.scss'
import App from './App.vue'
import pinia from '@/stores/index'
import { useSettingStore, type ThemeMode } from '@/stores/setting'
import router from './router'
import { Icon } from '@iconify/vue'
import permissionDirective from '@/directives/permission'
import { Logger, setupGlobalErrorHandlers } from '@/utils/logger'
import { i18n, ENABLE_I18N, DEFAULT_LOCALE } from '@/locales'
import type { LocaleCode } from '@/types/i18n'

const app = createApp(App)

// 注册全局错误处理
app.config.errorHandler = (err: unknown, vm: ComponentPublicInstance | null, info: string) => {
    Logger.error('[全局错误拦截]:', err)
    Logger.error('[错误组件]:', vm)
    Logger.error('[错误信息]:', info)
    // 存储最近一次错误，供 ErrorBoundary 或调试使用
    ;(window as unknown as Record<string, unknown>).__LAST_APP_ERROR__ = { err, vm, info, timestamp: Date.now() }
}

// 设置全局错误处理器
setupGlobalErrorHandlers()

app.component('AppIcons', Icon)
// 注册权限指令
app.directive('permission', permissionDirective)
app.use(pinia).use(i18n)

app.use(router)

const settingStore = useSettingStore()
const systemThemeQuery = window.matchMedia('(prefers-color-scheme: dark)')

const isThemeMode = (theme: unknown): theme is ThemeMode => {
    return theme === 'light' || theme === 'dark' || theme === 'system'
}

// 兜底：确保主题默认跟随系统，避免旧缓存或异常值导致主题状态失效
if (!isThemeMode(settingStore.theme)) {
    settingStore.setTheme('system')
}

const isLocaleCode = (locale: unknown): locale is LocaleCode => locale === 'zh-CN' || locale === 'en-US'
if (!isLocaleCode(settingStore.locale) || !ENABLE_I18N) {
    settingStore.setLocale(DEFAULT_LOCALE)
}

const applyTheme = () => {
    const useDark = settingStore.theme === 'dark' || (settingStore.theme === 'system' && systemThemeQuery.matches)

    document.documentElement.classList.toggle('dark', useDark)
    document.documentElement.style.colorScheme = useDark ? 'dark' : 'light'
}

watch(
    () => settingStore.theme,
    () => {
        applyTheme()
    },
    { immediate: true }
)

watch(
    () => settingStore.locale,
    (locale) => {
        i18n.global.locale.value = locale
        // locale 切换会重渲整树，顺带 sync 一次主题，避免类名/css var 失效（兜底）
        applyTheme()
    },
    { immediate: true }
)

const handleSystemThemeChange = () => {
    if (settingStore.theme === 'system') {
        applyTheme()
    }
}

if (typeof systemThemeQuery.addEventListener === 'function') {
    systemThemeQuery.addEventListener('change', handleSystemThemeChange)
} else {
    systemThemeQuery.addListener(handleSystemThemeChange)
}

app.mount('#app')
