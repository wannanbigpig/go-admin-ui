import { post, get, request } from '@/utils/request'
import type { LoginResult, UserInfo, UserPermission } from '@/types/auth'

// 退出登录
export function logout(refreshToken?: string) {
    return post<unknown>('/v1/auth/logout', { refresh_token: refreshToken })
}

// 刷新 Token（不携带 Authorization 头）
export function refreshTokenApi(refreshToken: string) {
    return request<LoginResult>('/v1/auth/refresh-token', 'POST', {
        data: { refresh_token: refreshToken },
        _skipAuth: true,
        _isRefreshRequest: true,
    })
}

// 获取用户信息
export function getUserInfo() {
    return get<UserInfo>('/v1/admin-user/get')
}

// 获取用户菜单列表
export function getUserMenuList() {
    return get<UserPermission[]>('/v1/admin-user/user-menu-info')
}

// 更新个人信息
export function updateProfile(data: Record<string, unknown>) {
    return post<unknown>('/v1/admin-user/update-profile', data)
}
