import * as logApi from '@/api/log'
import { normalizeListData, normalizeDetailData } from '@/modules/shared/response'
import type { RequestLog, RequestLogSelfDetail, LoginLog, OnlineSession } from '@/types/log'
import type { RequestLogMaskConfig } from '@/types/system'

export async function fetchRequestLogList(params?: Record<string, unknown>) {
    const response = await logApi.getRequestLogList(params)
    return normalizeListData<RequestLog>(response)
}

export async function fetchRequestLogDetail(id: number | string) {
    const response = await logApi.getRequestLogDetail(id)
    return normalizeDetailData(response, {} as RequestLog)
}

export async function fetchSelfRequestLogList(params?: Record<string, unknown>) {
    const response = await logApi.getSelfRequestLogList(params)
    return normalizeListData<RequestLog>(response)
}

export async function fetchSelfRequestLogDetail(id: number | string) {
    const response = await logApi.getSelfRequestLogDetail(id)
    return normalizeDetailData(response, {} as RequestLogSelfDetail)
}

export async function fetchLoginLogList(params?: Record<string, unknown>) {
    const response = await logApi.getLoginLogList(params)
    return normalizeListData<LoginLog>(response)
}

export async function fetchLoginLogDetail(id: number | string) {
    const response = await logApi.getLoginLogDetail(id)
    return normalizeDetailData(response, {} as LoginLog)
}

export async function fetchRequestLogMaskConfig() {
    const response = await logApi.getRequestLogMaskConfig()
    return normalizeDetailData(response, {
        common: [],
        request_header: [],
        request_body: [],
        response_header: [],
        response_body: [],
    } as RequestLogMaskConfig)
}

export async function fetchOnlineSessionList(params?: Record<string, unknown>) {
    const response = await logApi.getOnlineSessionList(params)
    return normalizeListData<OnlineSession>(response)
}

export async function revokeOnlineSessionById(id: number | string, reason = '') {
    const payload: { id: number | string; reason?: string } = { id }
    if (reason.trim()) {
        payload.reason = reason.trim()
    }
    return logApi.revokeOnlineSession(payload)
}
