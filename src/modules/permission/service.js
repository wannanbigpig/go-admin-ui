import {
    getPermissionList,
    editPermission,
    getMenuList,
    createMenu,
    updateMenu,
    getMenuDetail,
    deleteMenu,
    getRoleList,
    createRole,
    updateRole,
    getRoleDetail,
    deleteRole,
} from '@/api/permission'
import { normalizeArrayData, normalizeDetailData, normalizeListData } from '@/modules/shared/response'

export async function fetchPermissionPage(params) {
    const response = await getPermissionList(params)
    return normalizeListData(response)
}

export async function updatePermissionItem(data) {
    const response = await editPermission(data)
    return normalizeDetailData(response, {})
}

export async function fetchMenuTree(params) {
    const response = await getMenuList(params)
    return normalizeArrayData(response)
}

export async function fetchMenuDetail(id) {
    const response = await getMenuDetail({ id })
    return normalizeDetailData(response, {})
}

export async function createMenuItem(data) {
    const response = await createMenu(data)
    return normalizeDetailData(response, {})
}

export async function updateMenuItem(data) {
    const response = await updateMenu(data)
    return normalizeDetailData(response, {})
}

export async function deleteMenuItem(id) {
    const response = await deleteMenu({ id })
    return normalizeDetailData(response, {})
}

export async function fetchRolePage(params) {
    const response = await getRoleList(params)
    return normalizeListData(response)
}

export async function fetchRoleTree(params) {
    const response = await getRoleList(params)
    return normalizeArrayData(response)
}

export async function fetchRoleDetail(id) {
    const response = await getRoleDetail({ id })
    return normalizeDetailData(response, {})
}

export async function createRoleItem(data) {
    const response = await createRole(data)
    return normalizeDetailData(response, {})
}

export async function updateRoleItem(data) {
    const response = await updateRole(data)
    return normalizeDetailData(response, {})
}

export async function deleteRoleItem(id) {
    const response = await deleteRole({ id })
    return normalizeDetailData(response, {})
}
