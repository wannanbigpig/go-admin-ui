import {
    getDepartmentList,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getDepartmentDetail,
    bindDepartmentRole,
} from '@/api/department'
import { normalizeArrayData, normalizeDetailData } from '@/modules/shared/response'

export async function fetchDepartmentTree(params) {
    const response = await getDepartmentList(params)
    return normalizeArrayData(response)
}

export async function fetchDepartmentDetail(id) {
    const response = await getDepartmentDetail({ id })
    return normalizeDetailData(response, {})
}

export async function createDepartmentItem(data) {
    const response = await createDepartment(data)
    return normalizeDetailData(response, {})
}

export async function updateDepartmentItem(data) {
    const response = await updateDepartment(data)
    return normalizeDetailData(response, {})
}

export async function deleteDepartmentItem(id) {
    const response = await deleteDepartment({ id })
    return normalizeDetailData(response, {})
}

export async function bindDepartmentRoles(data) {
    const response = await bindDepartmentRole(data)
    return normalizeDetailData(response, {})
}
