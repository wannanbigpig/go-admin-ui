import { login, getCaptcha } from '@/api/login'
import { getUserInfo, getUserMenuList, updateProfile } from '@/api/auth'
import { createEmptyLoginResult, createEmptyUserInfo } from '@/modules/auth/model'
import { normalizeArrayData, normalizeDetailData } from '@/modules/shared/response'
import type { CaptchaResult, LoginPayload, LoginResult, UserInfo, UserPermission } from '@/types/auth'

export async function fetchCaptcha(): Promise<CaptchaResult> {
    const response = await getCaptcha()
    return normalizeDetailData(response, { b64s: '', id: '', answer: '' })
}

export async function loginWithCredentials(data: LoginPayload): Promise<LoginResult> {
    const response = await login(data)
    return normalizeDetailData(response, createEmptyLoginResult())
}

export async function fetchCurrentUser(): Promise<UserInfo> {
    const response = await getUserInfo()
    return normalizeDetailData(response, createEmptyUserInfo())
}

export async function fetchUserMenuTree(): Promise<UserPermission[]> {
    const response = await getUserMenuList()
    return normalizeArrayData(response)
}

export async function saveProfile(data: Record<string, unknown>) {
    const response = await updateProfile(data)
    return normalizeDetailData(response, {} as Record<string, unknown>)
}
