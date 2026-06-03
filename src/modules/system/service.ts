import HashWorker from '@/utils/sha256.worker?worker'
import { Logger } from '@/utils/logger'
import axios from 'axios'
import { request } from '@/utils/request'
import { i18n } from '@/locales'
import * as systemApi from '@/api/system'
import * as logApi from '@/api/log'
import { normalizeDetailData, normalizeListData, normalizeArrayData } from '@/modules/shared/response'
import type { NotificationSendPayload, NotificationSendResult } from '@/types/notification'
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
    StorageSecretField,
    StorageTestResult,
    SystemFileReference,
    SystemFileFolder,
    SystemFileFolderPayload,
    SystemFileBatchDeletePayload,
    SystemFileBatchDeleteResult,
    SystemFileMovePayload,
    SystemFileLocalUploadBatchResult,
    SystemFileLocalUploadFailure,
    SystemFileUploadCompletePayload,
    SystemFileUploadCompleteBatchPayload,
    SystemFileUploadCompleteBatchResult,
    SystemFileUploadCredential,
    SystemFileUploadCredentialPayload,
    SystemFileUploadCredentialBatchPayload,
    SystemFileUploadCredentialBatchResult,
    SystemFileUploadBatchFailure,
    SystemFileUploadOptions,
    SystemFileExportPayload,
    SystemFileExportResult,
    TaskRunEvent,
    TaskTriggerPayload,
    TaskTriggerResult,
    TaskCancelPayload,
    RequestLogMaskConfig,
    MultipartInitPayload,
    MultipartInitResult,
    MultipartCompletePayload,
    MultipartAbortPayload,
} from '@/types/system'

interface LocalUploadBatchResolvedResult {
    items: SystemFile[]
    failures: SystemFileLocalUploadFailure[]
    message?: string
}

function normalizeBatchFailureEntry(entry: unknown): SystemFileUploadBatchFailure {
    const record = asRecord(entry)
    if (!record) {
        return {
            message: typeof entry === 'string' ? entry : '',
        }
    }
    return {
        client_id: typeof record.client_id === 'string' ? record.client_id : undefined,
        index: typeof record.index === 'number' ? record.index : undefined,
        code: typeof record.code === 'number' ? record.code : undefined,
        message: String(record.message || record.msg || record.error || ''),
        origin_name: typeof record.origin_name === 'string' ? record.origin_name : undefined,
    }
}

function normalizeCredentialBatchResult(response: unknown): SystemFileUploadCredentialBatchResult {
    const payload = normalizeDetailData<SystemFileUploadCredentialBatchResult>(response, {} as SystemFileUploadCredentialBatchResult)
    return {
        total: Number(payload.total || 0),
        success: Number(payload.success || 0),
        failed: Number(payload.failed || 0),
        items: Array.isArray(payload.items)
            ? payload.items.map((item) => ({
                  client_id: item?.client_id,
                  success: Boolean(item?.success),
                  data: item?.data ? normalizeDetailData<SystemFileUploadCredential>(item.data, {} as SystemFileUploadCredential) : undefined,
                  error: item?.error ? normalizeBatchFailureEntry(item.error) : undefined,
              }))
            : [],
    }
}

function normalizeCompleteBatchResult(response: unknown): SystemFileUploadCompleteBatchResult {
    const payload = normalizeDetailData<SystemFileUploadCompleteBatchResult>(response, {} as SystemFileUploadCompleteBatchResult)
    return {
        total: Number(payload.total || 0),
        success: Number(payload.success || 0),
        failed: Number(payload.failed || 0),
        items: Array.isArray(payload.items)
            ? payload.items.map((item) => ({
                  client_id: item?.client_id,
                  success: Boolean(item?.success),
                  data: item?.data ? normalizeDetailData<SystemFile>(item.data, {} as SystemFile) : undefined,
                  error: item?.error ? normalizeBatchFailureEntry(item.error) : undefined,
              }))
            : [],
    }
}

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

function extractFirstArray<T>(source: Record<string, unknown>, keys: string[]): T[] {
    for (const key of keys) {
        const value = source[key]
        if (Array.isArray(value)) {
            return value as T[]
        }
    }
    return []
}

