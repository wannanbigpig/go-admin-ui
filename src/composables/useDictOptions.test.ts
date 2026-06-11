import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, type EffectScope, reactive } from 'vue'

const store = new Map<string, string>()
const mockLocalStorage = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
        store.set(key, value)
    }),
    removeItem: vi.fn((key: string) => {
        store.delete(key)
    }),
    clear: vi.fn(() => {
        store.clear()
    }),
    key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
    get length() {
        return store.size
    },
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
vi.stubGlobal('localStorage', mockLocalStorage as any)

const activeScopes: EffectScope[] = []
const createTestScope = <T>(fn: () => T): T => {
    const scope = effectScope()
    activeScopes.push(scope)
    return scope.run(fn) as T
}

const hoisted = vi.hoisted(() => {
    const mockSettingStore = {
        locale: 'zh-CN',
    }

    return {
        mockSettingStore,
        mockFetchDictOptions: vi.fn(),
        mockLogger: {
            error: vi.fn(),
        },
    }
})

vi.mock('@/modules/system/service', () => ({
    fetchDictOptions: hoisted.mockFetchDictOptions,
}))

vi.mock('@/stores/setting', () => ({
    useSettingStore: () => reactive(hoisted.mockSettingStore),
}))

vi.mock('@/locales', () => ({
    DEFAULT_LOCALE: 'zh-CN',
}))

vi.mock('@/utils/logger', () => ({
    Logger: hoisted.mockLogger,
}))

import { invalidateDictOptionsCache, useDictOptions } from '@/composables/useDictOptions'
import { useSettingStore } from '@/stores/setting'
import type { DictOption } from '@/types/system'

const fallbackOptions: DictOption[] = [{ label: 'Fallback', value: 0, tag_type: 'info' }]

describe('composables/useDictOptions.ts', () => {
    beforeEach(() => {
        useSettingStore().locale = 'zh-CN'
        hoisted.mockFetchDictOptions.mockReset()
        hoisted.mockLogger.error.mockClear()
        mockLocalStorage.clear()
        invalidateDictOptionsCache()
    })

    afterEach(() => {
        activeScopes.forEach((s) => s.stop())
        activeScopes.length = 0
    })

    it('相同 typeCode 与语言的并发加载应复用同一个请求', async () => {
        const remoteOptions: DictOption[] = [{ label: 'Enabled', value: 1, tag_type: 'success' }]
        hoisted.mockFetchDictOptions.mockResolvedValue(remoteOptions)

        const first = createTestScope(() => useDictOptions('common_status', fallbackOptions))
        const second = createTestScope(() => useDictOptions('common_status', fallbackOptions))

        await Promise.all([first.load(), second.load()])

        expect(hoisted.mockFetchDictOptions).toHaveBeenCalledTimes(1)
        expect(hoisted.mockFetchDictOptions).toHaveBeenCalledWith('common_status')
        expect(first.options.value).toEqual(remoteOptions)
        expect(second.options.value).toEqual(remoteOptions)
    })

    it('同一 typeCode 在不同语言下应分别缓存', async () => {
        const zhOptions: DictOption[] = [{ label: '启用', value: 1, tag_type: 'success' }]
        const enOptions: DictOption[] = [{ label: 'Enabled', value: 1, tag_type: 'success' }]
        hoisted.mockFetchDictOptions.mockResolvedValueOnce(zhOptions).mockResolvedValueOnce(enOptions)

        const zhDict = createTestScope(() => useDictOptions('common_status', fallbackOptions))
        await zhDict.load()

        useSettingStore().locale = 'en-US'
        const enDict = createTestScope(() => useDictOptions('common_status', fallbackOptions))
        await enDict.load()

        expect(hoisted.mockFetchDictOptions).toHaveBeenCalledTimes(2)
        expect(zhDict.options.value).toEqual(enOptions)
        expect(enDict.options.value).toEqual(enOptions)
    })

    it('请求失败时应使用 fallback，且失败结果不写入缓存', async () => {
        const remoteOptions: DictOption[] = [{ label: 'Yes', value: 1, tag_type: 'success' }]
        hoisted.mockFetchDictOptions.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce(remoteOptions)

        const dict = createTestScope(() => useDictOptions('yes_no', fallbackOptions))

        await dict.load()
        expect(dict.options.value).toEqual(fallbackOptions)
        expect(hoisted.mockLogger.error).toHaveBeenCalledTimes(1)

        await dict.load()
        expect(hoisted.mockFetchDictOptions).toHaveBeenCalledTimes(2)
        expect(dict.options.value).toEqual(remoteOptions)
    })

    it('失效指定 typeCode 后应重新请求对应 options', async () => {
        const firstOptions: DictOption[] = [{ label: 'Async', value: 'async', tag_type: 'info' }]
        const nextOptions: DictOption[] = [{ label: 'Cron', value: 'cron', tag_type: 'warning' }]
        hoisted.mockFetchDictOptions.mockResolvedValueOnce(firstOptions).mockResolvedValueOnce(nextOptions)

        const dict = createTestScope(() => useDictOptions('task_kind', fallbackOptions))

        await dict.load()
        invalidateDictOptionsCache('task_kind')
        await dict.load()

        expect(hoisted.mockFetchDictOptions).toHaveBeenCalledTimes(2)
        expect(dict.options.value).toEqual(nextOptions)
    })

    it('在加载中 (loading === true) 时 locale 发生变化，应重新拉取新数据', async () => {
        const zhOptions: DictOption[] = [{ label: '启用', value: 1, tag_type: 'success' }]
        const enOptions: DictOption[] = [{ label: 'Enabled', value: 1, tag_type: 'success' }]

        let resolveZh: (value: DictOption[]) => void = () => undefined
        const zhPromise = new Promise<DictOption[]>((resolve) => {
            resolveZh = resolve
        })

        hoisted.mockFetchDictOptions.mockReturnValueOnce(zhPromise).mockResolvedValueOnce(enOptions)

        const dict = createTestScope(() => useDictOptions('common_status', fallbackOptions))
        const loadPromise = dict.load()

        useSettingStore().locale = 'en-US'
        await new Promise((resolve) => setTimeout(resolve, 0))

        resolveZh(zhOptions)
        await loadPromise
        await new Promise((resolve) => setTimeout(resolve, 50))

        expect(dict.options.value).toEqual(enOptions)
        expect(hoisted.mockFetchDictOptions).toHaveBeenCalledTimes(2)
    })
})
