import type { ExportTaskSubmitResult } from './exportCenter'
import type { PageParams, WithId, WithTimestamp } from './common'

export type LocaleTextMap = Record<string, string>

export interface SystemConfig extends WithId, WithTimestamp {
    config_key: string
    config_name: string
    config_name_i18n?: LocaleTextMap
    config_value: string
    value_type: string
    group_code: string
    is_system: number
    is_sensitive: number
    is_visible: number
    manage_tab?: string
    status: number
    sort: number
    remark?: string
}

export interface SystemConfigQuery extends PageParams {
    config_key?: string | null
    config_name?: string | null
    group_code?: string | null
    value_type?: string | null
    is_visible?: number | null
    include_hidden?: number | null
    status?: number | null
}

export interface SystemConfigPayload {
    id?: number | string
    config_key: string
    config_name_i18n: LocaleTextMap
    config_value?: string
    value_type: string
    group_code?: string
    is_sensitive?: number
    is_visible?: number
    manage_tab?: string
    status?: number
    sort?: number
    remark?: string
}

export interface DictType extends WithId, WithTimestamp {
    type_code: string
    type_name: string
    type_name_i18n?: LocaleTextMap
    is_system: number
    status: number
    sort: number
    remark?: string
}

export interface DictTypeQuery extends PageParams {
    type_code?: string | null
    type_name?: string | null
    status?: number | null
}

export interface DictTypePayload {
    id?: number | string
    type_code: string
    type_name_i18n: LocaleTextMap
    status?: number
    sort?: number
    remark?: string
}

export interface DictItem extends WithId, WithTimestamp {
    type_code: string
    label: string
    label_i18n?: LocaleTextMap
    value: string
    color?: string
    tag_type?: string
    is_default: number
    is_system: number
    status: number
    sort: number
    remark?: string
}

export interface DictItemQuery extends PageParams {
    type_code: string
    label?: string | null
    value?: string | null
    status?: number | null
}

export interface DictItemPayload {
    id?: number | string
    type_code: string
    label_i18n: LocaleTextMap
    value: string
    color?: string
    tag_type?: string
    is_default?: number
    status?: number
    sort?: number
    remark?: string
}

export interface DictOption {
    label: string
    value: string | number
    color?: string
    tag_type?: string
    is_default?: number
}

export interface TaskDefinition extends WithId, WithTimestamp {
    code: string
    name: string
    kind: string
    queue: string
    cron_spec?: string
    cron_spec_description?: string
    handler?: string
    status: number
    allow_manual: number
    allow_retry: number
    is_high_risk: number
    record_success_mode?: TaskRecordSuccessMode
    record_success_rate?: number
    record_success_interval_seconds?: number
    record_detail_on_manual?: number
    record_detail_on_failure?: number
    remark?: string
}

export type TaskRecordSuccessMode = 'all' | 'sample' | 'interval' | 'none'
export type TaskDetailRecordMode = 'all' | 'sampled' | 'forced' | 'none'
export type TaskRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'canceled' | 'retrying' | 'timeout' | 'interrupted'

export interface TaskRun extends WithId, WithTimestamp {
    task_code: string
    kind: string
    source: string
    source_id: string
    queue: string
    status: TaskRunStatus | string
    attempt: number
    max_retry: number
    retry_of_run_id?: number | string
    retry_root_run_id?: number | string
    retry_seq?: number
    retry_count?: number
    latest_retry_run_id?: number | string
    latest_retry_status?: TaskRunStatus | string
    can_retry?: boolean
    retry_block_reason?: string
    error_message?: string
    duration_ms: number
    started_at?: string
    finished_at?: string
    trigger_user_id?: number
    trigger_account?: string
    detail_record_mode?: TaskDetailRecordMode | string
    payload?: string
}

export interface CronTaskState extends WithId {
    task_code: string
    cron_spec: string
    cron_spec_description?: string
    last_run_id?: number | string
    last_status?: string
    last_started_at?: string
    last_finished_at?: string
    last_success_at?: string
    last_failed_at?: string
    last_stats_window_start?: string
    next_run_at?: string
    last_error?: string
    updated_at?: string
}

export interface SystemFile extends WithId, WithTimestamp {
    file_object_id?: number | string
    uid: number | string
    uploader_name?: string
    uploader_username?: string
    folder_id?: number | string | null
    logical_path?: string
    display_name?: string
    origin_name: string
    name: string
    path: string
    size: number
    ext?: string
    hash?: string
    uuid: string
    mime_type: string
    file_type?: string
    is_public: number
    url?: string
    thumbnail_url?: string
    storage_driver?: StorageDriver
    storage_base?: string
    bucket?: string
    storage_path?: string
    object_key?: string
    etag?: string
    storage_status?: FileStorageStatus
    storage_status_name?: string
    upload_source?: string
    upload_source_name?: string
    upload_scene?: string
    upload_status?: string
    upload_status_name?: string
    reference_count?: number
    object_reuse_count?: number
    object_status?: string
    object_status_name?: string
    last_accessed_at?: string
    deleted_at?: string
    deleted_by?: number | string
    deleted_reason?: string
    references?: SystemFileReference[]
}

