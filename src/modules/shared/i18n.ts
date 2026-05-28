import { DEFAULT_LOCALE } from '@/locales'
import { createLocaleTextMap } from '@/modules/system/model'
import type { LocaleTextMap } from '@/types/system'

/**
 * 兼容详情接口同时返回 `xxx` 与 `xxx_i18n` 两种字段的场景。
 *
 * 旧后端返回的字段类似：
 *   { type_name: "字典类型", type_name_i18n: { "zh-CN": "字典类型", "en-US": "Dict Type" } }
 *
 * 此函数将其归一为完整的 LocaleTextMap：
 *   1. 以 createLocaleTextMap() 作为底（所有受支持的 locale 都有 key）
 *   2. 覆盖 detail[key + '_i18n']（若存在）
 *   3. 若主语言（默认 zh-CN）仍为空但 detail[fallbackKey] 有值，则用 fallbackKey 填充
 *
 * @param detail 详情对象，可能为 null/undefined
 * @param i18nKey 形如 'type_name_i18n' 的字段名
 * @param fallbackKey 形如 'type_name' 的兜底字段名，默认去掉 i18nKey 末尾的 '_i18n'
 * @param fallbackLocale 兜底语言，默认 DEFAULT_LOCALE
 */
export function mergeI18nField(detail: Record<string, unknown> | null | undefined, i18nKey: string, fallbackKey?: string, fallbackLocale: string = DEFAULT_LOCALE): LocaleTextMap {
    const base = createLocaleTextMap()
    if (!detail) return base

    const i18nValue = detail[i18nKey]
    const merged: LocaleTextMap = { ...base }
    if (i18nValue && typeof i18nValue === 'object' && !Array.isArray(i18nValue)) {
        const obj = i18nValue as Record<string, unknown>
        for (const key of Object.keys(merged)) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const val = obj[key]
                merged[key] = typeof val === 'string' ? val : ''
            }
        }
    }

    const resolvedFallbackKey = fallbackKey ?? i18nKey.replace(/_i18n$/, '')
    const fallbackValue = detail[resolvedFallbackKey]
    const currentFallback = merged[fallbackLocale]
    if ((!currentFallback || String(currentFallback).trim() === '') && typeof fallbackValue === 'string' && fallbackValue.trim() !== '') {
        merged[fallbackLocale] = fallbackValue
    }

    return merged
}
