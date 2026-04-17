import * as departmentApi from '@/api/department'
import { normalizeArrayData, normalizeDetailData } from '@/modules/shared/response'
import type { Department } from '@/types/department'

export async function fetchDepartmentList(params?: any) {
    const response = await departmentApi.getDepartmentList(params)
    return normalizeArrayData<Department>(response)
}

// 别名，兼容旧代码
export const fetchDepartmentTree = fetchDepartmentList

export async function fetchDepartmentDetail(id: number | string) {
    const response = await departmentApi.getDepartmentDetail({ id })
    return normalizeDetailData(response, {} as Department)
}

export async function addDepartment(data: any) {
    return await departmentApi.createDepartment(data)
}

// 别名导出
export const createDepartmentItem = addDepartment

export async function modifyDepartment(data: any) {
    return await departmentApi.updateDepartment(data)
}

// 别名导出
export const updateDepartmentItem = modifyDepartment

export async function removeDepartment(id: number | string) {
    return await departmentApi.deleteDepartment({ id })
}

export async function updateDepartmentRoles(deptId: number | string, roleIds: number[]) {
    return await departmentApi.bindDepartmentRole({
        dept_id: deptId,
        role_ids: roleIds,
    })
}

// 别名导出
export const bindDepartmentRoles = updateDepartmentRoles
