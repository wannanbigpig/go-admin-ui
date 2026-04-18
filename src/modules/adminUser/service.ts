import * as adminUserApi from '@/api/adminUser'
import { normalizeListData, normalizeDetailData } from '@/modules/shared/response'
import type { AdminUser, AdminUserQuery } from '@/types/adminUser'

export async function fetchAdminUserList(params: AdminUserQuery) {
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
    return normalizeDetailData(response, { phone: '' })
}

export async function fetchAdminUserFullEmail(id: number | string) {
    const response = await adminUserApi.getFullEmail({ id })
    return normalizeDetailData(response, { email: '' })
}

export async function uploadUserAvatar(file: File) {
    const response = await adminUserApi.uploadAvatar(file, { category: 'avatar' })
    return normalizeDetailData(response, { url: '' })
}

// 原有 JS 版本的别名（保持兼容性）
export const createAdminUserItem = addAdminUser
export const updateAdminUserItem = modifyAdminUser
export const deleteAdminUserItem = removeAdminUser
export async function uploadAvatarFile(file: File, extra: Record<string, unknown>) {
    const response = await adminUserApi.uploadAvatar(file, extra)
    return normalizeDetailData(response, { url: '' })
}
