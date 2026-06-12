import { get, post } from '@/utils/request'
import { apiCache } from '@/utils/apiCache'
import { API_CACHE_PREFIX, buildApiCacheKey } from '@/utils/apiCacheKeys'
import { useSettingStore } from '@/stores/setting'
import { DEFAULT_LOCALE } from '@/locales'
import type { PageData } from '@/types/common'
import type { Role, RolePayload } from '@/types/role'
import type { Menu, MenuPayload } from '@/types/menu'

// 角色选项类型（仅包含下拉所需的最小字段）
export interface RoleOption {
    id: number
    name: string
    code: string
}

// 接口权限选项类型（仅包含下拉所需的最小字段）
export interface ApiOption {
    id: number
    name: string
    code: string
    method: string
    route: string
}

// 获取权限列表
export function getPermissionList(params?: Record<string, unknown>) {
    return get<PageData<unknown>>('/v1/permission/list', params)
}

// 编辑权限
export function editPermission(data: Record<string, unknown>) {
    return post<unknown>('/v1/permission/update', data)
}

// 获取菜单列表
export function getMenuList(params?: Record<string, unknown>) {
    const settingStore = useSettingStore()
    const locale = settingStore.locale || DEFAULT_LOCALE
    const key = `${API_CACHE_PREFIX.MENU_LIST}${locale}:${JSON.stringify(params || {})}`
    const cached = apiCache.get<Menu[]>(key)
    if (cached) return Promise.resolve(cached)

    const pending = apiCache.getPending<Menu[]>(key)
    if (pending) return pending

    const promise = get<Menu[]>('/v1/menu/list', params)
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

// 新增菜单
export function createMenu(data: MenuPayload) {
    return post<unknown>('/v1/menu/create', data).then((res) => {
        apiCache.deleteByPrefix(API_CACHE_PREFIX.MENU_LIST)
        return res
    })
}

// 更新菜单
export function updateMenu(data: MenuPayload) {
    return post<unknown>('/v1/menu/update', data).then((res) => {
        apiCache.deleteByPrefix(API_CACHE_PREFIX.MENU_LIST)
        return res
    })
}

// 获取菜单详情
export function getMenuDetail(params: { id: number | string }) {
    return get<Menu>('/v1/menu/detail', params)
}

// 删除菜单
export function deleteMenu(data: { id: number | string }) {
    return post<unknown>('/v1/menu/delete', data).then((res) => {
        apiCache.deleteByPrefix(API_CACHE_PREFIX.MENU_LIST)
        return res
    })
}

export function refreshAllMenuPermissions() {
    return post<unknown>('/v1/menu/update-all-menu-permissions').then((res) => {
        apiCache.deleteByPrefix(API_CACHE_PREFIX.MENU_LIST)
        return res
    })
}

// 获取角色列表
export function getRoleList(params?: Record<string, unknown>) {
    const key = buildApiCacheKey(API_CACHE_PREFIX.ROLE_LIST, params)
    const cached = apiCache.get<PageData<Role>>(key)
    if (cached) return Promise.resolve(cached)

    const pending = apiCache.getPending<PageData<Role>>(key)
    if (pending) return pending

    const promise = get<PageData<Role>>('/v1/role/list', params)
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

// 新增角色
export function createRole(data: RolePayload) {
    return post<unknown>('/v1/role/create', data).then((res) => {
        apiCache.deleteByPrefix(API_CACHE_PREFIX.ROLE_LIST)
        return res
    })
}

// 更新角色
export function updateRole(data: RolePayload) {
    return post<unknown>('/v1/role/update', data).then((res) => {
        apiCache.deleteByPrefix(API_CACHE_PREFIX.ROLE_LIST)
        return res
    })
}

// 获取角色详情
export function getRoleDetail(params: { id: number | string }) {
    return get<Role>('/v1/role/detail', params)
}

// 删除角色
export function deleteRole(data: { id: number | string }) {
    return post<unknown>('/v1/role/delete', data).then((res) => {
        apiCache.deleteByPrefix(API_CACHE_PREFIX.ROLE_LIST)
        return res
    })
}

// 后端响应包装类型（数组会被包装成 { result: [...] } 格式）
interface ResultResponse<T> {
    result: T[]
}

// 获取角色选项（供下拉选择器使用）
export function getRoleOptions(params?: { keyword?: string }) {
    const key = buildApiCacheKey(API_CACHE_PREFIX.ROLE_OPTIONS, params)
    const cached = apiCache.get<RoleOption[]>(key)
    if (cached) return Promise.resolve(cached)

    const pending = apiCache.getPending<RoleOption[]>(key)
    if (pending) return pending

    const promise = get<ResultResponse<RoleOption>>('/v1/role/options', params)
        .then((res) => {
            apiCache.set(key, res.result)
            apiCache.deletePending(key)
            return res.result
        })
        .catch((err) => {
            apiCache.deletePending(key)
            throw err
        })

    apiCache.setPending(key, promise)
    return promise
}

// 获取接口权限选项（供菜单编辑时下拉选择器使用）
export function getApiOptions(params?: { keyword?: string; is_auth?: number }) {
    const key = buildApiCacheKey(API_CACHE_PREFIX.API_OPTIONS, params)
    const cached = apiCache.get<ApiOption[]>(key)
    if (cached) return Promise.resolve(cached)

    const pending = apiCache.getPending<ApiOption[]>(key)
    if (pending) return pending

    const promise = get<ResultResponse<ApiOption>>('/v1/permission/options', params)
        .then((res) => {
            apiCache.set(key, res.result)
            apiCache.deletePending(key)
            return res.result
        })
        .catch((err) => {
            apiCache.deletePending(key)
            throw err
        })

    apiCache.setPending(key, promise)
    return promise
}