export interface SystemFileFolder extends WithId, WithTimestamp {
    parent_id?: number | string | null
    name: string
    path?: string
    level?: number
    sort?: number
    file_count?: number
    children?: SystemFileFolder[]
}

export interface SystemFileFolderPayload {
    id?: number | string
    parent_id?: number | string | null
    name?: string
    sort?: number
    target_parent_id?: number | string | null
}

export interface SystemFileMovePayload {
    ids: Array<number | string>
    folder_id?: number | string | null
}

export interface SystemFileBatchDeletePayload {
    ids: Array<number | string>
    deleted_reason?: string
}

export interface SystemFileBatchDeleteFailure {
    id: number | string
    code?: number
    message?: string
    references?: SystemFileReference[]
}

export interface SystemFileBatchDeleteResult {
    total: number
    deleted: number
    failed: number
    failures?: SystemFileBatchDeleteFailure[]
}

export interface SystemFileLocalUploadFailure {
    index?: number
    code?: number
    message?: string
    origin_name?: string
    name?: string
    file_name?: string
}

export interface SystemFileLocalUploadBatchResult {
    items?: SystemFile[]
    failures?: SystemFileLocalUploadFailure[]
    success_count?: number
    failed_count?: number
    message?: string
}

export interface SystemFileUploadCredentialPayload {
    hash: string
    size: number
    mime_type: string
    is_public?: number
    folder_id?: number | string | null
    driver?: StorageDriver
    origin_name: string
}

export interface SystemFileUploadBatchFailure {
    client_id?: string
    index?: number
    code?: number
    message?: string
    origin_name?: string
}

export interface SystemFileUploadCredential {
    reuse?: boolean
    driver?: StorageDriver
    bucket?: string
    upload_url?: string
    method?: string
    headers?: Record<string, string>
    form_data?: Record<string, string>
    object_key?: string
    upload_id?: string
    url?: string
    complete_token?: string
    complete_payload?: Record<string, unknown>
}

export interface SystemFileUploadCredentialBatchItemPayload extends SystemFileUploadCredentialPayload {
    client_id?: string
}

export interface SystemFileUploadCredentialBatchPayload {
    driver?: StorageDriver
    is_public?: number
    upload_scene?: string
    items: SystemFileUploadCredentialBatchItemPayload[]
}

export interface SystemFileUploadCredentialBatchItemResult {
    client_id?: string
    success?: boolean
    data?: SystemFileUploadCredential
    error?: SystemFileUploadBatchFailure
}

export interface SystemFileUploadCredentialBatchResult {
    total?: number
    success?: number
    failed?: number
    items?: SystemFileUploadCredentialBatchItemResult[]
}

export interface SystemFileUploadCompletePayload {
    complete_token: string
    reuse?: boolean
    hash?: string
    origin_name?: string
    display_name?: string
    name?: string
    size?: number
    ext?: string
    mime_type?: string
    file_type?: string
    folder_id?: number | string | null
    is_public?: number
    etag?: string
    driver?: StorageDriver
    storage_driver?: StorageDriver
    upload_scene?: string
}

export interface SystemFileUploadCompleteBatchItemPayload extends SystemFileUploadCompletePayload {
    client_id?: string
}

export interface SystemFileUploadCompleteBatchPayload {
    driver?: StorageDriver
    is_public?: number
    upload_scene?: string
    items: SystemFileUploadCompleteBatchItemPayload[]
}

export interface SystemFileUploadCompleteBatchItemResult {
    client_id?: string
    success?: boolean
    data?: SystemFile
    error?: SystemFileUploadBatchFailure
}

export interface SystemFileUploadCompleteBatchResult {
    total?: number
    success?: number
    failed?: number
    items?: SystemFileUploadCompleteBatchItemResult[]
}

export interface SystemFileUploadOptions {
    folder_id?: number | string | null
    driver?: StorageDriver
    is_public?: number
    hash?: string
    mime_type?: string
    origin_name?: string
    onProgress?: (percent: number) => void
    onReuse?: () => void
    signal?: AbortSignal
}

export type StorageDriver = 'local' | 'aliyun_oss' | (string & {})

export type FileStorageStatus = 'stored' | 'delete_failed' | (string & {})

export interface SystemFileReference extends WithId {
    file_id?: number | string
    owner_type?: string
    owner_id?: number | string
    owner_field?: string
    owner_name?: string
    source_type?: string
    source_id?: number | string
    source_name?: string
    field_name?: string
    reference_type?: string
    remark?: string
    created_at?: string
}

export interface FileDeleteBlockInfo {
    message?: string
    references?: SystemFileReference[]
}

export interface StorageLocalConfig {
    base_path?: string
    public_base_path?: string
    private_base_path?: string
}

export interface StorageAliyunOssConfig {
    endpoint?: string
    region?: string
    bucket?: string
    access_key_id?: string
    access_key_secret?: string
    public_domain?: string
    internal_endpoint?: string
    force_path_style?: boolean
}

