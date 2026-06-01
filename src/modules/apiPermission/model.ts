export interface ApiPermission {
    id: number | string
    code: string
    name: string
    route: string
    method: string
    is_auth: number
    is_auth_name?: string
    is_effective: number
    sort: number
    func_path: string
    description: string
    created_at?: string
    updated_at?: string
    [key: string]: unknown
}

export function createApiPermissionForm(): Partial<ApiPermission> {
    return {
        id: 0,
        code: '',
        name: '',
        route: '',
        method: 'GET',
        is_auth: 2,
        is_effective: 1,
        sort: 0,
        func_path: '',
        description: '',
    }
}

export const API_PERMISSION_METHODS = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'OPTIONS', value: 'OPTIONS' },
    { label: 'HEAD', value: 'HEAD' },
    { label: 'PATCH', value: 'PATCH' },
]

// 别名，兼容旧代码
export const API_PERMISSION_METHOD_OPTIONS = API_PERMISSION_METHODS

export const API_PERMISSION_AUTH_MODE = {
    NONE: 0,
    LOGIN: 1,
    AUTHZ: 2,
} as const

export const API_PERMISSION_AUTH_MODE_OPTIONS = [
    { label: 'permission.api.authNone', value: API_PERMISSION_AUTH_MODE.NONE, type: 'info' as const },
    { label: 'permission.api.authLogin', value: API_PERMISSION_AUTH_MODE.LOGIN, type: 'warning' as const },
    { label: 'permission.api.authAuthz', value: API_PERMISSION_AUTH_MODE.AUTHZ, type: 'success' as const },
]

export const API_PERMISSION_SWITCH_VALUE = {
    YES: 1,
    NO: 0,
}
