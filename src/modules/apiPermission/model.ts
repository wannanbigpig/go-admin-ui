export interface ApiPermission {
    id: number | string
    name: string
    path: string
    method: string
    group_name: string
    description?: string
    created_at?: string
    updated_at?: string
}

export function createApiPermissionForm(): Partial<ApiPermission> {
    return {
        id: '',
        name: '',
        path: '',
        method: 'GET',
        group_name: '',
        description: '',
    }
}

export const API_PERMISSION_METHODS = [
    { label: 'GET', value: 'GET' },
    { label: 'POST', value: 'POST' },
    { label: 'PUT', value: 'PUT' },
    { label: 'DELETE', value: 'DELETE' },
    { label: 'PATCH', value: 'PATCH' },
]
