import { get, post, upload } from '@/utils/request'
import type { PageData } from '@/types/common'
import type { AdminUser, AdminUserQuery } from '@/types/adminUser'

export function getAdminUserList(params: Partial<AdminUserQuery>) {
    return get<PageData<AdminUser>>('/v1/admin-user/list', { ...params })
}

export function getFullPhone(query: Record<string, unknown>) {
    return get<{ phone: string }>('/v1/admin-user/get-full-phone', query)
}

export function getFullEmail(query: Record<string, unknown>) {
    return get<{ email: string }>('/v1/admin-user/get-full-email', query)
}

export function getAdminUserDetail(params: { id: number | string }) {
    return get<AdminUser>('/v1/admin-user/detail', params)
}

export function uploadAvatar(files: File | File[], extra: Record<string, unknown> = {}) {
    return upload<{ url: string }>('/v1/common/upload', files, extra)
}

export function createAdminUser(data: Record<string, unknown>) {
    return post<unknown>('/v1/admin-user/create', data)
}

export function updateAdminUser(data: Record<string, unknown>) {
    return post<unknown>('/v1/admin-user/update', data)
}

export function deleteAdminUser(id: number | string) {
    return post<unknown>('/v1/admin-user/delete', { id })
}

export function bindAdminUserRole(data: { user_id: number | string; role_ids: number[] }) {
    return post<unknown>('/v1/admin-user/bind-role', data)
}
