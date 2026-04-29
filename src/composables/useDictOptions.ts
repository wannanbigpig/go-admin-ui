import { computed, ref } from 'vue'
import { fetchDictOptions } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { DictOption } from '@/types/system'

export function useDictOptions(typeCode: string, fallback: DictOption[] = []) {
    const loading = ref(false)
    const remoteOptions = ref<DictOption[]>([])

    const options = computed(() => (remoteOptions.value.length > 0 ? remoteOptions.value : fallback))
    const tagMap = computed(() => buildDictTagMap(options.value))

    const load = async () => {
        loading.value = true
        try {
            remoteOptions.value = await fetchDictOptions(typeCode)
        } catch (error) {
            Logger.error(`获取字典选项失败: ${typeCode}`, error)
            remoteOptions.value = []
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        options,
        tagMap,
        load,
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
