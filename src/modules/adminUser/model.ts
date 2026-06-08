import type { AdminUser } from '@/types/adminUser'
import { translate } from '@/locales'

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
        dept_ids: [],
        password: '',
        confirm_password: '',
        created_at: '',
        updated_at: '',
    }
}

/**
 * 创建管理员用户查询对象
 */
export function createAdminUserQuery() {
    return {
        page: 1,
        per_page: 10,
        username: null,
        phone_number: null,
        status: null,
        email: null,
        dept_id: null,
    }
}

export const ADMIN_USER_STATUS = {
    NORMAL: 1,
    ENABLED: 1, // 别名，保持兼容性
    DISABLED: 0,
}

export const ADMIN_USER_STATUS_OPTIONS = [
    { label: 'common.status.enabled', value: ADMIN_USER_STATUS.NORMAL, type: 'success' as const },
    { label: 'common.status.disabled', value: ADMIN_USER_STATUS.DISABLED, type: 'danger' as const },
]

export function getStatusLabel(status: number) {
    return translate(ADMIN_USER_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || 'common.unknown')
}

export function getStatusType(status: number) {
    return ADMIN_USER_STATUS_OPTIONS.find((opt) => opt.value === status)?.type || 'info'
}

export const ADMIN_USER_EDIT_TYPE = {
    ADD: 1,
    EDIT: 2,
}

export const ADMIN_USER_SUBMIT_DELAY = 3000
export const ROOT_ADMIN_USER_ID = 1

export const ADMIN_USER_AVATAR_CONFIG = {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_SIZE: 2 * 1024 * 1024,
    UPLOAD_PATH: 'avatar',
}

export function isRootAdminUser(user: Partial<AdminUser> | null) {
    return Number(user?.id) === ROOT_ADMIN_USER_ID
}
