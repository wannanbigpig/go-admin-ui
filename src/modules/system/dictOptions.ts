import { translate } from '@/locales'
import type { DictOption } from '@/types/system'

export const SYSTEM_DICT_TYPES = {
    commonStatus: 'common_status',
    yesNo: 'yes_no',
    taskKind: 'task_kind',
    taskSource: 'task_source',
    taskRunStatus: 'task_run_status',
} as const

export const commonStatusFallbackOptions: DictOption[] = [
    { label: translate('common.status.enabled'), value: 1, tag_type: 'success' },
    { label: translate('common.status.disabled'), value: 0, tag_type: 'danger' },
]

export const yesNoFallbackOptions: DictOption[] = [
    { label: translate('common.yes'), value: 1, tag_type: 'success' },
    { label: translate('common.no'), value: 0, tag_type: 'info' },
]

export const taskKindFallbackOptions: DictOption[] = [
    { value: 'async', label: translate('system.task.options.kind.async'), tag_type: 'info' },
    { value: 'cron', label: translate('system.task.options.kind.cron'), tag_type: 'warning' },
]

export const taskSourceFallbackOptions: DictOption[] = [
    { value: 'queue', label: translate('system.task.options.source.queue'), tag_type: 'primary' },
    { value: 'cron', label: translate('system.task.options.source.cron'), tag_type: 'warning' },
    { value: 'manual', label: translate('system.task.options.source.manual'), tag_type: 'success' },
]

export const taskRunStatusFallbackOptions: DictOption[] = [
    { value: 'pending', label: translate('system.task.options.status.pending'), tag_type: 'info' },
    { value: 'running', label: translate('system.task.options.status.running'), tag_type: 'warning' },
    { value: 'success', label: translate('system.task.options.status.succeeded'), tag_type: 'success' },
    { value: 'succeeded', label: translate('system.task.options.status.succeeded'), tag_type: 'success' },
    { value: 'failed', label: translate('system.task.options.status.failed'), tag_type: 'danger' },
    { value: 'retrying', label: translate('system.task.options.status.retrying'), tag_type: 'warning' },
    { value: 'canceled', label: translate('system.task.options.status.canceled'), tag_type: 'info' },
]
