import type { Role } from '@/types/role'
import { translate } from '@/locales'

export function createRoleForm(): Role {
    return {
        id: 0,
        name: '',
        code: '',
        pid: 0,
        sort: 100,
        description: '',
        menu_list: [],
        status: ROLE_STATUS.NORMAL,
        created_at: '',
        updated_at: '',
    }
}

export function createRoleQuery() {
    return {
        page: 1,
        per_page: 10,
        name: null,
        status: null,
        pid: 0,
    }
}

export function createRoleRules() {
    const trigger = ['blur', 'change']

    return {
        name: [{ required: true, message: translate('validation.role.nameRequired'), trigger }],
        sort: [{ required: true, message: translate('validation.role.sortRequired'), trigger, type: 'number' }],
        status: [{ required: true, message: translate('validation.role.statusRequired'), trigger }],
    }
}

export const ROLE_STATUS = {
    NORMAL: 1,
    ENABLED: 1, // 别名，保持兼容性
    DISABLED: 0,
}

export const ROLE_STATUS_OPTIONS = [
    { label: 'common.status.enabled', value: ROLE_STATUS.NORMAL, type: 'success' as const },
    { label: 'common.status.disabled', value: ROLE_STATUS.DISABLED, type: 'danger' as const },
]

export function getStatusLabel(status: number) {
    return translate(ROLE_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || 'common.unknown')
}

export function getStatusType(status: number) {
    return ROLE_STATUS_OPTIONS.find((opt) => opt.value === status)?.type || 'info'
}

export const ROLE_EDIT_TYPE = {
    ADD: 1,
    EDIT: 2,
}

export const ROLE_SUBMIT_DELAY = 3000
export const SUPER_ADMIN_ROLE_CODE = 'super_admin'

export const ROLE_TREE_PROPS = {
    children: 'children',
    hasChildren: 'hasChildren',
}

export function isSuperAdminRole(role: Partial<Role> | null) {
    return role?.code === SUPER_ADMIN_ROLE_CODE && Number(role?.is_system) === 1
}

export function processRoleTreeData(data: Role[]) {
    if (!Array.isArray(data)) return []
    return data.map((item) => ({
        ...item,
        hasChildren: (item.children_num || 0) > 0,
    }))
}
