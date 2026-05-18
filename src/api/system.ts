import { get, post, upload } from '@/utils/request'
import type { AxiosRequestConfig } from 'axios'
import type { PageData } from '@/types/common'
import type {
    SystemConfig,
    SystemConfigPayload,
    DictType,
    DictItem,
    DictOption,
    TaskDefinition,
    TaskRun,
    CronTaskState,
    SystemFile,
    StorageConfig,
    StorageConfigPayload,
    StorageTestResult,
    SystemFileReference,
    SystemFileFolder,
    SystemFileFolderPayload,
    SystemFileMovePayload,
    SystemFileUploadCompletePayload,
    SystemFileUploadCredential,
    SystemFileUploadCredentialPayload,
    TaskRunEvent,
    TaskTriggerPayload,
    TaskTriggerResult,
    TaskCancelPayload,
} from '@/types/system'

export function getSystemConfigList(params?: Record<string, unknown>) {
    return get<PageData<SystemConfig>>('/v1/system/config/list', params)
}

export function getSystemConfigDetail(params: { id: number | string }) {
    return get<SystemConfig>('/v1/system/config/detail', params)
}

export function getSystemConfigValue(params: { config_key: string }) {
    return get<Record<string, unknown>>('/v1/system/config/value', params)
}

export function createSystemConfig(data: SystemConfigPayload) {
    return post<unknown>('/v1/system/config/create', data)
}

export function updateSystemConfig(data: SystemConfigPayload) {
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

export function getSystemFileList(params?: Record<string, unknown>) {
    return get<PageData<SystemFile>>('/v1/system/file/list', params)
}

export function getSystemFileDetail(params: { id: number | string }) {
    return get<SystemFile>('/v1/system/file/detail', params)
}

export function deleteSystemFile(data: { id: number | string }) {
    return post<unknown>('/v1/system/file/delete', data)
}

export function getSystemFileTrashList(params?: Record<string, unknown>) {
    return get<PageData<SystemFile>>('/v1/system/file/trash/list', params)
}

export function restoreSystemFile(data: { id: number | string }) {
    return post<unknown>('/v1/system/file/trash/restore', data)
}

export function destroySystemFile(data: { id: number | string }) {
    return post<unknown>('/v1/system/file/trash/destroy', data)
}

export function getSystemFileReferences(params: { id?: number | string; file_id?: number | string; uuid?: string }) {
    return get<SystemFileReference[]>('/v1/system/file/references', params)
}

export function getSystemFileFolderTree() {
    return get<SystemFileFolder[]>('/v1/system/file/folder/tree')
}

export function createSystemFileFolder(data: SystemFileFolderPayload) {
    return post<SystemFileFolder>('/v1/system/file/folder/create', data)
}

export function updateSystemFileFolder(data: SystemFileFolderPayload) {
    return post<SystemFileFolder>('/v1/system/file/folder/update', data)
}

export function deleteSystemFileFolder(data: { id: number | string }) {
    return post<unknown>('/v1/system/file/folder/delete', data)
}

export function moveSystemFileFolder(data: { id: number | string; target_parent_id?: number | string | null }) {
    return post<unknown>('/v1/system/file/folder/move', data)
}

export function moveSystemFile(data: SystemFileMovePayload) {
    return post<unknown>('/v1/system/file/move', data)
}

export function uploadSystemFileLocal(files: File | File[], extra: Record<string, unknown> = {}, options: AxiosRequestConfig = {}) {
    return upload<SystemFile | SystemFile[]>('/v1/system/file/upload/local', files, extra, options)
}

export function getSystemFileUploadCredential(data: SystemFileUploadCredentialPayload) {
    return post<SystemFileUploadCredential>('/v1/system/file/upload/credential', data)
}

export function completeSystemFileUpload(data: SystemFileUploadCompletePayload) {
    return post<SystemFile>('/v1/system/file/upload/complete', data)
}

export function getStorageConfig() {
    return get<StorageConfig>('/v1/system/storage/config')
}

export function saveStorageConfig(data: StorageConfigPayload) {
    return post<unknown>('/v1/system/storage/config', data)
}

export function testStorageConfig(data: StorageConfigPayload) {
    return post<StorageTestResult>('/v1/system/storage/test', data)
}

export function getTaskRunEvents(params: { run_id: number | string }) {
    return get<TaskRunEvent[]>('/v1/task/run/events', params)
}
