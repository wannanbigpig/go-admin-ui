import type { WithId } from './common'

export interface RequestLog extends WithId {
    request_id: string
    operator_id?: number | string
    operation_name: string
    method: string
    base_url: string
    operation_status: number
    operation_status_name?: string
    is_high_risk?: number
    operator_account: string
    operator_name: string
    operator_ip: string
    ip: string
    ip_location: string
    execution_time: number
    response_status: number
    browser?: string
    os?: string
    user_agent?: string
    request_query?: string
    request_headers?: string
    request_body?: string
    change_diff?: string
    response_header?: string
    response_body?: string
    created_at: string
    updated_at?: string
}

export interface LoginLog extends WithId {
    username: string
    nickname?: string
    type: number
    type_name?: string
    ip: string
    ip_location: string
    login_status: number
    login_status_name?: string
    login_fail_reason?: string
    os?: string
    browser?: string
    device_name?: string
    user_agent?: string
    execution_time: number
    jwt_id?: string
    access_token?: string
    token_hash?: string
    token_expires?: string
    refresh_token?: string
    refresh_token_hash?: string
    refresh_expires?: string
    is_revoked: number
    is_revoked_name?: string
    revoked_reason?: string
    revoked_at?: string
    created_at: string
}

export interface LogQuery {
    page: number
    per_page: number
    [key: string]: unknown
}
