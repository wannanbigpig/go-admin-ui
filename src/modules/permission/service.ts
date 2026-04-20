import { getPermissionList, editPermission, getMenuList, createMenu, updateMenu, getMenuDetail, deleteMenu, getRoleList, createRole, updateRole, getRoleDetail, deleteRole } from '@/api/permission'
import { normalizeArrayData, normalizeDetailData, normalizeListData } from '@/modules/shared/response'
import type { Role } from '@/types/role'
import type { Menu } from '@/types/menu'

export async function fetchPermissionPage(params?: Record<string, unknown>) {
    const response = await getPermissionList(params)
    return normalizeListData<unknown>(response)
}

export async function updatePermissionItem(data: Record<string, unknown>) {
    const response = await editPermission(data)
    return normalizeDetailData(response, {} as Record<string, unknown>)
}

export async function fetchMenuTree(params?: Record<string, unknown>) {
    const response = await getMenuList(params)
    return normalizeArrayData<Menu>(response)
}

export async function fetchMenuDetail(id: number | string) {
    const response = await getMenuDetail({ id })
    return normalizeDetailData(response, {} as Menu)
}

export async function createMenuItem(data: Record<string, unknown>) {
    const response = await createMenu(data)
    return normalizeDetailData(response, {} as Record<string, unknown>)
}

export async function updateMenuItem(data: Record<string, unknown>) {
    const response = await updateMenu(data)
    return normalizeDetailData(response, {} as Record<string, unknown>)
}

export async function deleteMenuItem(id: number | string) {
    const response = await deleteMenu({ id })
    return normalizeDetailData(response, {} as Record<string, unknown>)
}

export async function fetchRolePage(params?: Record<string, unknown>) {
    const response = await getRoleList(params)
    return normalizeListData<Role>(response)
}

export async function fetchRoleTree(params?: Record<string, unknown>) {
    const response = await getRoleList(params)
    const normalizedPageData = normalizeListData<Role>(response)
    if (normalizedPageData.list.length > 0) {
        return normalizedPageData.list
    }
    return normalizeArrayData<Role>(response)
}

export async function fetchRoleDetail(id: number | string) {
    const response = await getRoleDetail({ id })
    return normalizeDetailData(response, {} as Role)
}

export async function createRoleItem(data: Record<string, unknown>) {
    const response = await createRole(data)
    return normalizeDetailData(response, {} as Record<string, unknown>)
}

export async function updateRoleItem(data: Record<string, unknown>) {
    const response = await updateRole(data)
    return normalizeDetailData(response, {} as Record<string, unknown>)
}

export async function deleteRoleItem(id: number | string) {
    const response = await deleteRole({ id })
    return normalizeDetailData(response, {} as Record<string, unknown>)
}
