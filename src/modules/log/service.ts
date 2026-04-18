import * as logApi from '@/api/log'
import { normalizeListData, normalizeDetailData } from '@/modules/shared/response'
import type { RequestLog, LoginLog } from '@/types/log'

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
