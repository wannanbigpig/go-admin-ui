import { nextTick, ref, shallowRef, type Ref } from 'vue'
import { Logger } from '@/utils/logger'
import { getMenuList } from '@/api/permission'
import { normalizeListData } from '@/modules/shared/response'
import type { Menu } from '@/types/menu'

const PROGRESSIVE_CHUNK_SIZE = 30

export function useMenuList() {
    const loading = ref(false)
    const menuList = shallowRef([]) as Ref<Menu[]>

    const setListProgressively = async (list: Menu[]) => {
        menuList.value = list.slice(0, PROGRESSIVE_CHUNK_SIZE)
        if (list.length <= PROGRESSIVE_CHUNK_SIZE) return
        await nextTick()
        let cursor = PROGRESSIVE_CHUNK_SIZE
        while (cursor < list.length) {
            await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
            cursor += PROGRESSIVE_CHUNK_SIZE
            menuList.value = list.slice(0, cursor)
        }
    }

    const getList = async (params?: Record<string, unknown>) => {
        loading.value = true
        try {
            const response = await getMenuList(params)
            const result = normalizeListData<Menu>(response)
            await setListProgressively(result.list)
        } catch (error) {
            Logger.error('获取菜单列表失败:', error)
        } finally {
            loading.value = false
        }
    }

    return {
        loading,
        menuList,
        getList,
    }
}
