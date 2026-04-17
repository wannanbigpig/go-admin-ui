import { get, post } from '@/utils/request'
import type { ApiResponse } from '@/types/common'
import type { LoginResult } from '@/types/auth'

// 获取验证码
export function getCaptcha() {
    return get<ApiResponse<any>>('/v1/login-captcha')
}

export function login(data: any) {
    return post<ApiResponse<LoginResult>>('/v1/login', data)
}
