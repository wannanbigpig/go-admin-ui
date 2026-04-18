import { post, get } from '@/utils/request'
import type { ApiResponse } from '@/types/common'
import type { UserInfo, UserPermission } from '@/types/auth'

// 退出登录
export function logout() {
    return post<ApiResponse<unknown>>('/v1/auth/logout')
}

// 获取用户信息
export function getUserInfo() {
    return get<ApiResponse<UserInfo>>('/v1/admin-user/get')
}

// 获取用户菜单列表
export function getUserMenuList() {
    return get<ApiResponse<UserPermission[]>>('/v1/admin-user/user-menu-info')
}

// 更新个人信息
export function updateProfile(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/admin-user/update-profile', data)
}
