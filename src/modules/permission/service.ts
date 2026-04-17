import { getPermissionList, editPermission, getMenuList, createMenu, updateMenu, getMenuDetail, deleteMenu, getRoleList, createRole, updateRole, getRoleDetail, deleteRole } from '@/api/permission'
import { normalizeArrayData, normalizeDetailData, normalizeListData } from '@/modules/shared/response'
import type { Role } from '@/types/role'
import type { Menu } from '@/types/menu'

export async function fetchPermissionPage(params?: any) {
    const response = await getPermissionList(params)
    return normalizeListData<any>(response)
}

export async function updatePermissionItem(data: any) {
    const response = await editPermission(data)
    return normalizeDetailData(response, {} as any)
}

export async function fetchMenuTree(params?: any) {
    const response = await getMenuList(params)
    return normalizeArrayData<Menu>(response)
}

export async function fetchMenuDetail(id: number | string) {
    const response = await getMenuDetail({ id })
    return normalizeDetailData(response, {} as Menu)
}

export async function createMenuItem(data: any) {
    const response = await createMenu(data)
    return normalizeDetailData(response, {} as any)
}

export async function updateMenuItem(data: any) {
    const response = await updateMenu(data)
    return normalizeDetailData(response, {} as any)
}

export async function deleteMenuItem(id: number | string) {
    const response = await deleteMenu({ id })
    return normalizeDetailData(response, {} as any)
}

export async function fetchRolePage(params?: any) {
    const response = await getRoleList(params)
    return normalizeListData<Role>(response)
}

export async function fetchRoleTree(params?: any) {
    const response = await getRoleList(params)
    return normalizeArrayData<Role>(response as any)
}

export async function fetchRoleDetail(id: number | string) {
    const response = await getRoleDetail({ id })
    return normalizeDetailData(response, {} as Role)
}

export async function createRoleItem(data: any) {
    const response = await createRole(data)
    return normalizeDetailData(response, {} as any)
}

export async function updateRoleItem(data: any) {
    const response = await updateRole(data)
    return normalizeDetailData(response, {} as any)
}

export async function deleteRoleItem(id: number | string) {
    const response = await deleteRole({ id })
    return normalizeDetailData(response, {} as any)
}
