import { DEFAULT_SUBMIT_DELAY } from '@/modules/shared/constants'

export const DEPARTMENT_EDIT_TYPE = {
    ADD: 1,
    EDIT: 2,
}

export const DEPARTMENT_SUBMIT_DELAY = DEFAULT_SUBMIT_DELAY
export const DEFAULT_DEPARTMENT_CODE = 'default_department'

export function createDepartmentForm() {
    return {
        id: 0,
        name: '',
        sort: 100,
        pid: 0,
        description: '',
    }
}

export function isProtectedDepartment(department) {
    return department?.code === DEFAULT_DEPARTMENT_CODE && Number(department?.is_system) === 1
}

export function createDepartmentQuery() {
    return {
        name: null,
    }
}

export function createDepartmentRules() {
    const trigger = ['blur', 'change']

    return {
        name: [{ required: true, message: '部门名称不能为空', trigger }],
        sort: [{ required: true, message: '排序不能为空', trigger, type: 'number' }],
    }
}

export function flattenDepartmentTree(tree, prefix = '') {
    const flatList = []
    tree.forEach((dept) => {
        const label = prefix ? `${prefix} / ${dept.name}` : dept.name
        flatList.push({
            ...dept,
            label,
        })
        if (dept.children && dept.children.length > 0) {
            flatList.push(...flattenDepartmentTree(dept.children, label))
        }
    })
    return flatList
}
