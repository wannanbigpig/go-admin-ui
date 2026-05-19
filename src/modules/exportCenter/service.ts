import * as logApi from '@/api/log'
import * as systemApi from '@/api/system'
import { normalizeDetailData, normalizeListData } from '@/modules/shared/response'
import { normalizeExportTaskSubmitResult } from '@/modules/exportCenter/model'
import type { ExportRecord, ExportTaskSubmitResult } from '@/types/exportCenter'
import type { SystemFileExportPayload } from '@/types/system'

export async function fetchExportRecordList(params?: Record<string, unknown>) {
    const response = await systemApi.getExportRecordList(params)
    return normalizeListData<ExportRecord>(response)
}

export async function submitRequestLogExportTask(params?: Record<string, unknown>) {
    const response = await logApi.submitRequestLogExport(params)
    return normalizeExportTaskSubmitResult(normalizeDetailData(response, {} as ExportTaskSubmitResult))
}

export async function submitSystemFileExportTask(payload: SystemFileExportPayload) {
    const response = await systemApi.submitSystemFileExport(payload)
    return normalizeExportTaskSubmitResult(normalizeDetailData(response, {} as ExportTaskSubmitResult))
}
