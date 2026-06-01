import { translate } from '@/locales'

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
    { label: 'common.status.success', value: LOG_OPERATION_STATUS.SUCCESS, type: 'success' as const },
    { label: 'common.status.failed', value: LOG_OPERATION_STATUS.FAILED, type: 'danger' as const },
]

export const REQUEST_KIND_ALL_VALUE = ''

export const REQUEST_KIND_OPTIONS = [
    { label: 'log.request.requestKindHttp', value: 'http' as const, type: 'primary' as const },
    { label: 'log.request.requestKindWebsocket', value: 'websocket' as const, type: 'warning' as const },
    { label: 'log.request.requestKindSse', value: 'sse' as const, type: 'success' as const },
]

export const REQUEST_KIND_FILTER_OPTIONS = [{ label: 'log.request.requestKindAll', value: REQUEST_KIND_ALL_VALUE }, ...REQUEST_KIND_OPTIONS]

export const EXECUTION_TIME_SCOPE_ALL_VALUE = ''

export const EXECUTION_TIME_SCOPE_OPTIONS = [
    { label: 'log.request.executionTimeScopeRequest', value: 'request' as const, type: 'primary' as const },
    { label: 'log.request.executionTimeScopeConnection', value: 'connection' as const, type: 'warning' as const },
    { label: 'log.request.executionTimeScopeStream', value: 'stream' as const, type: 'success' as const },
    { label: 'log.request.executionTimeScopeNone', value: 'none' as const, type: 'info' as const },
]

export const EXECUTION_TIME_SCOPE_FILTER_OPTIONS = [{ label: 'log.request.executionTimeScopeAll', value: EXECUTION_TIME_SCOPE_ALL_VALUE }, ...EXECUTION_TIME_SCOPE_OPTIONS]

export function getOperationStatusLabel(status: number) {
    return translate(LOG_OPERATION_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || 'common.unknown')
}

export function getOperationStatusType(status: number) {
    return LOG_OPERATION_STATUS_OPTIONS.find((opt) => opt.value === status)?.type || 'info'
}

export const LOGIN_STATUS = {
    FAILED: 0,
    SUCCESS: 1,
}

export const LOGIN_STATUS_OPTIONS = [
    { label: 'common.status.failed', value: LOGIN_STATUS.FAILED, type: 'danger' as const },
    { label: 'common.status.success', value: LOGIN_STATUS.SUCCESS, type: 'success' as const },
]

export function getLoginStatusLabel(status: number) {
    return translate(LOGIN_STATUS_OPTIONS.find((opt) => opt.value === status)?.label || 'common.unknown')
}

export function getLoginStatusType(status: number) {
    return LOGIN_STATUS_OPTIONS.find((opt) => opt.value === status)?.type || 'info'
}

export const DEFAULT_REQUEST_LOG_ORDER_BY = null as string | null

export function createRequestLogQuery() {
    return {
        page: 1,
        per_page: 10,
        order_by: DEFAULT_REQUEST_LOG_ORDER_BY,
        request_id: null,
        operator_id: null,
        operation_name: null,
        method: null,
        base_url: null,
        operation_status: null,
        is_high_risk: null,
        operator_account: null,
        ip: null,
        request_kind: null,
        execution_time_scope: null,
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

export function createOnlineSessionQuery() {
    return {
        page: 1,
        per_page: 10,
        uid: null,
        username: null,
        ip: null,
        is_revoked: null,
        start_time: null,
        end_time: null,
    }
}
