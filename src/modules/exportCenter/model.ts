import type { ExportRecord, ExportRecordQuery, ExportRecordStatus, ExportTaskSubmitResult } from '@/types/exportCenter'
import type { ExportProgressRealtimeEvent } from '@/types/notification'

export const ACTIVE_EXPORT_RECORD_STATUSES: ExportRecordStatus[] = ['pending', 'running', 'retrying']

export function createExportRecordQuery(): ExportRecordQuery {
    return {
        page: 1,
        per_page: 10,
        public_id: null,
        scene: null,
        status: null,
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

export function isExportRecordExpired(record: Pick<ExportRecord, 'file_expired' | 'file_expires_at'>, now = Date.now()) {
    if (record.file_expired === true) return true
    if (!record.file_expires_at) return false
    const expiresAt = new Date(record.file_expires_at.replace(' ', 'T')).getTime()
    return Number.isFinite(expiresAt) && expiresAt <= now
}

export function canDownloadExportRecord(record: Pick<ExportRecord, 'file_uuid' | 'download_ready' | 'file_expired' | 'file_expires_at'>) {
    if (isExportRecordExpired(record)) return false
    if (record.download_ready === false) return false
    return Boolean(record.file_uuid && record.download_ready)
}

export function applyExportProgressEvent(records: ExportRecord[], event: ExportProgressRealtimeEvent) {
    return records.map((record) => {
        if (record.public_id !== event.public_id) return record
        return {
            ...record,
            status: (event.status || record.status) as ExportRecordStatus,
            progress: event.progress ?? record.progress,
            processed_count: event.processed_count ?? record.processed_count,
            total_count: event.total_count ?? record.total_count,
            stage: event.stage || record.stage,
        }
    })
}

export function normalizeExportTaskSubmitResult(result: Partial<ExportTaskSubmitResult> | null | undefined): ExportTaskSubmitResult {
    return {
        public_id: result?.public_id ?? '',
        status: result?.status,
    }
}