function normalizeLocalUploadFailureEntry(entry: unknown): SystemFileLocalUploadFailure {
    const record = asRecord(entry)
    if (!record) {
        return {
            message: typeof entry === 'string' ? entry : '',
        }
    }
    return {
        index: typeof record.index === 'number' ? record.index : undefined,
        code: typeof record.code === 'number' ? record.code : undefined,
        message: String(record.message || record.msg || record.error || ''),
        origin_name: typeof record.origin_name === 'string' ? record.origin_name : undefined,
        name: typeof record.name === 'string' ? record.name : undefined,
        file_name: typeof record.file_name === 'string' ? record.file_name : undefined,
    }
}

function normalizeLocalUploadBatchPayload(payload: unknown, fallbackMessage = ''): LocalUploadBatchResolvedResult {
    if (Array.isArray(payload)) {
        return {
            items: payload as SystemFile[],
            failures: [],
            message: fallbackMessage,
        }
    }

    const record = asRecord(payload)
    if (!record) {
        return {
            items: [],
            failures: [],
            message: fallbackMessage,
        }
    }

    const nestedRecord = asRecord(record.data)
    const source = nestedRecord || record
    const items = extractFirstArray<SystemFile>(source, ['items', 'list', 'files', 'successes', 'success_items', 'uploaded', 'result'])
    const failures = extractFirstArray<unknown>(source, ['failures', 'failed', 'failed_items', 'errors', 'error_items']).map(normalizeLocalUploadFailureEntry)
    const message = String(source.message || source.msg || record.message || record.msg || fallbackMessage || '')

    if (items.length > 0 || failures.length > 0) {
        return { items, failures, message }
    }

    const legacyBatch = source as SystemFileLocalUploadBatchResult
    if (Array.isArray(legacyBatch.items) || Array.isArray(legacyBatch.failures)) {
        return {
            items: Array.isArray(legacyBatch.items) ? legacyBatch.items : [],
            failures: Array.isArray(legacyBatch.failures) ? legacyBatch.failures.map(normalizeLocalUploadFailureEntry) : [],
            message,
        }
    }

    return {
        items: [],
        failures: [],
        message,
    }
}

function parseLocalUploadBatchError(error: unknown): LocalUploadBatchResolvedResult {
    const record = asRecord(error)
    if (!record) {
        return { items: [], failures: [], message: '' }
    }

    const directData = record.data
    const directMessage = String(record.msg || record.message || '')
    const parsed = normalizeLocalUploadBatchPayload(directData, directMessage)
    if (parsed.items.length > 0 || parsed.failures.length > 0) {
        return parsed
    }

    const response = asRecord(record.response)
    const responseData = asRecord(response?.data)
    return normalizeLocalUploadBatchPayload(responseData?.data, String(responseData?.msg || responseData?.message || directMessage))
}

export async function fetchSystemConfigList(params?: Record<string, unknown>) {
    const response = await systemApi.getSystemConfigList(params)
    return normalizeListData<SystemConfig>(response)
}

export async function dispatchSystemNotification(data: NotificationSendPayload) {
    const response = await systemApi.sendSystemNotification(data)
    return normalizeDetailData<NotificationSendResult>(response, {} as NotificationSendResult)
}

export async function fetchSystemConfigDetail(id: number | string) {
    const response = await systemApi.getSystemConfigDetail({ id })
    return normalizeDetailData(response, {} as SystemConfig)
}

export async function addSystemConfig(data: SystemConfigPayload) {
    return systemApi.createSystemConfig(data)
}

export async function modifySystemConfig(data: SystemConfigPayload) {
    return systemApi.updateSystemConfig(data)
}

export async function removeSystemConfig(id: number | string) {
    return systemApi.deleteSystemConfig({ id })
}

export async function refreshSystemConfig() {
    return systemApi.refreshSystemConfigCache()
}

export async function fetchDictTypeList(params?: Record<string, unknown>) {
    const response = await systemApi.getDictTypeList(params)
    return normalizeListData<DictType>(response)
}

export async function fetchDictTypeDetail(id: number | string) {
    const response = await systemApi.getDictTypeDetail({ id })
    return normalizeDetailData(response, {} as DictType)
}

export async function addDictType(data: Record<string, unknown>) {
    return systemApi.createDictType(data)
}

