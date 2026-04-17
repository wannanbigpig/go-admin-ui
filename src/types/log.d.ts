import type { WithId } from './common'

export interface RequestLog extends WithId {
    operation_name: string
    method: string
    base_url: string
    operation_status: number
    operator_account: string
    operator_ip: string
    duration: number
    request_params: string
    response_data: string
    created_at: string
}

export interface LoginLog extends WithId {
    username: string
    ip: string
    login_status: number
    login_time: string
    user_agent: string
    remark?: string
}

export interface LogQuery {
    page: number
    per_page: number
    [key: string]: any
}
