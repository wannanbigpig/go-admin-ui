import { get, request } from '@/utils/request'
import type { CaptchaResult, LoginResult } from '@/types/auth'

// 获取验证码
export function getCaptcha() {
    return get<CaptchaResult>('/v1/login-captcha')
}

export function login(data: Record<string, unknown>) {
    return request<LoginResult>('/v1/login', 'POST', { data, authErrorMode: 'credential' })
}
