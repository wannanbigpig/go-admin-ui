export const LOG_METHOD_OPTIONS = [
    { value: 'POST', label: 'POST' },
    { value: 'GET', label: 'GET' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'OPTIONS', label: 'OPTIONS' },
    { value: 'HEAD', label: 'HEAD' },
    { value: 'PATCH', label: 'PATCH' },
]

export const LOG_OPERATION_STATUS = {
    SUCCESS: 0,
    FAILED: 1,
}

export const LOG_OPERATION_STATUS_OPTIONS = [
    { label: '成功', value: LOG_OPERATION_STATUS.SUCCESS, type: 'success' as const },
    { label: '失败', value: LOG_OPERATION_STATUS.FAILED, type: 'danger' as const },
]

export function getOperationStatusLabel(status: number) {
    return LOG_OPERATION_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || '未知'
}

export function getOperationStatusType(status: number) {
    return LOG_OPERATION_STATUS_OPTIONS.find((opt) => opt.value === status)?.type || 'info'
}

export const LOGIN_STATUS = {
    FAILED: 0,
    SUCCESS: 1,
}

export const LOGIN_STATUS_OPTIONS = [
    { label: '失败', value: LOGIN_STATUS.FAILED, type: 'danger' as const },
    { label: '成功', value: LOGIN_STATUS.SUCCESS, type: 'success' as const },
]

export function getLoginStatusLabel(status: number) {
    return LOGIN_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || '未知'
}

export function getLoginStatusType(status: number) {
    return LOGIN_STATUS_OPTIONS.find((opt) => opt.value === status)?.type || 'info'
}

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
