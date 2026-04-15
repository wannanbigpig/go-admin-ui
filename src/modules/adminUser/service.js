import {
    getAdminUserList,
    getAdminUserDetail,
    getFullEmail,
    getFullPhone,
    uploadAvatar,
    createAdminUser,
    updateAdminUser,
    deleteAdminUser,
    bindAdminUserRole,
} from '@/api/adminUser'
import { normalizeDetailData, normalizeListData } from '@/modules/shared/response'

export async function fetchAdminUserPage(params) {
    const response = await getAdminUserList(params)
    return normalizeListData(response)
}

export async function fetchAdminUserDetail(id) {
    const response = await getAdminUserDetail({ id })
    return normalizeDetailData(response, {})
}

export async function fetchAdminUserFullPhone(id) {
    const response = await getFullPhone({ id })
    return normalizeDetailData(response, {})
}

export async function fetchAdminUserFullEmail(id) {
    const response = await getFullEmail({ id })
    return normalizeDetailData(response, {})
}

export async function createAdminUserItem(data) {
    const response = await createAdminUser(data)
    return normalizeDetailData(response, {})
}

export async function updateAdminUserItem(data) {
    const response = await updateAdminUser(data)
    return normalizeDetailData(response, {})
}

export async function deleteAdminUserItem(id) {
    const response = await deleteAdminUser(id)
    return normalizeDetailData(response, {})
}

export async function bindAdminUserRoles(data) {
    const response = await bindAdminUserRole(data)
    return normalizeDetailData(response, {})
}

export async function uploadAvatarFile(files, extra = {}) {
    const response = await uploadAvatar(files, extra)
    return normalizeDetailData(response, {})
}
