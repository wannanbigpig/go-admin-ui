import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchPermissionPage } from '@/modules/permission/service'
import { MENU_PERMISSION_QUERY_PARAMS } from '@/modules/menu/model'

export function useMenuPermissionSelection() {
    const permissionList = ref(null)
    const permissionListLoading = ref(false)
    const hasLoadedPermissionList = ref(false)

    const filterPermission = (query, item) => {
        const lowerQuery = query.toLowerCase()
        return item.name.toLowerCase().includes(lowerQuery) || item.route.includes(lowerQuery)
    }

    const fetchPermissionList = async () => {
        if (hasLoadedPermissionList.value && permissionList.value) {
            return permissionList.value
        }

        permissionListLoading.value = true
        try {
            const result = await fetchPermissionPage(MENU_PERMISSION_QUERY_PARAMS)
            permissionList.value = result.list || []
            hasLoadedPermissionList.value = true
            return permissionList.value
        } catch (error) {
            console.error('获取权限列表失败:', error)
            ElMessage.error('获取权限列表失败')
            throw error
        } finally {
            permissionListLoading.value = false
        }
    }

    return {
        permissionList,
        permissionListLoading,
        hasLoadedPermissionList,
        filterPermission,
        fetchPermissionList,
    }
}
