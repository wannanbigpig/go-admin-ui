import { get, post } from '@/utils/request'
import type { PageData } from '@/types/common'
import type { SystemConfig, DictType, DictItem, DictOption, TaskDefinition, TaskRun, CronTaskState, TaskTriggerPayload, TaskTriggerResult, TaskCancelPayload } from '@/types/system'

export function getSystemConfigList(params?: Record<string, unknown>) {
    return get<PageData<SystemConfig>>('/v1/system/config/list', params)
}

export function getSystemConfigDetail(params: { id: number | string }) {
    return get<SystemConfig>('/v1/system/config/detail', params)
}

export function getSystemConfigValue(params: { config_key: string }) {
    return get<Record<string, unknown>>('/v1/system/config/value', params)
}

export function createSystemConfig(data: Record<string, unknown>) {
    return post<unknown>('/v1/system/config/create', data)
}

export function updateSystemConfig(data: Record<string, unknown>) {
    return post<unknown>('/v1/system/config/update', data)
}

export function deleteSystemConfig(data: { id: number | string }) {
    return post<unknown>('/v1/system/config/delete', data)
}

export function refreshSystemConfigCache() {
    return post<unknown>('/v1/system/config/refresh')
}

export function getDictTypeList(params?: Record<string, unknown>) {
    return get<PageData<DictType>>('/v1/system/dict/type/list', params)
}

export function getDictTypeDetail(params: { id: number | string }) {
    return get<DictType>('/v1/system/dict/type/detail', params)
}

export function createDictType(data: Record<string, unknown>) {
    return post<unknown>('/v1/system/dict/type/create', data)
}

export function updateDictType(data: Record<string, unknown>) {
    return post<unknown>('/v1/system/dict/type/update', data)
}

export function deleteDictType(data: { id: number | string }) {
    return post<unknown>('/v1/system/dict/type/delete', data)
}

export function getDictItemList(params: Record<string, unknown>) {
    return get<PageData<DictItem>>('/v1/system/dict/item/list', params)
}

export function createDictItem(data: Record<string, unknown>) {
    return post<unknown>('/v1/system/dict/item/create', data)
}

export function updateDictItem(data: Record<string, unknown>) {
    return post<unknown>('/v1/system/dict/item/update', data)
}

export function deleteDictItem(data: { id: number | string }) {
    return post<unknown>('/v1/system/dict/item/delete', data)
}

export function getDictOptions(params: { type_code: string }) {
    return get<DictOption[]>('/v1/system/dict/options', params)
}

export function getTaskList(params?: Record<string, unknown>) {
    return get<PageData<TaskDefinition>>('/v1/task/list', params)
}

export function triggerTask(data: TaskTriggerPayload) {
    return post<TaskTriggerResult>('/v1/task/trigger', data)
}

export function getTaskRunList(params?: Record<string, unknown>) {
    return get<PageData<TaskRun>>('/v1/task/run/list', params)
}

export function getTaskRunDetail(params: { id: number | string }) {
    return get<TaskRun>('/v1/task/run/detail', params)
}

export function retryTaskRun(data: { run_id: number | string }) {
    return post<TaskTriggerResult>('/v1/task/run/retry', data)
}

export function cancelTaskRun(data: TaskCancelPayload) {
    return post<TaskTriggerResult>('/v1/task/run/cancel', data)
}

export function getCronTaskStateList(params?: Record<string, unknown>) {
    return get<PageData<CronTaskState>>('/v1/task/cron/state', params)
}
