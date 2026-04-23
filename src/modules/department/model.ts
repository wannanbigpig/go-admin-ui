import { DEFAULT_SUBMIT_DELAY } from '@/modules/shared/constants'
import type { Department, DepartmentQuery } from '@/types/department'
import { translate } from '@/locales'

export const DEPARTMENT_EDIT_TYPE = {
    ADD: 1,
    EDIT: 2,
}

export const DEPARTMENT_SUBMIT_DELAY = DEFAULT_SUBMIT_DELAY
export const DEFAULT_DEPARTMENT_CODE = 'default_department'

export function createDepartmentForm(): Partial<Department> {
    return {
        id: 0,
        name: '',
        sort: 100,
        pid: 0,
        description: '',
    }
}

export function isProtectedDepartment(department: Department): boolean {
    return department?.code === DEFAULT_DEPARTMENT_CODE && Number(department?.is_system) === 1
}

export function createDepartmentQuery(): DepartmentQuery {
    return {
        name: undefined,
    }
}

export function createDepartmentRules() {
    const trigger = ['blur', 'change']

    return {
        name: [{ required: true, message: translate('validation.department.nameRequired'), trigger }],
        sort: [{ required: true, message: translate('validation.department.sortRequired'), trigger, type: 'number' }],
    }
}

export function flattenDepartmentTree(tree: Department[], prefix = ''): (Department & { label: string })[] {
    const flatList: (Department & { label: string })[] = []
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
