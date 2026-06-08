import { describe, expect, it, vi } from 'vitest'
import { useClipboard } from '@/composables/useClipboard'

vi.mock('@/utils/logger', () => ({
    Logger: {
        error: vi.fn(),
    },
}))

describe('composables/useClipboard.ts', () => {
    it('fallback 复制抛错时也应移除临时 textarea', async () => {
        const clipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard')
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: undefined,
        })
        const originalExecCommand = document.execCommand
        Object.defineProperty(document, 'execCommand', {
            configurable: true,
            value: vi.fn(() => {
                throw new Error('boom')
            }),
        })

        const { copyText } = useClipboard()
        const result = await copyText('hello')

        expect(result).toBe(false)
        expect(document.querySelectorAll('textarea')).toHaveLength(0)

        Object.defineProperty(document, 'execCommand', {
            configurable: true,
            value: originalExecCommand,
        })
        if (clipboard) {
            Object.defineProperty(navigator, 'clipboard', clipboard)
        }
    })
})
