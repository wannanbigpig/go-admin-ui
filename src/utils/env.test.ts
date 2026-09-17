import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveBaseURL } from './env'

describe('environment defaults', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
    })

    it('uses the API prefix as a same-origin base URL when no host is configured', () => {
        vi.stubEnv('DEV', false)
        vi.stubEnv('VITE_BASE_URL', '')
        vi.stubEnv('VITE_BASE_API', '/admin')

        expect(resolveBaseURL()).toBe('/admin')
    })

    it('keeps the committed example API host empty', () => {
        const exampleEnv = readFileSync(resolve(process.cwd(), '.env.example'), 'utf8')

        expect(exampleEnv).toMatch(/^VITE_BASE_URL=\s*$/m)
    })
})
