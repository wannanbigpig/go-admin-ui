import type { ExportRecord, ExportRecordQuery, ExportRecordStatus, ExportTaskSubmitResult } from '@/types/exportCenter'

export const ACTIVE_EXPORT_RECORD_STATUSES: ExportRecordStatus[] = ['pending', 'running', 'retrying']

export function createExportRecordQuery(): ExportRecordQuery {
    return {
        page: 1,
        per_page: 10,
        scene: null,
        status: null,
        task_run_id: null,
        trigger_user_id: null,
    }
}

export function isActiveExportRecordStatus(status?: string | null) {
    return ACTIVE_EXPORT_RECORD_STATUSES.includes((status || '') as ExportRecordStatus)
}

export function hasActiveExportRecords(list: Array<Pick<ExportRecord, 'status'>>) {
    return list.some((item) => isActiveExportRecordStatus(item.status))
}

export function getExportRecordProgress(record: Pick<ExportRecord, 'progress'>) {
    const progress = Number(record.progress)
    if (!Number.isFinite(progress)) return null
    return Math.max(0, Math.min(100, Math.round(progress)))
}

export function getExportRecordProgressText(record: Pick<ExportRecord, 'processed_count' | 'total_count'>) {
    const totalCount = Number(record.total_count)
    const processedCount = Number(record.processed_count)
    if (!Number.isFinite(totalCount) || totalCount <= 0) return ''
    const normalizedProcessed = Number.isFinite(processedCount) ? Math.max(0, Math.min(totalCount, Math.round(processedCount))) : 0
    return `${normalizedProcessed}/${Math.round(totalCount)}`
}

export function canDownloadExportRecord(record: Pick<ExportRecord, 'file_uuid' | 'file_id' | 'download_ready'>) {
    return Boolean(record.file_uuid || record.file_id || record.download_ready)
}

export function normalizeExportTaskSubmitResult(result: Partial<ExportTaskSubmitResult> | null | undefined): ExportTaskSubmitResult {
    return {
        run_id: result?.run_id ?? '',
        export_record_id: result?.export_record_id,
        export_record: result?.export_record,
        task_id: result?.task_id,
        queue: result?.queue,
        type: result?.type,
    }
}
