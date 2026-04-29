import * as logApi from '@/api/log'
import { request } from '@/utils/request'
import { normalizeListData, normalizeDetailData } from '@/modules/shared/response'
import type { RequestLog, LoginLog } from '@/types/log'
import type { RequestLogMaskConfig } from '@/types/system'

export async function fetchRequestLogList(params?: Record<string, unknown>) {
    const response = await logApi.getRequestLogList(params)
    return normalizeListData<RequestLog>(response)
}

export async function fetchRequestLogDetail(id: number | string) {
    const response = await logApi.getRequestLogDetail(id)
    return normalizeDetailData(response, {} as RequestLog)
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

export async function saveRequestLogMaskConfig(data: RequestLogMaskConfig) {
    const response = await logApi.updateRequestLogMaskConfig(data)
    return normalizeDetailData(response, data)
}

export async function exportRequestLog(params?: Record<string, unknown>) {
    return request<Blob>('/v1/log/request/export', 'GET', {
        params,
        responseType: 'blob',
    })
}
