import { get, post } from '@/utils/request'

// 获取部门列表
export function getDepartmentList(params) {
    return get('/v1/department/list', params)
}

// 获取部门详情
export function getDepartmentDetail(params) {
    return get('/v1/department/detail', params)
}

// 新增部门
export function createDepartment(data) {
    return post('/v1/department/create', data)
}

// 更新部门
export function updateDepartment(data) {
    return post('/v1/department/update', data)
}

// 删除部门
export function deleteDepartment(data) {
    return post('/v1/department/delete', data)
}

// 绑定角色
export function bindDepartmentRole(data) {
    return post('/v1/department/bind-role', data)
}
