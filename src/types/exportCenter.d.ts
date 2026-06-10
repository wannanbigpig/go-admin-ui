import type { PageParams, WithId, WithTimestamp } from './common'

export type ExportRecordStatus = 'pending' | 'running' | 'retrying' | 'success' | 'failed' | 'canceled'

export type ExportScene = 'request_log' | 'file_list'

export interface ExportTaskSubmitResult {
    run_id: number | string
    export_record_id?: number | string
    export_record?: ExportRecord
    task_id?: string
    queue?: string
    type?: string
}

export interface ExportRecord extends WithId, WithTimestamp {
    export_name?: string
    scene?: ExportScene
    scene_name?: string
    task_code?: string
    task_run_id?: number | string
    trigger_user_id?: number | string
    status?: ExportRecordStatus
    status_name?: string
    stage?: string
    stage_name?: string
    queue?: string
    progress?: number
    total_count?: number
    processed_count?: number
    file_name?: string
    file_size?: number
    format?: string
    file_url?: string
    download_url?: string
    has_file?: boolean
    download_ready?: boolean
    file_uuid?: string
    file_id?: number | string
    error_message?: string
    fail_reason?: string
    can_retry?: boolean
    retry_block_reason?: string
    started_at?: string
    finished_at?: string
}

export interface ExportRecordQuery extends PageParams {
    scene?: string | null
    status?: ExportRecordStatus | null
    task_run_id?: number | string | null
    trigger_user_id?: number | string | null
}