export interface StorageConfig {
    active_driver: StorageDriver
    config: {
        local: StorageLocalConfig
        aliyun_oss: StorageAliyunOssConfig
        signed_url_ttl_seconds?: number
        max_file_size_mb?: number
        allowed_mime_types?: string[] | string
        allowed_extensions?: string[] | string
        export_temp_file_ttl_days?: number
    }
}

export type StorageConfigPayload = StorageConfig

export type StorageSecretField = 'access_key_secret' | 'secret_access_key'

export interface StorageSecretPayload {
    driver: Exclude<StorageDriver, 'local'>
    field: StorageSecretField
}

export interface StorageSecretResult {
    value?: string
}

export interface StorageTestResult {
    success?: boolean
    message?: string
    driver?: StorageDriver
    latency_ms?: number
    detail?: Record<string, unknown>
}

export interface TaskRunEvent extends WithId {
    run_id: number | string
    event_type: string
    message?: string
    meta?: string | Record<string, unknown> | unknown[]
    created_at: string
}

export interface TaskQuery extends PageParams {
    code?: string | null
    name?: string | null
    kind?: string | null
    status?: number | null
    allow_manual?: number | null
    allow_retry?: number | null
    is_high_risk?: number | null
}

export interface TaskRunQuery extends PageParams {
    task_code?: string | null
    kind?: string | null
    source?: string | null
    source_id?: string | null
    status?: string | null
    detail_record_mode?: string | null
    start_time?: string | null
    end_time?: string | null
}

export interface TaskRunStatsQuery {
    task_code?: string | null
    kind?: string | null
    source?: string | null
    start_time?: string | null
    end_time?: string | null
}

export interface TaskRunStats {
    task_code?: string
    kind?: string
    source?: string
    total_count: number
    success_count: number
    failed_count: number
    canceled_count: number
    timeout_count: number
    interrupted_count: number
    sampled_success_count: number
    duration_total_ms: number
    duration_max_ms: number
    duration_avg_ms: number
    success_rate: number
}

export interface TaskRunTrendPoint {
    window_start: string
    window_size: string
    total_count: number
    success_count: number
    failed_count: number
    canceled_count: number
    timeout_count: number
    interrupted_count: number
    sampled_success_count: number
    duration_total_ms: number
    duration_max_ms: number
}

export interface TaskRecordPolicyPayload {
    task_code: string
    record_success_mode: TaskRecordSuccessMode
    record_success_rate: number
    record_success_interval_seconds: number
    record_detail_on_manual: number
    record_detail_on_failure: number
}

export interface TaskOperationConfigPayload {
    task_code: string
    status: number
    allow_manual: number
    allow_retry: number
    cron_spec?: string
}

export interface CronTaskStateQuery extends PageParams {
    task_code?: string | null
    last_status?: string | null
}

export interface SystemFileQuery extends PageParams {
    origin_name?: string | null
    uuid?: string | null
    mime_type?: string | null
    file_type?: string | null
    is_public?: number | null
    storage_driver?: string | null
    storage_status?: string | null
    is_referenced?: number | null
    is_deleted?: number | null
    uid?: number | string | null
    folder_id?: number | string | null
    include_subfolder?: number | null
    start_time?: string | null
    end_time?: string | null
}

export type SystemFileExportPayload = Omit<SystemFileQuery, 'page' | 'per_page'> & {
    limit?: number
}

export type SystemFileExportResult = ExportTaskSubmitResult

export interface TaskTriggerPayload {
    task_code: string
    queue?: string
    task_id?: string
    payload?: Record<string, unknown>
    confirm?: string
    reason?: string
}

export interface TaskCancelPayload {
    run_id: number | string
    reason?: string
}

export interface TaskTriggerResult {
    run_id: number | string
    task_id: string
    queue: string
    type: string
    retry_from_run?: number | string
    retry_root_run?: number | string
    retry_seq?: number
    status?: string
    canceled_by?: number
    canceled_by_account?: string
    cancel_reason?: string
}

export interface RequestLogMaskConfig {
    common: string[]
    request_header: string[]
    request_body: string[]
    response_header: string[]
    response_body: string[]
}

export interface MultipartInitPayload {
    hash: string
    origin_name: string
    size: number
    mime_type?: string
    folder_id?: number | string | null
    is_public?: number
    driver?: StorageDriver
    chunk_size?: number
    part_count?: number
}

export interface MultipartPartInfo {
    part_number: number
    upload_url: string
    headers?: Record<string, string>
}

export interface MultipartInitResult {
    upload_id?: string
    bucket?: string
    object_key?: string
    parts?: MultipartPartInfo[]
    reuse?: boolean
    complete_token: string
    complete_payload?: Record<string, unknown>
}

export interface MultipartCompletePart {
    part_number: number
    etag: string
}

export interface MultipartCompletePayload {
    complete_token: string
    upload_id?: string
    bucket?: string
    object_key?: string
    reuse?: boolean
    origin_name: string
    size?: number
    hash?: string
    mime_type?: string
    file_type?: string
    folder_id?: number | string | null
    is_public?: number
    driver?: StorageDriver
    parts?: MultipartCompletePart[]
}

export interface MultipartAbortPayload {
    upload_id: string
    bucket: string
    object_key: string
    driver?: StorageDriver
}
