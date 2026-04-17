import type { Role } from '@/types/role'

export function createRoleDefault(): Role {
    return {
        id: '',
        name: '',
        code: '',
        status: 1, // 默认启用
        remark: '',
        permission_ids: [],
    }
}

export const ROLE_STATUS = {
    ENABLED: 1,
    DISABLED: 2,
}

export const ROLE_STATUS_OPTIONS = [
    { label: '启用', value: ROLE_STATUS.ENABLED, type: 'success' },
    { label: '禁用', value: ROLE_STATUS.DISABLED, type: 'danger' },
]

export function getStatusLabel(status: number) {
    return ROLE_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || '未知'
}

export function getStatusType(status: number) {
    return ROLE_STATUS_OPTIONS.find((opt) => opt.value === status)?.type || 'info'
}
