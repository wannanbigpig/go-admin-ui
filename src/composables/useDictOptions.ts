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

const dictOptionsCache = new Map<string, DictOptionsCacheEntry>()

const buildDictOptionsCacheKey = (typeCode: string, locale: string) => `${typeCode}::${locale}`

const requestCachedDictOptions = async (typeCode: string, locale: string, force = false) => {
    const cacheKey = buildDictOptionsCacheKey(typeCode, locale)
    const cached = dictOptionsCache.get(cacheKey)

    if (!force && cached?.data) {
        return cached.data
    }

    if (!force && cached?.request) {
        return cached.request
    }

    const request = fetchDictOptions(typeCode)
        .then((options) => {
            dictOptionsCache.set(cacheKey, { data: options })
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
        return
    }

    for (const cacheKey of dictOptionsCache.keys()) {
        if (cacheKey.startsWith(`${typeCode}::`)) {
            dictOptionsCache.delete(cacheKey)
        }
    }
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
