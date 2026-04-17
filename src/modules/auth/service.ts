import { login, getCaptcha } from '@/api/login'
import { getUserInfo, getUserMenuList, updateProfile } from '@/api/auth'
import { normalizeArrayData, normalizeDetailData } from '@/modules/shared/response'
import type { LoginResult, UserInfo, UserPermission } from '@/types/auth'

export async function fetchCaptcha() {
    const response = await getCaptcha()
    return normalizeDetailData(response, {} as any)
}

export async function loginWithCredentials(data: any): Promise<LoginResult> {
    const response = await login(data)
    return normalizeDetailData(response, {} as LoginResult)
}

export async function fetchCurrentUser(): Promise<UserInfo> {
    const response = await getUserInfo()
    return normalizeDetailData(response, {} as UserInfo)
}

export async function fetchUserMenuTree(): Promise<UserPermission[]> {
    const response = await getUserMenuList()
    return normalizeArrayData(response)
}

export async function saveProfile(data: any) {
    const response = await updateProfile(data)
    return normalizeDetailData(response, {} as any)
}
