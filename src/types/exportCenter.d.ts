import type { PageParams, WithTimestamp } from './common'

export type ExportRecordStatus = 'pending' | 'running' | 'retrying' | 'success' | 'failed' | 'canceled'

export type ExportScene = 'request_log' | 'file_list'

export interface ExportTaskSubmitResult {
    public_id: string
    status?: ExportRecordStatus
}

export interface ExportRecord extends WithTimestamp {
    public_id: string
    export_name?: string
    scene?: ExportScene
    status?: ExportRecordStatus
    stage?: string
    progress?: number
    total_count?: number
    processed_count?: number
    file_name?: string
    file_size?: number
    file_expires_at?: string | null
    file_expired?: boolean
    format?: string
    download_ready?: boolean
    file_uuid?: string
    finished_at?: string
}

export interface ExportRecordQuery extends PageParams {
    public_id?: string | null
    scene?: string | null
    status?: ExportRecordStatus | null
}
