import { get, post } from '@/utils/request'

// 获取权限列表
export function getPermissionList(params) {
    return get('/v1/permission/list', params)
}

// 编辑权限
export function editPermission(data) {
    return post('/v1/permission/update', data)
}

// 获取菜单列表
export function getMenuList(params) {
    return get('/v1/menu/list', params)
}

// 新增菜单
export function createMenu(data) {
    return post('/v1/menu/create', data)
}

// 更新菜单
export function updateMenu(data) {
    return post('/v1/menu/update', data)
}

// 获取菜单详情
export function getMenuDetail(params) {
    return get('/v1/menu/detail', params)
}

// 删除菜单
export function deleteMenu(data) {
    return post('/v1/menu/delete', data)
}

// 获取角色列表
export function getRoleList(params) {
    return get('/v1/role/list', params)
}

// 新增角色
export function createRole(data) {
    return post('/v1/role/create', data)
}

// 更新角色
export function updateRole(data) {
    return post('/v1/role/update', data)
}

// 获取角色详情
export function getRoleDetail(params) {
    return get('/v1/role/detail', params)
}

// 删除角色
export function deleteRole(data) {
    return post('/v1/role/delete', data)
}
