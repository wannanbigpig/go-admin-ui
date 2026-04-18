import { get, post } from '@/utils/request'
import type { ApiResponse, PageData } from '@/types/common'
import type { Role } from '@/types/role'
import type { Menu } from '@/types/menu'

// 获取权限列表
export function getPermissionList(params?: Record<string, unknown>) {
    return get<ApiResponse<PageData<unknown>>>('/v1/permission/list', params)
}

// 编辑权限
export function editPermission(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/permission/update', data)
}

// 获取菜单列表
export function getMenuList(params?: Record<string, unknown>) {
    return get<ApiResponse<Menu[]>>('/v1/menu/list', params)
}

// 新增菜单
export function createMenu(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/menu/create', data)
}

// 更新菜单
export function updateMenu(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/menu/update', data)
}

// 获取菜单详情
export function getMenuDetail(params: { id: number | string }) {
    return get<ApiResponse<Menu>>('/v1/menu/detail', params)
}

// 删除菜单
export function deleteMenu(data: { id: number | string }) {
    return post<ApiResponse<unknown>>('/v1/menu/delete', data)
}

// 获取角色列表
export function getRoleList(params?: Record<string, unknown>) {
    return get<ApiResponse<PageData<Role>>>('/v1/role/list', params)
}

// 新增角色
export function createRole(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/role/create', data)
}

// 更新角色
export function updateRole(data: Record<string, unknown>) {
    return post<ApiResponse<unknown>>('/v1/role/update', data)
}

// 获取角色详情
export function getRoleDetail(params: { id: number | string }) {
    return get<ApiResponse<Role>>('/v1/role/detail', params)
}

// 删除角色
export function deleteRole(data: { id: number | string }) {
    return post<ApiResponse<unknown>>('/v1/role/delete', data)
}
