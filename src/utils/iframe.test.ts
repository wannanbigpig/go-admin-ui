import { afterEach, describe, expect, it, vi } from 'vitest'
import { normalizeIframeURL } from '@/utils/iframe'

describe('utils/iframe.ts', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('允许同源 http/https 地址', () => {
        expect(normalizeIframeURL('/report', 'https://admin.example.com')).toBe('https://admin.example.com/report')
    })

    it('拒绝危险协议和未在白名单内的跨源地址', () => {
        expect(normalizeIframeURL('javascript:alert(1)', 'https://admin.example.com')).toBe('')
        expect(normalizeIframeURL('data:text/html,hello', 'https://admin.example.com')).toBe('')
        expect(normalizeIframeURL('https://evil.example.com/page', 'https://admin.example.com')).toBe('')
    })

    it('允许环境变量白名单中的跨源地址', () => {
        vi.stubEnv('VITE_IFRAME_ALLOWED_ORIGINS', 'https://trusted.example.com')

        expect(normalizeIframeURL('https://trusted.example.com/page', 'https://admin.example.com')).toBe('https://trusted.example.com/page')
    })
})