export async function modifyDictType(data: Record<string, unknown>) {
    return systemApi.updateDictType(data)
}

export async function removeDictType(id: number | string) {
    return systemApi.deleteDictType({ id })
}

export async function fetchDictItemList(params: Record<string, unknown>) {
    const response = await systemApi.getDictItemList(params)
    return normalizeListData<DictItem>(response)
}

export async function addDictItem(data: Record<string, unknown>) {
    return systemApi.createDictItem(data)
}

export async function modifyDictItem(data: Record<string, unknown>) {
    return systemApi.updateDictItem(data)
}

export async function removeDictItem(id: number | string) {
    return systemApi.deleteDictItem({ id })
}

export async function fetchDictOptions(typeCode: string) {
    const response = await systemApi.getDictOptions({ type_code: typeCode })
    return normalizeArrayData<DictOption>(response)
}

export async function fetchTaskList(params?: Record<string, unknown>) {
    const response = await systemApi.getTaskList(params)
    return normalizeListData<TaskDefinition>(response)
}

export async function fetchTaskRunList(params?: Record<string, unknown>) {
    const response = await systemApi.getTaskRunList(params)
    return normalizeListData<TaskRun>(response)
}

export async function fetchTaskRunDetail(id: number | string) {
    const response = await systemApi.getTaskRunDetail({ id })
    return normalizeDetailData(response, {} as TaskRun)
}

export async function fetchCronTaskStateList(params?: Record<string, unknown>) {
    const response = await systemApi.getCronTaskStateList(params)
    return normalizeListData<CronTaskState>(response)
}

export async function fetchSystemFileList(params?: Record<string, unknown>) {
    const response = await systemApi.getSystemFileList(params)
    return normalizeListData<SystemFile>(response)
}

export async function submitSystemFileExportTask(payload: SystemFileExportPayload) {
    const response = await systemApi.submitSystemFileExport(payload)
    return normalizeDetailData(response, {} as SystemFileExportResult)
}

export async function fetchSystemFileTrashList(params?: Record<string, unknown>) {
    const response = await systemApi.getSystemFileTrashList(params)
    return normalizeListData<SystemFile>(response)
}

export async function fetchSystemFileDetail(id: number | string) {
    const response = await systemApi.getSystemFileDetail({ id })
    return normalizeDetailData(response, {} as SystemFile)
}

export async function removeSystemFile(id: number | string, force?: boolean) {
    return systemApi.deleteSystemFile({ id, force: force ? 1 : 0 })
}

export async function removeSystemFilesBatch(data: SystemFileBatchDeletePayload) {
    const response = await systemApi.deleteSystemFileBatch(data)
    return normalizeDetailData(response, {
        total: 0,
        deleted: 0,
        failed: 0,
        failures: [],
    } as SystemFileBatchDeleteResult)
}

export async function restoreSystemFileFromTrash(id: number | string) {
    return systemApi.restoreSystemFile({ id })
}

export async function restoreSystemFilesBatchFromTrash(ids: (number | string)[]) {
    return systemApi.restoreSystemFileBatch({ ids })
}

export async function destroySystemFileFromTrash(id: number | string) {
    return systemApi.destroySystemFile({ id })
}

export async function destroySystemFilesBatchFromTrash(ids: (number | string)[]) {
    return systemApi.destroySystemFileBatch({ ids })
}

export async function fetchSystemFileReferences(params: { id?: number | string; file_id?: number | string; uuid?: string }) {
    const response = await systemApi.getSystemFileReferences(params)
    return normalizeListData<SystemFileReference>(response).list
}

export async function fetchSystemFileFolderTree() {
    const response = await systemApi.getSystemFileFolderTree()
    return normalizeArrayData<SystemFileFolder>(response)
}

export async function addSystemFileFolder(data: SystemFileFolderPayload) {
    const response = await systemApi.createSystemFileFolder(data)
    return normalizeDetailData(response, {} as SystemFileFolder)
}

export async function modifySystemFileFolder(data: SystemFileFolderPayload) {
    const response = await systemApi.updateSystemFileFolder(data)
    return normalizeDetailData(response, {} as SystemFileFolder)
}

