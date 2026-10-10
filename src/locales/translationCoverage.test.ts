import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import zhCN from './zh-CN'
import enUS from './en-US'

const sourceRoot = join(import.meta.dirname, '..')

const walkSources = (directory: string): string[] =>
    readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        if (entry.name === 'locales') return []
        const path = join(directory, entry.name)
        if (entry.isDirectory()) return walkSources(path)
        if (!/\.(vue|ts)$/.test(entry.name) || /\.(test|spec|d)\.ts$/.test(entry.name)) return []
        return [path]
    })

const staticTranslationKeys = () => {
    const keys = new Set<string>()
    for (const path of walkSources(sourceRoot)) {
        const source = readFileSync(path, 'utf8')
        for (const match of source.matchAll(/\b(?:t|translate)\(\s*['"]([\w.-]+)['"]/g)) {
            keys.add(match[1])
        }
    }
    return [...keys].sort()
}

const translationAt = (messages: object, key: string): unknown =>
    key.split('.').reduce<unknown>((current, part) => {
        if (!current || typeof current !== 'object') return undefined
        return (current as Record<string, unknown>)[part]
    }, messages)

describe('locale translation coverage', () => {
    it.each([
        ['zh-CN', zhCN],
        ['en-US', enUS],
    ])('contains every static translation key in %s', (_locale, messages) => {
        const missing = staticTranslationKeys().filter((key) => typeof translationAt(messages, key) !== 'string')
        expect(missing).toEqual([])
    })
})
