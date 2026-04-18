import { get, post } from '@/utils/request'
import type { ApiResponse } from '@/types/common'
import type { LoginResult } from '@/types/auth'

// 获取验证码
export function getCaptcha() {
    return get<ApiResponse<unknown>>('/v1/login-captcha')
}

export function login(data: Record<string, unknown>) {
    return post<ApiResponse<LoginResult>>('/v1/login', data)
}
