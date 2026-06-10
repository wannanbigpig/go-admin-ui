import type { Role } from '@/types/role'
import { translate } from '@/locales'

export function createRoleForm(): Role {
    return {
        id: 0,
        name: '',
        code: '',
        sort: 100,
        description: '',
        menu_list: [],
        status: ROLE_STATUS.NORMAL,
        data_scope: DATA_SCOPE.DEPT,
        dept_ids: [],
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

export const DATA_SCOPE = {
    ALL: 1, // 全部数据
    DEPT_AND_CHILD: 2, // 本部门及子级
    DEPT: 3, // 本部门
    SELF: 4, // 仅本人
    CUSTOM: 5, // 自定义部门
}

export const DATA_SCOPE_OPTIONS = [
    { label: '全部数据', value: DATA_SCOPE.ALL },
    { label: '本部门及子级', value: DATA_SCOPE.DEPT_AND_CHILD },
    { label: '本部门', value: DATA_SCOPE.DEPT },
    { label: '仅本人', value: DATA_SCOPE.SELF },
    { label: '自定义部门', value: DATA_SCOPE.CUSTOM },
]

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

export const ROLE_SUBMIT_DELAY = 3000
export const SUPER_ADMIN_ROLE_CODE = 'super_admin'

export function isSuperAdminRole(role: Partial<Role> | null) {
    return role?.code === SUPER_ADMIN_ROLE_CODE && Number(role?.is_system) === 1
}
