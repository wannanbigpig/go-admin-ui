import { get } from '@/utils/request'
import type { ApiResponse, PageData } from '@/types/common'
import type { RequestLog, LoginLog } from '@/types/log'

// 获取请求日志列表
export function getRequestLogList(params?: any) {
    return get<ApiResponse<PageData<RequestLog>>>('/v1/log/request/list', params)
}

// 获取请求日志详情
export function getRequestLogDetail(id: number | string) {
    return get<ApiResponse<RequestLog>>(`/v1/log/request/detail`, { id })
}

// 获取登录日志列表
export function getLoginLogList(params?: any) {
    return get<ApiResponse<PageData<LoginLog>>>('/v1/log/login/list', params)
}

// 获取登录日志详情
export function getLoginLogDetail(id: number | string) {
    return get<ApiResponse<LoginLog>>(`/v1/log/login/detail`, { id })
}
