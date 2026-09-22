import { getCaptcha, getLoginOptions, login, loginBySms, sendSmsLoginCode } from '@/api/login'
import { getUserInfo, getUserMenuList } from '@/api/auth'
import { createEmptyLoginResult, createEmptyUserInfo } from '@/modules/auth/model'
import { normalizeArrayData, normalizeDetailData } from '@/modules/shared/response'
import type { CaptchaResult, LoginOptions, LoginPayload, LoginResult, SmsCodeSendPayload, SmsCodeSendResult, SmsLoginPayload, UserInfo, UserPermission } from '@/types/auth'

export async function fetchCaptcha(): Promise<CaptchaResult> {
    const response = await getCaptcha()
    return normalizeDetailData(response, { b64s: '', id: '', answer: '' })
}

export async function loginWithCredentials(data: LoginPayload): Promise<LoginResult> {
    const response = await login(data)
    return normalizeDetailData(response, createEmptyLoginResult())
}

export async function fetchLoginOptions(): Promise<LoginOptions> {
    const response = await getLoginOptions()
    return normalizeDetailData(response, { sms_login_enabled: false })
}

export async function sendLoginSmsCode(data: SmsCodeSendPayload): Promise<SmsCodeSendResult> {
    const response = await sendSmsLoginCode(data)
    return normalizeDetailData(response, { challenge_id: '', retry_after: 0, expires_in: 0 })
}

export async function loginWithSmsCode(data: SmsLoginPayload): Promise<LoginResult> {
    const response = await loginBySms(data)
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
