import { get, post } from '@/utils/request'
import type { PageData } from '@/types/common'
import type { ExportTaskSubmitResult } from '@/types/exportCenter'
import type { RequestLog, LoginLog, OnlineSession } from '@/types/log'
import type { RequestLogMaskConfig } from '@/types/system'

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

// 获取请求日志脱敏配置
export function getRequestLogMaskConfig() {
    return get<RequestLogMaskConfig>('/v1/log/request/mask-config')
}

// 提交请求日志导出任务
export function submitRequestLogExport(data?: Record<string, unknown>) {
    return post<ExportTaskSubmitResult>('/v1/log/request/export', data || {})
}

// 更新请求日志脱敏配置
export function updateRequestLogMaskConfig(data: RequestLogMaskConfig) {
    return post<RequestLogMaskConfig>('/v1/log/request/mask-config', data)
}

// 获取在线会话列表
export function getOnlineSessionList(params?: Record<string, unknown>) {
    return get<PageData<OnlineSession>>('/v1/auth/session/list', params)
}

// 强制下线在线会话
export function revokeOnlineSession(data: { id: number | string; reason?: string }) {
    return post<unknown>('/v1/auth/session/revoke', data)
}
