import { login, getCaptcha } from '@/api/login'
import { getUserInfo, getUserMenuList, updateProfile } from '@/api/auth'
import { normalizeArrayData, normalizeDetailData } from '@/modules/shared/response'

export async function fetchCaptcha() {
    const response = await getCaptcha()
    return normalizeDetailData(response, {})
}

export async function loginWithCredentials(data) {
    const response = await login(data)
    return normalizeDetailData(response, {})
}

export async function fetchCurrentUser() {
    const response = await getUserInfo()
    return normalizeDetailData(response, {})
}

export async function fetchUserMenuTree() {
    const response = await getUserMenuList()
    return normalizeArrayData(response)
}

export async function saveProfile(data) {
    const response = await updateProfile(data)
    return normalizeDetailData(response, {})
}
