import { ref } from 'vue'
import { Logger } from '@/utils/logger'
import { getPermissionList } from '@/api/permission'
import type { ApiPermission } from '@/modules/apiPermission/model'
import { extractListData } from '@/modules/shared/response'
import { MENU_PERMISSION_QUERY_PARAMS } from '@/modules/menu/model'

export function useMenuPermissionSelection() {
    const permissionList = ref<ApiPermission[]>([])
    const permissionListLoading = ref(false)

    const filterPermission = (query: string, item: ApiPermission) => {
        const keyword = query.toLowerCase()
        return item.name.toLowerCase().includes(keyword) || item.route.toLowerCase().includes(keyword) || item.method.toLowerCase().includes(keyword)
    }

    const fetchPermissionList = async () => {
        permissionListLoading.value = true
        try {
            const response = await getPermissionList({ ...MENU_PERMISSION_QUERY_PARAMS, per_page: 999 })
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
