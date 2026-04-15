import { DEFAULT_SUBMIT_DELAY } from '@/modules/shared/constants'

export const API_PERMISSION_SUBMIT_DEBOUNCE_TIME = DEFAULT_SUBMIT_DELAY

export const API_PERMISSION_SWITCH_VALUE = {
    NO: 0,
    YES: 1,
}

export const API_PERMISSION_METHOD_OPTIONS = [
    { value: 'POST', label: 'POST' },
    { value: 'GET', label: 'GET' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'OPTIONS', label: 'OPTIONS' },
    { value: 'HEAD', label: 'HEAD' },
    { value: 'PATCH', label: 'PATCH' },
]

export function createApiPermissionQuery() {
    return {
        page: 1,
        per_page: 10,
        method: null,
        keyword: null,
        is_auth: null,
        is_effective: null,
    }
}

export function createApiPermissionEditForm() {
    return {
        id: 0,
        code: '',
        name: '',
        route: '',
        method: '',
        is_auth: API_PERMISSION_SWITCH_VALUE.YES,
        is_effective: API_PERMISSION_SWITCH_VALUE.YES,
        sort: 0,
        desc: '',
        func_path: '',
    }
}
