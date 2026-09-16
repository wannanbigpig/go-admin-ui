import type { Role } from '@/types/role'

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

export const ROLE_STATUS = {
    NORMAL: 1,
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
    { label: 'permission.role.dataScopeOptions.all', value: DATA_SCOPE.ALL },
    { label: 'permission.role.dataScopeOptions.deptAndChild', value: DATA_SCOPE.DEPT_AND_CHILD },
    { label: 'permission.role.dataScopeOptions.dept', value: DATA_SCOPE.DEPT },
    { label: 'permission.role.dataScopeOptions.self', value: DATA_SCOPE.SELF },
    { label: 'permission.role.dataScopeOptions.custom', value: DATA_SCOPE.CUSTOM },
]

export const SUPER_ADMIN_ROLE_CODE = 'super_admin'

export function isSuperAdminRole(role: Partial<Role> | null) {
    return role?.code === SUPER_ADMIN_ROLE_CODE && Number(role?.is_system) === 1
}
