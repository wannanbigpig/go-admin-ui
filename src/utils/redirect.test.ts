import { describe, expect, it } from 'vitest'
import { normalizeRedirectPath } from '@/utils/redirect'

describe('utils/redirect.ts', () => {
    it('应只允许站内 redirect 路径', () => {
        expect(normalizeRedirectPath('/dashboard')).toBe('/dashboard')
        expect(normalizeRedirectPath('//evil.example')).toBe('/')
        expect(normalizeRedirectPath('https://evil.example')).toBe('/')
        expect(normalizeRedirectPath(undefined, '/fallback')).toBe('/fallback')
    })
})
