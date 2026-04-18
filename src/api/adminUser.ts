import { get, post, upload } from '@/utils/request'
import type { ApiResponse, PageData } from '@/types/common'
import type { AdminUser, AdminUserQuery } from '@/types/adminUser'

export function getAdminUserList(params: AdminUserQuery) {
    return get<ApiResponse<PageData<AdminUser>>>('/v1/admin-user/list', params as unknown as Record<string, unknown>)
}

export function getFullPhone(query: Record<string, unknown>) {
    return get<ApiResponse<{ phone: string }>>('/v1/admin-user/get-full-phone', query)
}

export function getFullEmail(query: Record<string, unknown>) {
    return get<ApiResponse<{ email: string }>>('/v1/admin-user/get-full-email', query)
}

export function getAdminUserDetail(params: { id: number | string }) {
    return get<ApiResponse<AdminUser>>('/v1/admin-user/detail', params)
}

export function uploadAvatar(files: File | File[], extra: Record<string, unknown> = {}) {
    return upload<ApiResponse<{ url: string }>>('/v1/common/upload', files, extra)
}

export function createAdminUser(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/admin-user/create', data)
}

export function updateAdminUser(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/admin-user/update', data)
}

export function deleteAdminUser(id: number | string) {
    return post<ApiResponse<unknown>>('/v1/admin-user/delete', { id })
}

export function bindAdminUserRole(data: { user_id: number | string; role_ids: number[] }) {
    return post<ApiResponse<unknown>>('/v1/admin-user/bind-role', data)
}
