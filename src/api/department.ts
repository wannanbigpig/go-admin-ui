import { get, post } from '@/utils/request'
import type { ApiResponse } from '@/types/common'
import type { Department } from '@/types/department'

// 获取部门列表
export function getDepartmentList(params?: Record<string, unknown>) {
    return get<ApiResponse<Department[]>>('/v1/department/list', params)
}

// 获取部门详情
export function getDepartmentDetail(params: { id: number | string }) {
    return get<ApiResponse<Department>>('/v1/department/detail', params)
}

// 新增部门
export function createDepartment(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/department/create', data)
}

// 更新部门
export function updateDepartment(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/department/update', data)
}

// 删除部门
export function deleteDepartment(data: { id: number | string }) {
    return post<ApiResponse<unknown>>('/v1/department/delete', data)
}

// 绑定角色
export function bindDepartmentRole(data: { dept_id: number | string; role_ids: number[] }) {
    return post<ApiResponse<unknown>>('/v1/department/bind-role', data)
}
