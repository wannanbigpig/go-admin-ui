import { describe, expect, it } from 'vitest'
import enUS from '@/locales/en-US'
import zhCN from '@/locales/zh-CN'

function collectKeys(value: unknown, prefix = ''): string[] {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return prefix ? [prefix] : []
    }

    return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
        const path = prefix ? `${prefix}.${key}` : key
        return collectKeys(child, path)
    })
}

describe('locale message keys', () => {
    it('zh-CN 与 en-US 应保持相同的消息键结构', () => {
        expect(collectKeys(enUS).sort()).toEqual(collectKeys(zhCN).sort())
    })
})
