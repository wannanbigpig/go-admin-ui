import { createI18n } from 'vue-i18n'
import zhCN from './zh-CN'
import enUS from './en-US'
import type { LocaleCode } from '@/types/i18n'

export const DEFAULT_LOCALE: LocaleCode = 'zh-CN'
export const FALLBACK_LOCALE: LocaleCode = 'zh-CN'

export const localeMessages = {
    'zh-CN': zhCN,
    'en-US': enUS,
}

export const LOCALE_OPTIONS: { value: LocaleCode; label: string }[] = [
    { value: 'zh-CN', label: '简体中文' },
    { value: 'en-US', label: 'English' },
]

export const i18n = createI18n({
    legacy: false,
    globalInjection: false,
    locale: DEFAULT_LOCALE,
    fallbackLocale: FALLBACK_LOCALE,
    messages: localeMessages,
})

export const translate = (key: string, params?: Record<string, unknown>) => {
    return i18n.global.t(key, params ?? {})
}
