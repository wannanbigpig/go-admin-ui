import * as adminUserApi from '@/api/adminUser'
import { normalizeListData, normalizeDetailData } from '@/modules/shared/response'
import type { AdminUser } from '@/types/adminUser'

export async function fetchAdminUserList(params: any) {
    const response = await adminUserApi.getAdminUserList(params)
    return normalizeListData<AdminUser>(response)
}

export async function fetchAdminUserDetail(id: number | string) {
    const response = await adminUserApi.getAdminUserDetail({ id })
    return normalizeDetailData(response, {} as AdminUser)
}

export async function addAdminUser(data: any) {
    return await adminUserApi.createAdminUser(data)
}

export async function modifyAdminUser(data: any) {
    return await adminUserApi.updateAdminUser(data)
}

export async function removeAdminUser(id: number | string) {
    return await adminUserApi.deleteAdminUser(id)
}

export async function updateAdminUserRoles(adminUserId: number | string, roleIds: number[]) {
    return await adminUserApi.bindAdminUserRole({
        admin_user_id: adminUserId,
        role_ids: roleIds,
    })
}

// 补充缺失的方法
export async function fetchAdminUserFullPhone(id: number | string) {
    const response = await adminUserApi.getFullPhone({ id })
    return normalizeDetailData(response, { mobile: '' } as any)
}

export async function fetchAdminUserFullEmail(id: number | string) {
    const response = await adminUserApi.getFullEmail({ id })
    return normalizeDetailData(response, { email: '' } as any)
}

export async function uploadUserAvatar(file: File) {
    const response = await adminUserApi.uploadAvatar(file, { category: 'avatar' })
    return normalizeDetailData(response, { url: '' })
}
