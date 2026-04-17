import { get, post, upload } from '@/utils/request'
import type { ApiResponse, PageData } from '@/types/common'
import type { AdminUser } from '@/types/adminUser'

export function getAdminUserList(params: any) {
    return get<ApiResponse<PageData<AdminUser>>>('/v1/admin-user/list', params)
}

export function getFullPhone(query: any) {
    return get<ApiResponse<{ phone: string }>>('/v1/admin-user/get-full-phone', query)
}

export function getFullEmail(query: any) {
    return get<ApiResponse<{ email: string }>>('/v1/admin-user/get-full-email', query)
}

export function getAdminUserDetail(params: { id: number | string }) {
    return get<ApiResponse<AdminUser>>('/v1/admin-user/detail', params)
}

export function uploadAvatar(files: File | File[], extra: Record<string, any> = {}) {
    return upload<ApiResponse<{ url: string }>>('/v1/common/upload', files, extra)
}

export function createAdminUser(data: any) {
    return post<ApiResponse<any>>('/v1/admin-user/create', data)
}

export function updateAdminUser(data: any) {
    return post<ApiResponse<any>>('/v1/admin-user/update', data)
}

export function deleteAdminUser(id: number | string) {
    return post<ApiResponse<any>>('/v1/admin-user/delete', { id })
}

export function bindAdminUserRole(data: { admin_user_id: number | string; role_ids: number[] }) {
    return post<ApiResponse<any>>('/v1/admin-user/bind-role', data)
}
