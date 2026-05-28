import { describe, expect, it, vi } from 'vitest'

vi.mock('@/locales', () => ({
    DEFAULT_LOCALE: 'zh-CN',
    SUPPORTED_LOCALES: [
        { code: 'zh-CN', name: '中文' },
        { code: 'en-US', name: 'English' },
    ],
}))

vi.mock('@/modules/system/model', () => ({
    createLocaleTextMap: () => ({ 'zh-CN': '', 'en-US': '' }),
}))

import { mergeI18nField } from '@/modules/shared/i18n'

describe('modules/shared/i18n.ts', () => {
    it('detail 仅有兼容旧字段时回填到 fallbackLocale', () => {
        const detail = { type_name: '字典类型' }
        const result = mergeI18nField(detail, 'type_name_i18n')
        expect(result).toEqual({ 'zh-CN': '字典类型', 'en-US': '' })
    })

    it('detail 有 _i18n 字段时优先使用并覆盖默认 key', () => {
        const detail = {
            type_name: '字典类型',
            type_name_i18n: { 'zh-CN': '字典名', 'en-US': 'Dict' },
        }
        const result = mergeI18nField(detail, 'type_name_i18n')
        expect(result).toEqual({ 'zh-CN': '字典名', 'en-US': 'Dict' })
    })

    it('_i18n 缺主语言时用 fallbackKey 兜底', () => {
        const detail = {
            type_name: '字典类型',
            type_name_i18n: { 'zh-CN': '', 'en-US': 'Dict' },
        }
        const result = mergeI18nField(detail, 'type_name_i18n')
        expect(result['zh-CN']).toBe('字典类型')
        expect(result['en-US']).toBe('Dict')
    })

    it('detail 为 null/undefined 时返回基础 map', () => {
        const result = mergeI18nField(null, 'type_name_i18n')
        expect(result).toEqual({ 'zh-CN': '', 'en-US': '' })
    })

    it('支持自定义 fallbackKey', () => {
        const detail = { display_name: 'Display', label_i18n: { 'zh-CN': '' } }
        const result = mergeI18nField(detail, 'label_i18n', 'display_name')
        expect(result['zh-CN']).toBe('Display')
    })
})
