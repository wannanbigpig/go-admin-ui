import * as departmentApi from '@/api/department'
import { normalizeArrayData, normalizeDetailData } from '@/modules/shared/response'
import type { Department } from '@/types/department'

export async function fetchDepartmentList(params?: Record<string, unknown>) {
    const response = await departmentApi.getDepartmentList(params)
    return normalizeArrayData<Department>(response)
}

export async function fetchDepartmentDetail(id: number | string) {
    const response = await departmentApi.getDepartmentDetail({ id })
    return normalizeDetailData(response, {} as Department)
}

export async function createDepartmentItem(data: Record<string, unknown>) {
    return await departmentApi.createDepartment(data)
}

export async function updateDepartmentItem(data: Record<string, unknown>) {
    return await departmentApi.updateDepartment(data)
}

export async function removeDepartment(id: number | string) {
    return await departmentApi.deleteDepartment({ id })
}

export async function bindDepartmentRoles(deptId: number | string, roleIds: number[]) {
    return await departmentApi.bindDepartmentRole({
        dept_id: deptId,
        role_ids: roleIds,
    })
}