export async function removeSystemFileFolder(id: number | string) {
    return systemApi.deleteSystemFileFolder({ id })
}

export async function fetchSystemFileFolderStats(id: number | string) {
    return systemApi.getSystemFileFolderStats({ id })
}

export async function moveSystemFileFolder(id: number | string, targetParentId?: number | string | null) {
    return systemApi.moveSystemFileFolder({ id, target_parent_id: targetParentId ?? null })
}

export async function moveSystemFiles(data: SystemFileMovePayload) {
    return systemApi.moveSystemFile(data)
}

export async function fetchSystemFileUploadCredential(data: SystemFileUploadCredentialPayload) {
    const response = await systemApi.getSystemFileUploadCredential(data)
    return normalizeDetailData<SystemFileUploadCredential>(response, {})
}

export async function fetchSystemFileUploadCredentialBatch(data: SystemFileUploadCredentialBatchPayload) {
    const response = await systemApi.getSystemFileUploadCredentialBatch(data)
    return normalizeCredentialBatchResult(response)
}

export async function completeSystemFileUpload(data: SystemFileUploadCompletePayload) {
    const response = await systemApi.completeSystemFileUpload(data)
    return normalizeDetailData(response, {} as SystemFile)
}

export async function completeSystemFileUploadBatch(data: SystemFileUploadCompleteBatchPayload) {
    const response = await systemApi.completeSystemFileUploadBatch(data)
    return normalizeCompleteBatchResult(response)
}

export async function calculateSystemFileSha256(file: File, onProgress?: (progress: number) => void) {
    try {
        return await new Promise<string>((resolve, reject) => {
            const worker = new HashWorker()
            worker.onmessage = (e) => {
                const { type, progress, hash, error } = e.data
                if (type === 'progress') {
                    onProgress?.(progress)
                } else if (type === 'success') {
                    worker.terminate()
                    resolve(hash)
                } else if (type === 'error') {
                    worker.terminate()
                    reject(new Error(error))
                }
            }
            worker.onerror = (err) => {
                worker.terminate()
                reject(err)
            }
            worker.postMessage({ file })
        })
    } catch (error) {
        Logger.warn('Worker 计算 Hash 失败，降级为原生 Subtle Crypto 载入计算:', error)
        try {
            if (!globalThis.crypto?.subtle) {
                throw new Error('Web Crypto is not available')
            }
            const hashBuffer = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer())
            return Array.from(new Uint8Array(hashBuffer))
                .map((value) => value.toString(16).padStart(2, '0'))
                .join('')
        } catch (fallbackError) {
            Logger.error('降级原生 Web Crypto 计算 Hash 失败:', fallbackError)
            throw new Error(`计算文件 Hash 失败: ${String(fallbackError)}`)
        }
    }
}

const buildUploadMeta = (file: File, options: SystemFileUploadOptions, hash: string) => ({
    hash,
    origin_name: options.origin_name || file.name,
    size: file.size,
    mime_type: options.mime_type || file.type,
    folder_id: options.folder_id ?? null,
    is_public: options.is_public ?? 1,
})

let cachedSystemFileUploadDriver: SystemFileUploadOptions['driver']

export async function resolveSystemFileUploadDriver(options: SystemFileUploadOptions = {}) {
    if (options.driver) return options.driver
    if (cachedSystemFileUploadDriver) return cachedSystemFileUploadDriver
    const storage = await fetchStorageConfig()
    cachedSystemFileUploadDriver = storage.active_driver || 'local'
    return cachedSystemFileUploadDriver
}

async function uploadSystemFilesLocal(files: File[], options: SystemFileUploadOptions = {}): Promise<LocalUploadBatchResolvedResult> {
    try {
        const response = await systemApi.uploadSystemFileLocal(
            files,
            {
                folder_id: options.folder_id ?? '',
                is_public: options.is_public ?? 1,
                driver: 'local',
            },
            {
                onUploadProgress: (event) => options.onProgress?.(event.total ? Math.round((event.loaded * 100) / event.total) : 0),
            }
        )
        return normalizeLocalUploadBatchPayload(response)
    } catch (error) {
        const parsed = parseLocalUploadBatchError(error)
        if (parsed.items.length > 0 || parsed.failures.length > 0) {
            return parsed
        }
        throw error
    }
}

