import { DEFAULT_SUBMIT_DELAY } from '@/modules/shared/constants'

export const ROLE_STATUS = {
    NORMAL: 1,
    DISABLED: 0,
}

export const ROLE_EDIT_TYPE = {
    ADD: 1,
    EDIT: 2,
}

export const ROLE_SUBMIT_DELAY = DEFAULT_SUBMIT_DELAY
export const SUPER_ADMIN_ROLE_CODE = 'super_admin'

export const ROLE_TREE_PROPS = {
    children: 'children',
    hasChildren: 'hasChildren',
}

export function isSuperAdminRole(role) {
    return role?.code === SUPER_ADMIN_ROLE_CODE && Number(role?.is_system) === 1
}

export function createRoleForm() {
    return {
        id: 0,
        name: '',
        sort: 100,
        pid: 0,
        description: '',
        menu_list: [],
        status: ROLE_STATUS.NORMAL,
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

export function processRoleTreeData(data) {
    if (!Array.isArray(data)) return []
    return data.map((item) => ({
        ...item,
        hasChildren: (item.children_num || 0) > 0,
    }))
}
