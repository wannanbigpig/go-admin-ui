import { get, post } from '@/utils/request'
import type { PageData } from '@/types/common'
import type { AdminUser, AdminUserPayload, AdminUserQuery } from '@/types/adminUser'

export function getAdminUserList(params: Partial<AdminUserQuery>) {
    return get<PageData<AdminUser>>('/v1/admin-user/list', { ...params })
}

export interface AdminUserOption {
    id: number
    username: string
    nickname: string
}

// 管理员选择器：按账号/昵称模糊搜索，供下拉远程搜索（如请求日志按操作人筛选）
export function getAdminUserOptions(keyword?: string) {
    return get<AdminUserOption[]>('/v1/admin-user/options', { keyword })
}

export function getFullPhone(query: Record<string, unknown>) {
    return get<{ phone_number: string }>('/v1/admin-user/get-full-phone', query)
}

export function getFullEmail(query: Record<string, unknown>) {
    return get<{ email: string }>('/v1/admin-user/get-full-email', query)
}

export function getAdminUserDetail(params: { id: number | string }) {
    return get<AdminUser>('/v1/admin-user/detail', params)
}

export function createAdminUser(data: AdminUserPayload) {
    return post<unknown>('/v1/admin-user/create', data)
}

export function updateAdminUser(data: AdminUserPayload) {
    return post<unknown>('/v1/admin-user/update', data)
}

export function deleteAdminUser(id: number | string) {
    return post<unknown>('/v1/admin-user/delete', { id })
}

export function bindAdminUserRole(data: { user_id: number | string; role_ids: number[] }) {
    return post<unknown>('/v1/admin-user/bind-role', data)
}
