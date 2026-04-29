import { translate } from '@/locales'
import type { SystemConfigQuery, DictTypeQuery, DictItemQuery, TaskQuery, TaskRunQuery, CronTaskStateQuery, LocaleTextMap, RequestLogMaskConfig } from '@/types/system'

export const SYSTEM_STATUS_OPTIONS = [
    { label: 'common.status.enabled', value: 1, type: 'success' as const },
    { label: 'common.status.disabled', value: 0, type: 'danger' as const },
]

export const TASK_STATUS_OPTIONS = [
    { label: 'common.status.enabled', value: 1 },
    { label: 'common.status.disabled', value: 0 },
]

export const TASK_KIND_OPTIONS = [
    { label: 'system.task.options.kind.async', value: 'async' },
    { label: 'system.task.options.kind.cron', value: 'cron' },
]

export const TASK_RUN_STATUS_OPTIONS = [
    { label: 'system.task.options.status.pending', value: 'pending' },
    { label: 'system.task.options.status.running', value: 'running' },
    { label: 'system.task.options.status.succeeded', value: 'success' },
    { label: 'system.task.options.status.failed', value: 'failed' },
    { label: 'system.task.options.status.retrying', value: 'retrying' },
    { label: 'system.task.options.status.canceled', value: 'canceled' },
]

export const BOOLEAN_FILTER_OPTIONS = [
    { label: 'common.all', value: null },
    { label: 'common.yes', value: 1 },
    { label: 'common.no', value: 0 },
]

export function createLocaleTextMap(): LocaleTextMap {
    return {
        'zh-CN': '',
        'en-US': '',
    }
}

export function createSystemConfigQuery(): SystemConfigQuery {
    return {
        page: 1,
        per_page: 10,
        config_key: null,
        config_name: null,
        group_code: null,
        value_type: null,
        status: null,
    }
}

export function createDictTypeQuery(): DictTypeQuery {
    return {
        page: 1,
        per_page: 10,
        type_code: null,
        type_name: null,
        status: null,
    }
}

export function createDictItemQuery(typeCode = ''): DictItemQuery {
    return {
        page: 1,
        per_page: 10,
        type_code: typeCode,
        label: null,
        value: null,
        status: null,
    }
}

export function createTaskQuery(): TaskQuery {
    return {
        page: 1,
        per_page: 10,
        code: null,
        name: null,
        kind: null,
        status: null,
        allow_manual: null,
        allow_retry: null,
        is_high_risk: null,
    }
}

export function createTaskRunQuery(): TaskRunQuery {
    return {
        page: 1,
        per_page: 10,
        task_code: null,
        kind: null,
        source: null,
        source_id: null,
        status: null,
        start_time: null,
        end_time: null,
    }
}

export function createCronTaskStateQuery(): CronTaskStateQuery {
    return {
        page: 1,
        per_page: 10,
        task_code: null,
        last_status: null,
    }
}

export function createMaskConfigPayload(): RequestLogMaskConfig {
    return {
        common: [],
        request_header: [],
        request_body: [],
        response_header: [],
        response_body: [],
    }
}

export function getStatusLabel(status?: number) {
    return translate(status === 1 ? 'common.status.enabled' : 'common.status.disabled')
}
