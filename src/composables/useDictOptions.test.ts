import { beforeEach, describe, expect, it, vi } from 'vitest'

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
    useSettingStore: () => hoisted.mockSettingStore,
}))

vi.mock('@/locales', () => ({
    DEFAULT_LOCALE: 'zh-CN',
}))

vi.mock('@/utils/logger', () => ({
    Logger: hoisted.mockLogger,
}))

import { invalidateDictOptionsCache, useDictOptions } from '@/composables/useDictOptions'
import type { DictOption } from '@/types/system'

const fallbackOptions: DictOption[] = [{ label: 'Fallback', value: 0, tag_type: 'info' }]

describe('composables/useDictOptions.ts', () => {
    beforeEach(() => {
        hoisted.mockSettingStore.locale = 'zh-CN'
        hoisted.mockFetchDictOptions.mockReset()
        hoisted.mockLogger.error.mockClear()
        invalidateDictOptionsCache()
    })

    it('相同 typeCode 与语言的并发加载应复用同一个请求', async () => {
        const remoteOptions: DictOption[] = [{ label: 'Enabled', value: 1, tag_type: 'success' }]
        hoisted.mockFetchDictOptions.mockResolvedValue(remoteOptions)

        const first = useDictOptions('common_status', fallbackOptions)
        const second = useDictOptions('common_status', fallbackOptions)

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

        const zhDict = useDictOptions('common_status', fallbackOptions)
        await zhDict.load()

        hoisted.mockSettingStore.locale = 'en-US'
        const enDict = useDictOptions('common_status', fallbackOptions)
        await enDict.load()

        expect(hoisted.mockFetchDictOptions).toHaveBeenCalledTimes(2)
        expect(zhDict.options.value).toEqual(zhOptions)
        expect(enDict.options.value).toEqual(enOptions)
    })

    it('请求失败时应使用 fallback，且失败结果不写入缓存', async () => {
        const remoteOptions: DictOption[] = [{ label: 'Yes', value: 1, tag_type: 'success' }]
        hoisted.mockFetchDictOptions.mockRejectedValueOnce(new Error('network error')).mockResolvedValueOnce(remoteOptions)

        const dict = useDictOptions('yes_no', fallbackOptions)

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

        const dict = useDictOptions('task_kind', fallbackOptions)

        await dict.load()
        invalidateDictOptionsCache('task_kind')
        await dict.load()

        expect(hoisted.mockFetchDictOptions).toHaveBeenCalledTimes(2)
        expect(dict.options.value).toEqual(nextOptions)
    })
})