async function uploadSystemFileDirect(file: File, options: SystemFileUploadOptions) {
    const hash = options.hash || (await calculateSystemFileSha256(file))
    const uploadMeta = buildUploadMeta(file, options, hash)
    const credential = await fetchSystemFileUploadCredential({
        ...uploadMeta,
        driver: options.driver,
    })

    if (credential.reuse) {
        options.onReuse?.()
        return completeSystemFileUpload({
            ...(credential.complete_payload || {}),
            reuse: true,
            file_object_id: credential.file_object_id,
            upload_id: credential.upload_id,
            file_id: credential.file_id,
            uuid: credential.uuid,
            bucket: credential.bucket,
            object_key: credential.object_key,
            driver: credential.driver || options.driver,
            ...uploadMeta,
        })
    }

    if (!credential.upload_url) {
        return completeSystemFileUpload({
            ...(credential.complete_payload || {}),
            reuse: false,
            file_object_id: credential.file_object_id,
            upload_id: credential.upload_id,
            file_id: credential.file_id,
            uuid: credential.uuid,
            bucket: credential.bucket,
            object_key: credential.object_key,
            driver: credential.driver || options.driver,
            ...uploadMeta,
        })
    }

    const method = String(credential.method || 'PUT').toUpperCase()
    if (credential.form_data && method === 'POST') {
        const formData = new FormData()
        Object.entries(credential.form_data).forEach(([key, value]) => formData.append(key, value))
        formData.append('file', file)
        await axios.post(credential.upload_url, formData, {
            headers: credential.headers,
            onUploadProgress: (event) => options.onProgress?.(event.total ? Math.round((event.loaded * 100) / event.total) : 0),
        })
    } else {
        await axios.request({
            url: credential.upload_url,
            method,
            data: file,
            headers: credential.headers,
            onUploadProgress: (event) => options.onProgress?.(event.total ? Math.round((event.loaded * 100) / event.total) : 0),
        })
    }

    return completeSystemFileUpload({
        ...(credential.complete_payload || {}),
        reuse: false,
        file_object_id: credential.file_object_id,
        upload_id: credential.upload_id,
        file_id: credential.file_id,
        uuid: credential.uuid,
        bucket: credential.bucket,
        object_key: credential.object_key,
        driver: credential.driver || options.driver,
        ...uploadMeta,
    })
}

export async function uploadSystemFile(file: File, options: SystemFileUploadOptions = {}) {
    const driver = await resolveSystemFileUploadDriver(options)
    const hash = options.hash || (await calculateSystemFileSha256(file))
    if (driver === 'local') {
        const response = await systemApi.uploadSystemFileLocal(
            file,
            {
                hash,
                origin_name: options.origin_name || file.name,
                size: file.size,
                mime_type: options.mime_type || file.type,
                folder_id: options.folder_id ?? '',
                is_public: options.is_public ?? 1,
                driver,
            },
            {
                onUploadProgress: (event) => options.onProgress?.(event.total ? Math.round((event.loaded * 100) / event.total) : 0),
            }
        )
        return normalizeDetailData(response, {} as SystemFile)
    }

    try {
        return await uploadSystemFileDirect(file, { ...options, hash, driver })
    } catch (error: unknown) {
        // 强制触发 HMR 热更新，清理 linter 过期内存缓存
        // 如果错误码是 11011（如直传大文件超出限制或直传被限），自动降级为本地上传
        const errObj = error as { code?: number; data?: { code?: number } } | null | undefined
        if (errObj?.code === 11011 || errObj?.data?.code === 11011) {
            Logger.warn('直传触发 11011 错误，自动降级为本地普通上传:', error)
            const response = await systemApi.uploadSystemFileLocal(
                file,
                {
                    hash,
                    origin_name: options.origin_name || file.name,
                    size: file.size,
                    mime_type: options.mime_type || file.type,
                    folder_id: options.folder_id ?? '',
                    is_public: options.is_public ?? 1,
                    driver: 'local',
                },
                {
                    onUploadProgress: (event) => options.onProgress?.(event.total ? Math.round((event.loaded * 100) / event.total) : 0),
                }
            )
            return normalizeDetailData(response, {} as SystemFile)
        }
        throw error
    }
}

