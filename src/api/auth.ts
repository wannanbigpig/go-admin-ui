import { post, get, request } from '@/utils/request'
import type { UserInfo, UserPermission } from '@/types/auth'

// 退出登录
export function logout(refreshToken?: string) {
    return post<unknown>('/v1/auth/logout', { refresh_token: refreshToken })
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
