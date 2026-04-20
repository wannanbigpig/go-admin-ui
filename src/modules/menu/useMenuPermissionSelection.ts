import { ref } from 'vue'
import { Logger } from '@/utils/logger'
import { getPermissionList } from '@/api/permission'
import type { ApiPermission } from '@/modules/apiPermission/model'
import { extractListData } from '@/modules/shared/response'

export function useMenuPermissionSelection() {
    const permissionList = ref<ApiPermission[]>([])
    const permissionListLoading = ref(false)

    const filterPermission = (query: string, item: ApiPermission) => {
        return item.name.toLowerCase().includes(query.toLowerCase()) || item.route.toLowerCase().includes(query.toLowerCase())
    }

    const fetchPermissionList = async () => {
        permissionListLoading.value = true
        try {
            const response = await getPermissionList({ per_page: 999 })
            permissionList.value = extractListData<ApiPermission>(response)
        } catch (error) {
            Logger.error('获取接口权限失败:', error)
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
