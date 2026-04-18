import type { Role } from '@/types/role'

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
        name: [{ required: true, message: '角色名称不能为空', trigger }],
        sort: [{ required: true, message: '排序不能为空', trigger, type: 'number' }],
        status: [{ required: true, message: '状态不能为空', trigger }],
    }
}

export const ROLE_STATUS = {
    NORMAL: 1,
    ENABLED: 1, // 别名，保持兼容性
    DISABLED: 0,
}

export const ROLE_STATUS_OPTIONS = [
    { label: '正常', value: ROLE_STATUS.NORMAL, type: 'success' as const },
    { label: '禁用', value: ROLE_STATUS.DISABLED, type: 'danger' as const },
]

export function getStatusLabel(status: number) {
    return ROLE_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || '未知'
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
