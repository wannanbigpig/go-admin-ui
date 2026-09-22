import { get, post, request } from '@/utils/request'
import type { CaptchaResult, LoginOptions, LoginPayload, LoginResult, SmsCodeSendPayload, SmsCodeSendResult, SmsLoginPayload } from '@/types/auth'

// 获取验证码
export function getCaptcha() {
    return get<CaptchaResult>('/v1/login-captcha')
}

export function login(data: LoginPayload) {
    return request<LoginResult>('/v1/login', 'POST', { data, authErrorMode: 'credential' })
}

export function getLoginOptions() {
    return request<LoginOptions>('/v1/login/options', 'GET', { silent: true })
}

export function sendSmsLoginCode(data: SmsCodeSendPayload) {
    return post<SmsCodeSendResult>('/v1/login/sms/send-code', data)
}

export function loginBySms(data: SmsLoginPayload) {
    return request<LoginResult>('/v1/login/sms', 'POST', { data, authErrorMode: 'credential' })
}
