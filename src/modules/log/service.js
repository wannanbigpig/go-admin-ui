import { getLoginLogDetail, getLoginLogList, getRequestLogDetail, getRequestLogList } from '@/api/log'
import { normalizeDetailData, normalizeListData } from '@/modules/shared/response'

export async function fetchRequestLogPage(params) {
    const response = await getRequestLogList(params)
    return normalizeListData(response)
}

export async function fetchRequestLogDetail(id) {
    const response = await getRequestLogDetail(id)
    return normalizeDetailData(response, {})
}

export async function fetchAdminLoginLogPage(params) {
    const response = await getLoginLogList(params)
    return normalizeListData(response)
}

export async function fetchAdminLoginLogDetail(id) {
    const response = await getLoginLogDetail(id)
    return normalizeDetailData(response, {})
}
