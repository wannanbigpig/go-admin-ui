import { get, post } from '@/utils/request'
import { apiCache } from '@/utils/apiCache'
import type { Department } from '@/types/department'

// 获取部门列表
export function getDepartmentList(params?: Record<string, unknown>) {
    const key = `dept:list:${JSON.stringify(params || {})}`
    const cached = apiCache.get<Department[]>(key)
    if (cached) return Promise.resolve(cached)

    const pending = apiCache.getPending<Department[]>(key)
    if (pending) return pending

    const promise = get<Department[]>('/v1/department/list', params)
        .then((res) => {
            apiCache.set(key, res)
            apiCache.deletePending(key)
            return res
        })
        .catch((err) => {
            apiCache.deletePending(key)
            throw err
        })

    apiCache.setPending(key, promise)
    return promise
}

// 获取部门详情
export function getDepartmentDetail(params: { id: number | string }) {
    return get<Department>('/v1/department/detail', params)
}

// 新增部门
export function createDepartment(data: Record<string, unknown>) {
    return post<unknown>('/v1/department/create', data).then((res) => {
        apiCache.deleteByPrefix('dept:list:')
        return res
    })
}

// 更新部门
export function updateDepartment(data: Record<string, unknown>) {
    return post<unknown>('/v1/department/update', data).then((res) => {
        apiCache.deleteByPrefix('dept:list:')
        return res
    })
}

// 删除部门
export function deleteDepartment(data: { id: number | string }) {
    return post<unknown>('/v1/department/delete', data).then((res) => {
        apiCache.deleteByPrefix('dept:list:')
        return res
    })
}

// 绑定角色
export function bindDepartmentRole(data: { dept_id: number | string; role_ids: number[] }) {
    return post<unknown>('/v1/department/bind-role', data).then((res) => {
        apiCache.deleteByPrefix('dept:list:')
        return res
    })
}
