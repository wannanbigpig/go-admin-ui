import type { WithId } from './common'

export type RequestKind = 'http' | 'websocket'
export type ExecutionTimeScope = 'request' | 'connection' | 'none'
export type RequestLogSelfScope = 'regular' | 'all' | 'important' | 'changes' | 'failed' | 'high_risk' | 'self_reads'
export type RequestLogChangeType = 'created' | 'updated' | 'removed' | 'changed' | 'action'

export interface RequestLogChangeSummaryItem {
    label: string
    change_type: RequestLogChangeType
    before_text?: string
    after_text?: string
}

export interface RequestLogChangeSummary {
    has_changes: boolean
    items: RequestLogChangeSummaryItem[]
    omitted_count: number
}

export interface RequestLogBase extends WithId {
    request_id: string
    request_kind?: RequestKind
    operator_id?: number | string
    operation_name: string
    method: string
    base_url: string
    operation_status: number
    operation_status_name?: string
    is_high_risk?: number
    operator_account: string
    operator_name: string
    ip: string
    ip_location?: string
    execution_time_us: number
    execution_time_scope?: ExecutionTimeScope
    response_status: number
    created_at: string
    change_summary?: RequestLogChangeSummary | null
}

export interface RequestLog extends RequestLogBase {
    jwt_id?: string
    browser?: string
    os?: string
    user_agent?: string
    request_query?: string
    request_headers?: string
    request_body?: string
    change_diff?: string
    response_header?: string
    response_body?: string
    updated_at?: string
}

export interface RequestLogSelfDetail extends RequestLogBase {
    browser?: string
    os?: string
    user_agent?: string
    change_summary?: RequestLogChangeSummary | null
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
    token_hash?: string
    token_expires?: string
    refresh_token_hash?: string
    refresh_expires?: string
    is_revoked: number
    is_revoked_name?: string
    revoked_reason?: string
    revoked_at?: string
    created_at: string
}

export interface OnlineSession extends WithId {
    uid: number | string
    username: string
    jwt_id?: string
    ip: string
    os?: string
    browser?: string
    is_revoked: number
    revoked_reason?: string
    revoked_at?: string
    token_expires?: string
    created_at: string
}

export interface LogQuery {
    page: number
    per_page: number
    [key: string]: unknown
}

export interface RequestLogQuery extends LogQuery {
    order_by?: string | null
    request_id?: string | null
    operator_id?: number | string | null
    operation_name?: string | null
    method?: string | null
    base_url?: string | null
    operation_status?: number | null
    is_high_risk?: number | null
    has_change_diff?: number | null
    operator_account?: string | null
    ip?: string | null
    request_kind?: RequestKind | null
    execution_time_scope?: ExecutionTimeScope | null
    start_time?: string | null
    end_time?: string | null
    scope?: RequestLogSelfScope | null
}

export interface OnlineSessionQuery extends LogQuery {
    uid?: number | string | null
    username?: string | null
    ip?: string | null
    is_revoked?: number | null
    start_time?: string | null
    end_time?: string | null
}