export async function uploadSystemFiles(files: File[], options: SystemFileUploadOptions = {}) {
    if (files.length === 0) return []
    const driver = await resolveSystemFileUploadDriver(options)
    if (driver === 'local') {
        const result = await uploadSystemFilesLocal(files, { ...options, driver })
        if (result.failures.length > 0 || result.items.length !== files.length) {
            const error = new Error(result.message || i18n.global.t('system.file.partialUploadFailed'))
            Object.assign(error, {
                code: -1,
                data: result,
            })
            throw error
        }
        return result.items
    }

    const result: SystemFile[] = []
    for (const file of files) {
        result.push(await uploadSystemFile(file, { ...options, driver }))
    }
    return result
}

export async function fetchStorageConfig() {
    const response = await systemApi.getStorageConfig()
    return normalizeDetailData(response, {} as StorageConfig)
}

export async function updateStorageConfig(data: StorageConfigPayload) {
    return systemApi.saveStorageConfig(data)
}

export async function testStorageConnection(data: StorageConfigPayload) {
    const response = await systemApi.testStorageConfig(data)
    return normalizeDetailData(response, {} as StorageTestResult)
}

export async function fetchStorageSecret(driver: 'aliyun_oss', field: StorageSecretField) {
    const response = await systemApi.getStorageSecret({ driver, field })
    const detail = normalizeDetailData(response, { value: '' })
    return String(detail.value || '')
}

export async function fetchTaskRunEvents(runId: number | string) {
    const response = await systemApi.getTaskRunEvents({ run_id: runId })
    return normalizeArrayData<TaskRunEvent>(response)
}

export async function triggerTaskNow(data: TaskTriggerPayload) {
    const response = await systemApi.triggerTask(data)
    return normalizeDetailData(response, {} as TaskTriggerResult)
}

export async function retryTaskByRunId(runId: number | string) {
    const response = await systemApi.retryTaskRun({ run_id: runId })
    return normalizeDetailData(response, {} as TaskTriggerResult)
}

export async function cancelTaskByRunId(runId: number | string, reason = '') {
    const payload: TaskCancelPayload = { run_id: runId }
    if (reason.trim()) {
        payload.reason = reason.trim()
    }
    const response = await systemApi.cancelTaskRun(payload)
    return normalizeDetailData(response, {} as TaskTriggerResult)
}

export async function fetchRequestLogMaskConfig() {
    const response = await logApi.getRequestLogMaskConfig()
    return normalizeDetailData(response, {
        common: [],
        request_header: [],
        request_body: [],
        response_header: [],
        response_body: [],
    } as RequestLogMaskConfig)
}

export async function updateRequestLogMaskConfig(data: RequestLogMaskConfig) {
    const response = await logApi.updateRequestLogMaskConfig(data)
    return normalizeDetailData(response, data)
}

export async function exportRequestLogCsv(params?: Record<string, unknown>) {
    return request<Blob>('/v1/log/request/export', 'GET', {
        params,
        responseType: 'blob',
    })
}

export async function downloadSystemFileBlob(uuid: string, fileName?: string) {
    if (!uuid) return
    const blob = await request<Blob>(`/v1/file/${encodeURIComponent(uuid)}`, 'GET', {
        responseType: 'blob',
    })
    const objectUrl = URL.createObjectURL(blob)
    try {
        const anchor = document.createElement('a')
        anchor.href = objectUrl
        anchor.download = fileName || uuid
        document.body.appendChild(anchor)
        anchor.click()
        document.body.removeChild(anchor)
    } finally {
        URL.revokeObjectURL(objectUrl)
    }
}

export async function initMultipartUpload(data: MultipartInitPayload) {
    const response = await systemApi.multipartInit(data as unknown as Record<string, unknown>)
    return normalizeDetailData<MultipartInitResult>(response, {} as MultipartInitResult)
}

export async function completeMultipartUpload(data: MultipartCompletePayload) {
    const response = await systemApi.multipartComplete(data as unknown as Record<string, unknown>)
    return normalizeDetailData(response, {} as SystemFile)
}

export async function abortMultipartUpload(data: MultipartAbortPayload) {
    return systemApi.multipartAbort(data as unknown as Record<string, unknown>)
}
