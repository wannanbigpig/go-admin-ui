import { computed, ref, watch } from 'vue'
import { fetchDictOptions } from '@/modules/system/service'
import { DEFAULT_LOCALE } from '@/locales'
import { useSettingStore } from '@/stores/setting'
import { Logger } from '@/utils/logger'
import type { DictOption } from '@/types/system'

interface DictOptionsCacheEntry {
    data?: DictOption[]
    request?: Promise<DictOption[]>
    timestamp?: number
}

interface LocalStorageCacheEntry {
    data: DictOption[]
    expiry: number
}

const DICT_CACHE_PREFIX = 'dict_cache:'
const DICT_CACHE_TTL = 30 * 60 * 1000 // 30 分钟
const DICT_MEMORY_CACHE_TTL = 30 * 60 * 1000 // 内存缓存 30 分钟过期

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
    } catch (error) {
        Logger.warn('从 localStorage 获取字典缓存失败:', error)
        return null
    }
}

const setLocalStorageCache = (typeCode: string, locale: string, data: DictOption[]) => {
    const key = buildLocalStorageKey(typeCode, locale)
    const entry: LocalStorageCacheEntry = {
        data,
        expiry: Date.now() + DICT_CACHE_TTL,
    }
    localStorage.setItem(key, JSON.stringify(entry))
}

const removeLocalStorageCache = (typeCode?: string) => {
    try {
        const keys: string[] = []
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i)
            if (key) {
                keys.push(key)
            }
        }

        if (!typeCode) {
            // 清除所有字典缓存
            const targetKeys = keys.filter((key) => key.startsWith(DICT_CACHE_PREFIX))
            targetKeys.forEach((key) => localStorage.removeItem(key))
            return
        }

        // 清除指定 typeCode 的所有语言缓存
        const targetKeys = keys.filter((key) => key.startsWith(DICT_CACHE_PREFIX) && key.endsWith(`:${typeCode}`))
        targetKeys.forEach((key) => localStorage.removeItem(key))
    } catch (error) {
        // LocalStorage 操作失败时静默忽略，但记录警告日志
        Logger.warn('清除 localStorage 字典缓存失败:', error)
    }
}

const requestCachedDictOptions = async (typeCode: string, locale: string, force = false) => {
    const cacheKey = buildDictOptionsCacheKey(typeCode, locale)
    const cached = dictOptionsCache.get(cacheKey)

    // 1. 内存缓存（最快）
    if (!force && cached?.data) {
        // 检查内存缓存是否过期
        if (cached.timestamp && Date.now() - cached.timestamp > DICT_MEMORY_CACHE_TTL) {
            dictOptionsCache.delete(cacheKey)
        } else {
            return cached.data
        }
    }

    if (!force && cached?.request) {
        return cached.request
    }

    // 2. LocalStorage 缓存（次快）
    if (!force) {
        const localData = getLocalStorageCache(typeCode, locale)
        if (localData) {
            // 同步到内存缓存
            dictOptionsCache.set(cacheKey, { data: localData, timestamp: Date.now() })
            return localData
        }
    }

    // 3. 网络请求（最慢）
    const request = fetchDictOptions(typeCode)
        .then((options) => {
            // 同时写入内存缓存和 LocalStorage 缓存
            dictOptionsCache.set(cacheKey, { data: options, timestamp: Date.now() })
            try {
                setLocalStorageCache(typeCode, locale, options)
            } catch (err) {
                Logger.error('设置 localStorage 字典缓存失败 (配额溢出或安全禁止):', err)
            }
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

    const options = computed(() => {
        const rawOptions = remoteOptions.value.length > 0 ? remoteOptions.value : fallback
        if (typeCode === 'common_status') {
            return rawOptions.map((item) => {
                if (String(item.value) === '0') {
                    return { ...item, tag_type: 'danger' }
                }
                return item
            })
        }
        return rawOptions
    })
    const tagMap = computed(() => buildDictTagMap(options.value))

    const getCurrentLocale = () => settingStore.locale || DEFAULT_LOCALE

    let loadVersion = 0

    const load = async (loadOptions: { force?: boolean } = {}) => {
        const locale = getCurrentLocale()
        const cacheKey = buildDictOptionsCacheKey(typeCode, locale)
        const version = ++loadVersion
        loading.value = true
        try {
            const nextOptions = await requestCachedDictOptions(typeCode, locale, loadOptions.force)
            if (version === loadVersion && cacheKey === buildDictOptionsCacheKey(typeCode, getCurrentLocale())) {
                remoteOptions.value = nextOptions
            }
        } catch (error) {
            Logger.error(`获取字典选项失败: ${typeCode}`, error)
            if (version === loadVersion) {
                remoteOptions.value = []
            }
        } finally {
            if (version === loadVersion) {
                loaded.value = true
                loading.value = false
            }
        }
    }

    watch(
        () => settingStore.locale,
        () => {
            // 缓存 key 已经按 locale 隔离，不再全量清空缓存；
            // 仅切换当前 ref 至对应 locale 的缓存（命中即直接同步，未命中则发起请求）。
            remoteOptions.value = []
            if (loaded.value || loading.value) {
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
