import { get } from '@/utils/request'
import type { PageData } from '@/types/common'
import type { RequestLog, LoginLog } from '@/types/log'

// 获取请求日志列表
export function getRequestLogList(params?: Record<string, unknown>) {
    return get<PageData<RequestLog>>('/v1/log/request/list', params)
}

// 获取请求日志详情
export function getRequestLogDetail(id: number | string) {
    return get<RequestLog>(`/v1/log/request/detail`, { id })
}

// 获取登录日志列表
export function getLoginLogList(params?: Record<string, unknown>) {
    return get<PageData<LoginLog>>('/v1/log/login/list', params)
}

// 获取登录日志详情
export function getLoginLogDetail(id: number | string) {
    return get<LoginLog>(`/v1/log/login/detail`, { id })
}
