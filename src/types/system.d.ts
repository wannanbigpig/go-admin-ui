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
    status: number
    sort: number
    remark?: string
}

export interface SystemConfigQuery extends PageParams {
    config_key?: string | null
    config_name?: string | null
    group_code?: string | null
    value_type?: string | null
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
    handler?: string
    status: number
    allow_manual: number
    allow_retry: number
    is_high_risk: number
    remark?: string
}

export interface TaskRun extends WithId, WithTimestamp {
    task_code: string
    kind: string
    source: string
    source_id: string
    queue: string
    status: string
    attempt: number
    max_retry: number
    error_message?: string
    duration_ms: number
    started_at?: string
    finished_at?: string
    trigger_user_id?: number
    trigger_account?: string
    payload?: string
}

export interface CronTaskState extends WithId {
    task_code: string
    cron_spec: string
    last_run_id?: number | string
    last_status?: string
    last_started_at?: string
    last_finished_at?: string
    next_run_at?: string
    last_error?: string
    updated_at?: string
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
    start_time?: string | null
    end_time?: string | null
}

export interface CronTaskStateQuery extends PageParams {
    task_code?: string | null
    last_status?: string | null
}

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
