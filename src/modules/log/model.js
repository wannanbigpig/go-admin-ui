export const LOG_METHOD_OPTIONS = [
    { value: 'POST', label: 'POST' },
    { value: 'GET', label: 'GET' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'OPTIONS', label: 'OPTIONS' },
    { value: 'HEAD', label: 'HEAD' },
    { value: 'PATCH', label: 'PATCH' },
]

export function createRequestLogQuery() {
    return {
        page: 1,
        per_page: 10,
        operation_name: null,
        method: null,
        base_url: null,
        operation_status: null,
        operator_account: null,
        start_time: null,
        end_time: null,
    }
}

export function createAdminLoginLogQuery() {
    return {
        page: 1,
        per_page: 10,
        username: null,
        ip: null,
        login_status: null,
        start_time: null,
        end_time: null,
    }
}
