import { createAdminUserQuery, type AdminUser } from '@/types/adminUser'

export function createAdminUserDefault(): AdminUser {
    return {
        id: '',
        username: '',
        nickname: '',
        avatar: '',
        mobile: '',
        email: '',
        status: 1, // 默认启用
        remark: '',
        role_ids: [],
        dept_id: undefined,
    }
}

export { createAdminUserQuery }

export const ADMIN_USER_STATUS = {
    ENABLED: 1,
    DISABLED: 2,
}

export const ADMIN_USER_STATUS_OPTIONS = [
    { label: '启用', value: ADMIN_USER_STATUS.ENABLED, type: 'success' },
    { label: '禁用', value: ADMIN_USER_STATUS.DISABLED, type: 'danger' },
]

export function getStatusLabel(status: number) {
    return ADMIN_USER_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || '未知'
}

export function getStatusType(status: number) {
    return ADMIN_USER_STATUS_OPTIONS.find((opt) => opt.value === status)?.type || 'info'
}
