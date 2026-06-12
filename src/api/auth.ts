import { post, get, request } from '@/utils/request'
import type { TokenResult, UserInfo, UserPermission } from '@/types/auth'

// 退出登录
export function logout() {
    return post<unknown>('/v1/auth/logout')
}

// 刷新 access token，refresh token 由浏览器自动携带 HttpOnly Cookie
export function refreshAccessToken() {
    return request<TokenResult>('/v1/auth/refresh', 'POST', {
        _skipAuth: true,
        authErrorMode: 'refresh',
        withCredentials: true,
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

// 上传头像
export function uploadAvatar(data: FormData) {
    return request<{ path: string; url: string; origin_name: string }>('/v1/admin-user/avatar/upload', 'POST', {
        data,
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}
