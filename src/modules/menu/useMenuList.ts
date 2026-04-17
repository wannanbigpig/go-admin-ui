import { ref, type Ref } from 'vue'
import { getMenuList } from '@/api/permission'
import type { Menu } from '@/types/menu'

export function useMenuList() {
    const loading = ref(false)
    const menuList = ref([]) as Ref<Menu[]>

    const getList = async () => {
        loading.value = true
        try {
            const response = await getMenuList()
            menuList.value = response.data
        } catch (error) {
            console.error('获取菜单列表失败:', error)
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
