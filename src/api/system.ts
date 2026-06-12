import { get, post, request, upload } from '@/utils/request'
import type { AxiosRequestConfig } from 'axios'
import type { PageData } from '@/types/common'
import type { ExportRecord, ExportTaskSubmitResult } from '@/types/exportCenter'
import type { AppNotification, NotificationReadPayload, NotificationSendPayload, NotificationSendResult, NotificationUnreadCount, WsTicketResult } from '@/types/notification'
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
    StorageSecretPayload,
    StorageSecretResult,
    StorageTestResult,
    SystemFileReference,
    SystemFileFolder,
    SystemFileFolderPayload,
    SystemFileBatchDeletePayload,
    SystemFileBatchDeleteResult,
    SystemFileMovePayload,
    SystemFileLocalUploadBatchResult,
    SystemFileUploadCompletePayload,
    SystemFileUploadCompleteBatchPayload,
    SystemFileUploadCompleteBatchResult,
    SystemFileUploadCredential,
    SystemFileUploadCredentialPayload,
    SystemFileUploadCredentialBatchPayload,
    SystemFileUploadCredentialBatchResult,
    SystemFileExportPayload,
    TaskRunEvent,
    TaskTriggerPayload,
    TaskTriggerResult,
    TaskCancelPayload,
    TaskRecordPolicyPayload,
    TaskOperationConfigPayload,
    TaskRunStats,
    TaskRunStatsQuery,
    TaskRunTrendPoint,
    MultipartInitPayload,
    MultipartInitResult,
    MultipartCompletePayload,
    MultipartAbortPayload,
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

export function updateTaskRecordPolicy(data: TaskRecordPolicyPayload) {
    return request<TaskDefinition>('/v1/task/record-policy', 'PATCH', { data })
}

export function updateTaskOperationConfig(data: TaskOperationConfigPayload) {
    return request<TaskDefinition>('/v1/task/operation-config', 'PATCH', { data })
}

export function getTaskRunList(params?: Record<string, unknown>) {
    return get<PageData<TaskRun>>('/v1/task/run/list', params)
}

export function getTaskRunStats(params?: TaskRunStatsQuery) {
    return get<TaskRunStats>('/v1/task/run/stats', params as Record<string, unknown>)
}

export function getTaskRunStatsTrend(params?: TaskRunStatsQuery) {
    return get<TaskRunTrendPoint[]>('/v1/task/run/stats/trend', params as Record<string, unknown>)
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

export function getExportRecordList(params?: Record<string, unknown>) {
    return get<PageData<ExportRecord>>('/v1/system/export/list', params)
}

export function getWsTicket() {
    return post<WsTicketResult>('/v1/common/ws-ticket')
}

export function getNotificationList(params?: Record<string, unknown>) {
    return get<PageData<AppNotification>>('/v1/system/notification/list', params)
}

export function getNotificationUnreadCount() {
    return get<NotificationUnreadCount>('/v1/system/notification/unread-count')
}

export function markNotificationRead(data: NotificationReadPayload) {
    return post<NotificationUnreadCount & { updated?: boolean }>('/v1/system/notification/read', data)
}

export function markAllNotificationsRead() {
    return post<unknown>('/v1/system/notification/read-all')
}

export function sendSystemNotification(data: NotificationSendPayload) {
    return post<NotificationSendResult>('/v1/system/notification/send', data)
}

export function getSystemFileList(params?: Record<string, unknown>) {
    return get<PageData<SystemFile>>('/v1/system/file/list', params)
}

export function submitSystemFileExport(data: SystemFileExportPayload) {
    return post<ExportTaskSubmitResult>('/v1/system/file/export', data as unknown as Record<string, unknown>)
}

export function getSystemFileDetail(params: { id: number | string }) {
    return get<SystemFile>('/v1/system/file/detail', params)
}

export function deleteSystemFile(data: { id: number | string; force?: number }) {
    return post<unknown>('/v1/system/file/delete', data)
}

export function deleteSystemFileBatch(data: SystemFileBatchDeletePayload) {
    return post<SystemFileBatchDeleteResult>('/v1/system/file/batch-delete', data)
}

export function getSystemFileTrashList(params?: Record<string, unknown>) {
    return get<PageData<SystemFile>>('/v1/system/file/trash/list', params)
}

export function restoreSystemFile(data: { id: number | string }) {
    return post<unknown>('/v1/system/file/trash/restore', data)
}

export function restoreSystemFileBatch(data: { ids: (number | string)[] }) {
    return post<unknown>('/v1/system/file/trash/batch-restore', data)
}

export function destroySystemFile(data: { id: number | string }) {
    return post<unknown>('/v1/system/file/trash/destroy', data)
}

export function destroySystemFileBatch(data: { ids: (number | string)[] }) {
    return post<unknown>('/v1/system/file/trash/batch-destroy', data)
}

export function getSystemFileReferences(params: { id?: number | string; file_id?: number | string; uuid?: string }) {
    return get<SystemFileReference[]>('/v1/system/file/references', params)
}

export function getSystemFileFolderTree() {
    return get<SystemFileFolder[]>('/v1/system/file/folder/tree')
}

export function getSystemFileFolderStats(data: { id: number | string }) {
    return get<{ file_count: number; child_folder_count: number }>('/v1/system/file/folder/stats', data)
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
    return upload<SystemFile | SystemFile[] | SystemFileLocalUploadBatchResult>('/v1/system/file/upload/local', files, extra, options)
}

export function getSystemFileUploadCredential(data: SystemFileUploadCredentialPayload) {
    return post<SystemFileUploadCredential>('/v1/system/file/upload/credential', data)
}

export function getSystemFileUploadCredentialBatch(data: SystemFileUploadCredentialBatchPayload) {
    return post<SystemFileUploadCredentialBatchResult>('/v1/system/file/upload/credential/batch', data)
}

export function completeSystemFileUpload(data: SystemFileUploadCompletePayload) {
    return post<SystemFile>('/v1/system/file/upload/complete', data)
}

export function completeSystemFileUploadBatch(data: SystemFileUploadCompleteBatchPayload) {
    return post<SystemFileUploadCompleteBatchResult>('/v1/system/file/upload/complete/batch', data)
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

export function getStorageSecret(params: StorageSecretPayload) {
    return get<StorageSecretResult>('/v1/system/storage/secret', params as unknown as Record<string, unknown>)
}

export function getTaskRunEvents(params: { run_id: number | string }) {
    return get<TaskRunEvent[]>('/v1/task/run/events', params)
}

export function multipartInit(data: MultipartInitPayload) {
    return post<MultipartInitResult>('/v1/system/file/upload/multipart/init', data)
}

export function multipartComplete(data: MultipartCompletePayload) {
    return post<SystemFile>('/v1/system/file/upload/multipart/complete', data)
}

export function multipartAbort(data: MultipartAbortPayload) {
    return post<unknown>('/v1/system/file/upload/multipart/abort', data)
}
