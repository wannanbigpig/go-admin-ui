import { ref } from 'vue'
import { getPermissionList } from '@/api/permission'
import type { ApiPermission } from '@/modules/apiPermission/model'

export function useMenuPermissionSelection() {
    const permissionList = ref<ApiPermission[]>([])
    const permissionListLoading = ref(false)

    const filterPermission = (query: string, item: ApiPermission) => {
        return item.name.toLowerCase().includes(query.toLowerCase()) || item.path.toLowerCase().includes(query.toLowerCase())
    }

    const fetchPermissionList = async () => {
        permissionListLoading.value = true
        try {
            const response = await getPermissionList({ page_size: 999 })
            permissionList.value = response.data.list || []
        } catch (error) {
            console.error('获取接口权限失败:', error)
        } finally {
            permissionListLoading.value = false
        }
    }

    return {
        permissionList,
        permissionListLoading,
        filterPermission,
        fetchPermissionList,
    }
}
