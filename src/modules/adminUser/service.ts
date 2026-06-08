import * as adminUserApi from '@/api/adminUser'
import { normalizeListData, normalizeDetailData } from '@/modules/shared/response'
import type { AdminUser, AdminUserQuery } from '@/types/adminUser'

export async function fetchAdminUserList(params: Partial<AdminUserQuery>) {
    const response = await adminUserApi.getAdminUserList(params)
    return normalizeListData<AdminUser>(response)
}

export async function fetchAdminUserDetail(id: number | string) {
    const response = await adminUserApi.getAdminUserDetail({ id })
    return normalizeDetailData(response, {} as AdminUser)
}

export async function addAdminUser(data: Record<string, unknown>) {
    return await adminUserApi.createAdminUser(data)
}

export async function modifyAdminUser(data: Record<string, unknown>) {
    return await adminUserApi.updateAdminUser(data)
}

export async function removeAdminUser(id: number | string) {
    return await adminUserApi.deleteAdminUser(id)
}

export async function updateAdminUserRoles(userId: number | string, roleIds: number[]) {
    return await adminUserApi.bindAdminUserRole({
        user_id: userId,
        role_ids: roleIds,
    })
}

// 补充缺失的方法（保持与原有 JS 代码兼容）
export async function fetchAdminUserFullPhone(id: number | string) {
    const response = await adminUserApi.getFullPhone({ id })
    return normalizeDetailData(response, { phone_number: '' })
}

export async function fetchAdminUserFullEmail(id: number | string) {
    const response = await adminUserApi.getFullEmail({ id })
    return normalizeDetailData(response, { email: '' })
}

// 原有 JS 版本的别名（保持兼容性）
export const createAdminUserItem = addAdminUser
export const updateAdminUserItem = modifyAdminUser
export const deleteAdminUserItem = removeAdminUser
