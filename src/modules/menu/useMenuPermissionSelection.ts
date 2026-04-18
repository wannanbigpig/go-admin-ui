import { ref } from 'vue'
import { getPermissionList } from '@/api/permission'
import type { ApiPermission } from '@/modules/apiPermission/model'
import { normalizeListData } from '@/modules/shared/response'

export function useMenuPermissionSelection() {
    const permissionList = ref<ApiPermission[]>([])
    const permissionListLoading = ref(false)

    const filterPermission = (query: string, item: ApiPermission) => {
        return item.name.toLowerCase().includes(query.toLowerCase()) || item.route.toLowerCase().includes(query.toLowerCase())
    }

    const extractPermissionList = (response: unknown): ApiPermission[] => {
        const normalizedResult = normalizeListData<ApiPermission>(response as Parameters<typeof normalizeListData<ApiPermission>>[0])
        if (normalizedResult.list.length > 0) {
            return normalizedResult.list
        }

        const payload = (response as { data?: unknown })?.data
        if (!payload || typeof payload !== 'object') return []

        const rawPayload = payload as Record<string, unknown>
        if (Array.isArray(rawPayload.list)) {
            return rawPayload.list as ApiPermission[]
        }
        if (rawPayload.data && typeof rawPayload.data === 'object' && Array.isArray((rawPayload.data as Record<string, unknown>).list)) {
            return (rawPayload.data as Record<string, unknown>).list as ApiPermission[]
        }

        return []
    }

    const fetchPermissionList = async () => {
        permissionListLoading.value = true
        try {
            const response = await getPermissionList({ per_page: 999 })
            permissionList.value = extractPermissionList(response)
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
