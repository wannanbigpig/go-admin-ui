import { computed, ref, watch } from 'vue'
import { fetchDictOptions } from '@/modules/system/service'
import { DEFAULT_LOCALE } from '@/locales'
import { useSettingStore } from '@/stores/setting'
import { Logger } from '@/utils/logger'
import type { DictOption } from '@/types/system'

interface DictOptionsCacheEntry {
    data?: DictOption[]
    request?: Promise<DictOption[]>
}

interface LocalStorageCacheEntry {
    data: DictOption[]
    expiry: number
}

const DICT_CACHE_PREFIX = 'dict_cache:'
const DICT_CACHE_TTL = 30 * 60 * 1000 // 30 分钟

const dictOptionsCache = new Map<string, DictOptionsCacheEntry>()

const buildDictOptionsCacheKey = (typeCode: string, locale: string) => `${typeCode}::${locale}`

const buildLocalStorageKey = (typeCode: string, locale: string) => `${DICT_CACHE_PREFIX}${locale}:${typeCode}`

const getLocalStorageCache = (typeCode: string, locale: string): DictOption[] | null => {
    try {
        const key = buildLocalStorageKey(typeCode, locale)
        const cached = localStorage.getItem(key)
        if (!cached) return null

        const entry: LocalStorageCacheEntry = JSON.parse(cached)
        if (Date.now() > entry.expiry) {
            localStorage.removeItem(key)
            return null
        }

        return entry.data
    } catch {
        return null
    }
}

const setLocalStorageCache = (typeCode: string, locale: string, data: DictOption[]) => {
    try {
        const key = buildLocalStorageKey(typeCode, locale)
        const entry: LocalStorageCacheEntry = {
            data,
            expiry: Date.now() + DICT_CACHE_TTL,
        }
        localStorage.setItem(key, JSON.stringify(entry))
    } catch {
        // LocalStorage 写入失败时静默忽略
    }
}

const removeLocalStorageCache = (typeCode?: string) => {
    try {
        if (!typeCode) {
            // 清除所有字典缓存
            const keys = Object.keys(localStorage).filter((key) => key.startsWith(DICT_CACHE_PREFIX))
            keys.forEach((key) => localStorage.removeItem(key))
            return
        }

        // 清除指定 typeCode 的所有语言缓存
        const keys = Object.keys(localStorage).filter((key) => key.startsWith(DICT_CACHE_PREFIX) && key.endsWith(`:${typeCode}`))
        keys.forEach((key) => localStorage.removeItem(key))
    } catch {
        // LocalStorage 操作失败时静默忽略
    }
}

const requestCachedDictOptions = async (typeCode: string, locale: string, force = false) => {
    const cacheKey = buildDictOptionsCacheKey(typeCode, locale)
    const cached = dictOptionsCache.get(cacheKey)

    // 1. 内存缓存（最快）
    if (!force && cached?.data) {
        return cached.data
    }

    if (!force && cached?.request) {
        return cached.request
    }

    // 2. LocalStorage 缓存（次快）
    if (!force) {
        const localData = getLocalStorageCache(typeCode, locale)
        if (localData) {
            // 同步到内存缓存
            dictOptionsCache.set(cacheKey, { data: localData })
            return localData
        }
    }

    // 3. 网络请求（最慢）
    const request = fetchDictOptions(typeCode)
        .then((options) => {
            // 同时写入内存缓存和 LocalStorage 缓存
            dictOptionsCache.set(cacheKey, { data: options })
            setLocalStorageCache(typeCode, locale, options)
            return options
        })
        .catch((error) => {
            dictOptionsCache.delete(cacheKey)
            throw error
        })

    dictOptionsCache.set(cacheKey, { request })
    return request
}

export function useDictOptions(typeCode: string, fallback: DictOption[] = []) {
    const settingStore = useSettingStore()
    const loading = ref(false)
    const remoteOptions = ref<DictOption[]>([])
    const loaded = ref(false)

    const options = computed(() => (remoteOptions.value.length > 0 ? remoteOptions.value : fallback))
    const tagMap = computed(() => buildDictTagMap(options.value))

    const getCurrentLocale = () => settingStore.locale || DEFAULT_LOCALE

    const load = async (loadOptions: { force?: boolean } = {}) => {
        const locale = getCurrentLocale()
        const cacheKey = buildDictOptionsCacheKey(typeCode, locale)
        loading.value = true
        try {
            const nextOptions = await requestCachedDictOptions(typeCode, locale, loadOptions.force)
            if (cacheKey === buildDictOptionsCacheKey(typeCode, getCurrentLocale())) {
                remoteOptions.value = nextOptions
            }
        } catch (error) {
            Logger.error(`获取字典选项失败: ${typeCode}`, error)
            remoteOptions.value = []
        } finally {
            loaded.value = true
            loading.value = false
        }
    }

    watch(
        () => settingStore.locale,
        () => {
            remoteOptions.value = []
            // 语言切换时清除所有字典缓存
            invalidateDictOptionsCache()
            if (loaded.value) {
                void load()
            }
        }
    )

    return {
        loading,
        options,
        tagMap,
        load,
    }
}

export function invalidateDictOptionsCache(typeCode?: string) {
    if (!typeCode) {
        dictOptionsCache.clear()
        removeLocalStorageCache()
        return
    }

    for (const cacheKey of dictOptionsCache.keys()) {
        if (cacheKey.startsWith(`${typeCode}::`)) {
            dictOptionsCache.delete(cacheKey)
        }
    }
    removeLocalStorageCache(typeCode)
}

export function buildDictTagMap(options: DictOption[]) {
    return options.reduce<Record<string, { type: string; text: string }>>((result, option) => {
        result[String(option.value)] = {
            type: option.tag_type || 'info',
            text: option.label,
        }
        return result
    }, {})
}

export function getDictOptionLabel(options: DictOption[], value?: string | number | null) {
    if (value === undefined || value === null || value === '') return '-'
    return options.find((item) => String(item.value) === String(value))?.label || String(value)
}
