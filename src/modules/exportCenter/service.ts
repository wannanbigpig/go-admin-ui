import * as logApi from '@/api/log'
import * as systemApi from '@/api/system'
import { normalizeDetailData, normalizeListData } from '@/modules/shared/response'
import { normalizeExportTaskSubmitResult } from '@/modules/exportCenter/model'
import { Logger } from '@/utils/logger'
import type { ExportRecord, ExportSummary, ExportTaskSubmitResult } from '@/types/exportCenter'
import type { SystemFileExportPayload } from '@/types/system'

export async function fetchExportRecordList(params?: Record<string, unknown>) {
    const response = await systemApi.getExportRecordList(params)
    return { ...normalizeListData<ExportRecord>(response), summary: response.summary }
}

export async function fetchMyExportSummary() {
    return normalizeDetailData<ExportSummary>(await systemApi.getMyExportSummary(), {
        total: 0, pending: 0, running: 0, retrying: 0, success: 0, failed: 0, canceled: 0,
    })
}

export async function fetchExportRecordListWithSummary(params?: Record<string, unknown>) {
    const result = await fetchExportRecordList(params)
    if (result.summary !== undefined) return result
    // 兼容先更新前端、后更新后端的短暂窗口。
    try {
        return { ...result, summary: await fetchMyExportSummary() }
    } catch (error) {
        Logger.error('获取导出状态汇总失败:', error)
        return { ...result, summary: null }
    }
}

export async function submitRequestLogExportTask(params?: Record<string, unknown>) {
    const response = await logApi.submitRequestLogExport(params)
    return normalizeExportTaskSubmitResult(normalizeDetailData(response, {} as ExportTaskSubmitResult))
}

export async function submitSystemFileExportTask(payload: SystemFileExportPayload) {
    const response = await systemApi.submitSystemFileExport(payload)
    return normalizeExportTaskSubmitResult(normalizeDetailData(response, {} as ExportTaskSubmitResult))
}
