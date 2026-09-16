import { getMenuList, refreshAllMenuPermissions } from '@/api/permission'
import { normalizeArrayData, normalizeDetailData } from '@/modules/shared/response'
import type { Menu } from '@/types/menu'

export async function fetchMenuTree(params?: Record<string, unknown>) {
    const response = await getMenuList(params)
    return normalizeArrayData<Menu>(response)
}

export async function refreshMenuPermissionCache() {
    const response = await refreshAllMenuPermissions()
    return normalizeDetailData(response, {} as Record<string, unknown>)
}
