import { ref, type Ref } from 'vue'
import { Logger } from '@/utils/logger'
import { getMenuList } from '@/api/permission'
import { normalizeListData } from '@/modules/shared/response'
import type { Menu } from '@/types/menu'

export function useMenuList() {
    const loading = ref(false)
    const menuList = ref([]) as Ref<Menu[]>

    const getList = async () => {
        loading.value = true
        try {
            const response = await getMenuList()
            // 使用 normalizeListData 处理返回数据
            const result = normalizeListData<Menu>(response)
            menuList.value = result.list
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
