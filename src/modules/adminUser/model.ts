import type { AdminUser } from '@/types/adminUser'

/**
 * 创建默认的管理员用户对象
 */
export function createAdminUserForm(): AdminUser {
    return {
        id: 0,
        username: '',
        nickname: '',
        avatar: '',
        phone_number: '',
        email: '',
        status: ADMIN_USER_STATUS.NORMAL,
        is_super_admin: 0,
        dept_ids: [],
        password: '',
        confirm_password: '',
        created_at: '',
        updated_at: '',
    }
}

export const ADMIN_USER_STATUS = {
    NORMAL: 1,
    DISABLED: 0,
}

export const ROOT_ADMIN_USER_ID = 1

export const ADMIN_USER_AVATAR_CONFIG = {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_SIZE: 2 * 1024 * 1024,
    UPLOAD_PATH: 'avatar',
}

export function isRootAdminUser(user: Partial<AdminUser> | null) {
    return Number(user?.id) === ROOT_ADMIN_USER_ID
}
