import { computed, ref } from 'vue'
import axios from 'axios'
import {
    calculateSystemFileSha256,
    resolveSystemFileUploadDriver,
    uploadSystemFile,
    uploadSystemFiles,
    fetchSystemFileUploadCredentialBatch,
    completeSystemFileUploadBatch,
    initMultipartUpload,
    completeMultipartUpload,
    abortMultipartUpload,
    fetchSystemFileUploadOptions,
} from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { MultipartInitResult, MultipartCompletePart, StorageDriver, SystemFileUploadCredential, SystemFileUploadCompleteBatchItemPayload } from '@/types/system'
export type { StorageDriver } from '@/types/system'

import { i18n } from '@/locales'
import { ErrorCode } from '@/constants/errorCodes'

// 规避构建期间 AST 优化 tree-shaking 导致的变量未使用误报
if (false as boolean) {
    void completeSystemFileUploadBatch
}

export interface UploadOptions {
    folderId?: number | string | null
    driver?: string
    is_public?: number
    enableMultipart?: boolean
    signal?: AbortSignal
    onReuse?: () => void
    onResult?: (result: unknown) => void
    capabilities?: Awaited<ReturnType<typeof fetchSystemFileUploadOptions>>
}

export type UploadTaskStatus = 'hashing' | 'pending' | 'uploading' | 'reuse' | 'success' | 'error'

export interface UploadTask {
    id: string
    file: File | null
    name: string
    size: number
    folderId?: number | string | null
    progress: number
    status: UploadTaskStatus
    hash?: string
    error?: string
    result?: unknown
    uploadOptions?: UploadOptions
}

const MAX_PARALLEL_UPLOADS = 5
const MULTIPART_THRESHOLD = 20 * 1024 * 1024
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024
const PART_CONCURRENCY = 3

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

function resolveCompleteToken(value: { complete_token?: string; complete_payload?: Record<string, unknown> }) {
    const payloadToken = value.complete_payload?.complete_token
    return String(value.complete_token || (typeof payloadToken === 'string' ? payloadToken : '')).trim()
}

function getTaskTargetFolderId(task: UploadTask, options?: UploadOptions) {
    return task.folderId ?? options?.folderId
}

function isSameTaskFolder(tasks: UploadTask[], options?: UploadOptions) {
    if (tasks.length === 0) return false
    const firstFolderId = getTaskTargetFolderId(tasks[0], options)
    return tasks.every((task) => getTaskTargetFolderId(task, options) === firstFolderId)
}

function releaseCompletedTaskFile(task: UploadTask) {
    if (task.status === 'success' || task.status === 'reuse') {
        task.file = null
    }
}

function extractBatchFailureList(error: unknown): Array<Record<string, unknown>> {
    const record = asRecord(error)
    const data = asRecord(record?.data)
    const failures = data?.failures
    return Array.isArray(failures) ? (failures.filter((item) => !!item && typeof item === 'object') as Array<Record<string, unknown>>) : []
}

async function uploadCredentialTarget(file: File, credential: SystemFileUploadCredential, onProgress?: (percent: number) => void, signal?: AbortSignal) {
    const method = String(credential.method || 'PUT').toUpperCase()
    if (credential.form_data && method === 'POST') {
        const formData = new FormData()
        Object.entries(credential.form_data).forEach(([key, value]) => formData.append(key, value))
        formData.append('file', file)
        await axios.post(credential.upload_url!, formData, {
            headers: credential.headers,
            signal,
            onUploadProgress: (event) => onProgress?.(event.total ? Math.round((event.loaded * 100) / event.total) : 0),
        })
        return
    }
    await axios.request({
        url: credential.upload_url,
        method,
        data: file,
        headers: credential.headers,
        signal,
        onUploadProgress: (event) => onProgress?.(event.total ? Math.round((event.loaded * 100) / event.total) : 0),
    })
}

function hasDirectCompletePayload(item: SystemFileUploadCompleteBatchItemPayload) {
    return Boolean(item.complete_token)
}

function isUploadCanceled(options?: UploadOptions, error?: unknown) {
    return Boolean(options?.signal?.aborted || axios.isCancel(error) || (error as { code?: string } | null)?.code === 'ERR_CANCELED')
}

export function useFileUpload() {
    const uploadTasks = ref<UploadTask[]>([])
    let uploadAbortController: AbortController | null = null

    const uploading = computed(() => uploadTasks.value.some((task) => task.status === 'hashing' || task.status === 'pending' || task.status === 'uploading'))
    const uploadFinishedCount = computed(() => uploadTasks.value.filter((task) => task.status === 'reuse' || task.status === 'success' || task.status === 'error').length)
    const uploadFinished = computed(() => uploadTasks.value.length > 0 && uploadFinishedCount.value === uploadTasks.value.length)

    const createUploadTask = (file: File, overrides?: { name?: string; folderId?: number | string | null; uploadOptions?: UploadOptions }): UploadTask => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        name: overrides?.name || file.name,
        size: file.size,
        folderId: overrides?.folderId,
        progress: 0,
        status: 'pending',
        uploadOptions: overrides?.uploadOptions,
    })

    const isLocalStorageMultipartUnsupportedError = (error: unknown): boolean => {
        if (!error || typeof error !== 'object') return false
        const record = error as Record<string, unknown>
        if (record.code === ErrorCode.LocalStorageMultipartUnsupported) {
            return true
        }
        const response = record.response as Record<string, unknown> | undefined
        const data = response?.data as Record<string, unknown> | undefined
        if (data?.code === ErrorCode.LocalStorageMultipartUnsupported) {
            return true
        }
        return false
    }

    const uploadOneTask = async (rawTask: UploadTask, options?: UploadOptions) => {
        const ownedController = options?.signal ? null : new AbortController()
        if (ownedController) {
            uploadAbortController?.abort()
            uploadAbortController = ownedController
            options = { ...options, signal: ownedController.signal }
        }
        const task = uploadTasks.value.find((item) => item.id === rawTask.id) || rawTask
        task.status = 'pending'
        task.error = ''
        task.result = undefined
        task.progress = 0
        const targetFolderId = task.folderId ?? options?.folderId

        const doNormalUpload = async () => {
            let reused = false
            if (!task.file) {
                task.status = 'error'
                task.error = 'File is released'
                return
            }
            const result = await uploadSystemFile(task.file, {
                folder_id: targetFolderId,
                driver: options?.driver,
                hash: task.hash,
                signal: options?.signal,
                onProgress: (percent) => {
                    if (isUploadCanceled(options)) return
                    task.progress = Math.min(99, Math.max(0, percent))
                },
                onReuse: () => {
                    if (isUploadCanceled(options)) return
                    reused = true
                    task.status = 'reuse'
                    task.progress = 100
                    options?.onReuse?.()
                },
            })
            if (isUploadCanceled(options)) return
            task.progress = 100
            task.status = reused ? 'reuse' : 'success'
            if (result) {
                task.result = result
                options?.onResult?.(result)
            }
        }

        try {
            const capabilities = options?.capabilities || (await fetchSystemFileUploadOptions())
            if (isUploadCanceled(options)) return
            if (!task.file) {
                task.status = 'error'
                task.error = 'File is released'
                return
            }
            const maxBytes = (capabilities.max_file_size_mb || 0) * 1024 * 1024
            if (maxBytes > 0 && task.file.size > maxBytes) {
                task.status = 'error'
                task.progress = 0
                task.error = i18n.global.t('system.file.sizeExceedsLimit', { size: capabilities.max_file_size_mb })
                return
            }

            task.status = 'hashing'
            task.progress = 0
            task.hash = await calculateSystemFileSha256(task.file, (progress) => {
                if (isUploadCanceled(options)) return
                task.progress = progress
            })
            if (isUploadCanceled(options)) return
            task.status = 'uploading'
            if (options?.enableMultipart && capabilities.supports_multipart_upload && task.file!.size > MULTIPART_THRESHOLD) {
                try {
                    const result = await uploadMultipart(task, {
                        ...options,
                        folderId: targetFolderId,
                    })
                    if (result) {
                        task.result = result
                        options?.onResult?.(result)
                    }
                } catch (err) {
                    if (isLocalStorageMultipartUnsupportedError(err)) {
                        Logger.warn('本地存储不支持分片上传，自动降级为普通单体上传:', err)
                        await doNormalUpload()
                    } else {
                        throw err
                    }
                }
            } else {
                await doNormalUpload()
            }
        } catch (error) {
            if (isUploadCanceled(options, error)) return
            task.status = 'error'
            task.error = getErrorMessage(error)
            Logger.error('上传文件资源失败:', error)
        } finally {
            releaseCompletedTaskFile(task)
            if (ownedController && uploadAbortController === ownedController) {
                uploadAbortController = null
            }
        }
    }

    const runLocalBatchUpload = async (tasks: UploadTask[], options?: UploadOptions) => {
        if (tasks.length <= 1) return false
        if (options?.enableMultipart) return false
        if (!isSameTaskFolder(tasks, options)) return false

        const resolvedDriver = await resolveSystemFileUploadDriver({
            folder_id: getTaskTargetFolderId(tasks[0], options),
            driver: options?.driver as StorageDriver | undefined,
        })
        if (resolvedDriver !== 'local') return false

        tasks.forEach((task) => {
            task.error = ''
            task.result = undefined
            task.progress = 0
            task.status = 'uploading'
        })

        try {
            const results = await uploadSystemFiles(
                tasks.map((task) => task.file!),
                {
                    folder_id: getTaskTargetFolderId(tasks[0], options),
                    driver: resolvedDriver,
                    onProgress: (percent) => {
                        if (isUploadCanceled(options)) return
                        tasks.forEach((task) => {
                            if (task.status === 'uploading') {
                                task.progress = Math.min(99, Math.max(0, percent))
                            }
                        })
                    },
                    signal: options?.signal,
                }
            )

            if (isUploadCanceled(options)) return true

            results.forEach((result, index) => {
                const task = tasks[index]
                if (!task) return
                task.progress = 100
                task.status = 'success'
                task.result = result
                options?.onResult?.(result)
            })
            return true
        } catch (error) {
            if (isUploadCanceled(options, error)) return true
            const failures = extractBatchFailureList(error)
            const unassignedTasks = [...tasks]
            const partialData = asRecord(asRecord(error)?.data)
            const partialItems = Array.isArray(partialData?.items) ? partialData.items : []

            failures.forEach((failure) => {
                const failureIndex = typeof failure.index === 'number' ? failure.index : -1
                let task: UploadTask | undefined
                if (failureIndex >= 0 && failureIndex < tasks.length) {
                    task = tasks[failureIndex]
                } else {
                    const failureName = String(failure.origin_name || failure.file_name || failure.name || '')
                    if (failureName) {
                        task = unassignedTasks.find((candidate) => candidate.file?.name === failureName || candidate.name === failureName)
                    }
                }
                if (!task) {
                    task = unassignedTasks[0]
                }
                if (!task) return

                task.status = 'error'
                task.progress = 0
                task.error = String(failure.message || failure.msg || getErrorMessage(error))
                const taskIndex = unassignedTasks.indexOf(task)
                if (taskIndex >= 0) {
                    unassignedTasks.splice(taskIndex, 1)
                }
            })

            let resultCursor = 0
            tasks.forEach((task) => {
                if (task.status === 'error') return
                const result = partialItems[resultCursor]
                resultCursor += 1
                if (result) {
                    task.progress = 100
                    task.status = 'success'
                    task.result = result
                    options?.onResult?.(result)
                    return
                }
                task.status = 'error'
                task.progress = 0
                task.error = getErrorMessage(error)
            })

            if (!failures.length && partialItems.length === 0) {
                tasks.forEach((task) => {
                    task.status = 'error'
                    task.progress = 0
                    task.error = getErrorMessage(error)
                })
            }
            Logger.error('批量上传文件资源失败:', error)
            return true
        } finally {
            tasks.forEach((task) => {
                releaseCompletedTaskFile(task)
            })
        }
    }

    const runDirectBatchUpload = async (tasks: UploadTask[], options?: UploadOptions) => {
        if (tasks.length <= 1) return false
        if (options?.enableMultipart) return false

        const resolvedDriver = await resolveSystemFileUploadDriver({
            folder_id: getTaskTargetFolderId(tasks[0], options),
            driver: options?.driver as StorageDriver | undefined,
        })
        if (resolvedDriver === 'local') return false

        for (const task of tasks) {
            if (isUploadCanceled(options)) return true
            task.error = ''
            task.result = undefined
            task.progress = 0
            task.status = 'hashing'
            if (!task.file) {
                task.status = 'error'
                task.progress = 0
                task.error = 'File is released'
                continue
            }
            task.hash = await calculateSystemFileSha256(task.file, (progress) => {
                if (isUploadCanceled(options)) return
                task.progress = progress
            })
            if (isUploadCanceled(options)) return true
            task.status = 'uploading'
        }

        try {
            const taskById = new Map<string, UploadTask>()
            for (const task of tasks) {
                taskById.set(task.id, task)
            }
            const credentialResult = await fetchSystemFileUploadCredentialBatch({
                driver: resolvedDriver,
                items: tasks.map((task) => ({
                    client_id: task.id,
                    folder_id: getTaskTargetFolderId(task, options),
                    origin_name: task.name,
                    size: task.size,
                    mime_type: task.file?.type || 'application/octet-stream',
                    hash: task.hash!,
                    is_public: task.uploadOptions?.is_public ?? options?.is_public ?? 0,
                })),
            })
            if (isUploadCanceled(options)) return true

            const completeItems: SystemFileUploadCompleteBatchItemPayload[] = []
            const reuseClientIds = new Set<string>()
            const pendingUploads: Array<{ task: UploadTask; file: File; credential: SystemFileUploadCredential }> = []

            const handledCredentialClientIds = new Set<string>()
            for (const item of credentialResult.items || []) {
                const task = tasks.find((current) => current.id === item.client_id)
                if (!task) continue
                if (item.client_id) handledCredentialClientIds.add(item.client_id)
                if (!item.success || !item.data) {
                    task.status = 'error'
                    task.progress = 0
                    task.error = item.error?.message || i18n.global.t('system.file.getUploadTokenFailed')
                    continue
                }

                const credential = item.data
                const uploadMeta = {
                    hash: task.hash,
                    origin_name: task.name,
                    size: task.size,
                    mime_type: task.file?.type || 'application/octet-stream',
                    folder_id: getTaskTargetFolderId(task, options),
                    is_public: task.uploadOptions?.is_public ?? options?.is_public ?? 0,
                }
                const completeToken = resolveCompleteToken(credential)
                if (!completeToken) {
                    task.status = 'error'
                    task.progress = 0
                    task.error = i18n.global.t('system.file.getUploadTokenFailed')
                    continue
                }

                if (credential.reuse) {
                    reuseClientIds.add(task.id)
                    options?.onReuse?.()
                    completeItems.push({
                        client_id: task.id,
                        complete_token: completeToken,
                        reuse: true,
                        driver: credential.driver || resolvedDriver,
                        ...uploadMeta,
                    })
                    continue
                }

                const completeItem: SystemFileUploadCompleteBatchItemPayload = {
                    client_id: task.id,
                    complete_token: completeToken,
                    reuse: false,
                    driver: credential.driver || resolvedDriver,
                    ...uploadMeta,
                }

                if (credential.upload_url) {
                    pendingUploads.push({ task, file: task.file!, credential })
                } else if (!hasDirectCompletePayload(completeItem)) {
                    task.status = 'error'
                    task.progress = 0
                    task.error = i18n.global.t('system.file.getUploadTokenFailed')
                    continue
                }

                completeItems.push(completeItem)
            }
            for (const task of tasks) {
                if (handledCredentialClientIds.has(task.id) || task.status === 'error') continue
                task.status = 'error'
                task.progress = 0
                task.error = i18n.global.t('system.file.getUploadTokenFailed')
            }

            if (pendingUploads.length > 0) {
                let cursor = 0
                const workers = Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, pendingUploads.length) }, async () => {
                    while (cursor < pendingUploads.length) {
                        if (options?.signal?.aborted) break
                        const current = pendingUploads[cursor]
                        cursor += 1
                        try {
                            await uploadCredentialTarget(
                                current.file,
                                current.credential,
                                (percent) => {
                                    current.task.progress = Math.min(99, Math.max(0, percent))
                                },
                                options?.signal
                            )
                        } catch (err) {
                            current.task.status = 'error'
                            current.task.progress = 0
                            current.task.error = getErrorMessage(err)
                        }
                    }
                })
                await Promise.all(workers)
            }

            if (isUploadCanceled(options)) return true

            const validCompleteItems = completeItems.filter((item) => {
                const cid = item.client_id
                if (!cid) return true
                const task = taskById.get(cid)
                return !task || task.status !== 'error'
            })
            if (validCompleteItems.length === 0) {
                return true
            }

            const completeResult = await completeSystemFileUploadBatch({
                driver: resolvedDriver,
                items: validCompleteItems,
            })
            if (isUploadCanceled(options)) return true

            const handledClientIds = new Set<string>()
            for (const item of completeResult.items || []) {
                const task = tasks.find((current) => current.id === item.client_id)
                if (!task) continue
                if (item.client_id) {
                    handledClientIds.add(item.client_id)
                }
                if (!item.success || !item.data) {
                    task.status = 'error'
                    task.progress = 0
                    task.error = item.error?.message || i18n.global.t('system.file.completeUploadRegistrationFailed')
                    continue
                }
                task.progress = 100
                task.status = reuseClientIds.has(task.id) ? 'reuse' : 'success'
                task.result = item.data
                options?.onResult?.(item.data)
            }
            for (const item of validCompleteItems) {
                const clientId = item.client_id
                if (!clientId || handledClientIds.has(clientId)) continue
                const task = taskById.get(clientId)
                if (!task) continue
                task.status = 'error'
                task.progress = 0
                task.error = i18n.global.t('system.file.completeUploadRegistrationFailed')
            }

            return true
        } catch (error) {
            if (isUploadCanceled(options, error)) return true
            tasks.forEach((task) => {
                if (task.status === 'success' || task.status === 'reuse') return
                task.status = 'error'
                task.progress = 0
                task.error = getErrorMessage(error)
            })
            Logger.error('批量直传文件资源失败:', error)
            return true
        } finally {
            tasks.forEach((task) => {
                releaseCompletedTaskFile(task)
            })
        }
    }

    const runUploadQueue = async (tasks: UploadTask[], options?: UploadOptions) => {
        uploadAbortController?.abort()
        uploadAbortController = new AbortController()
        const signal = options?.signal ?? uploadAbortController.signal

        const reactiveTasks = tasks.map((t) => uploadTasks.value.find((item) => item.id === t.id) || t)

        let validTasks = reactiveTasks
        let capabilities: Awaited<ReturnType<typeof fetchSystemFileUploadOptions>> | undefined
        try {
            capabilities = await fetchSystemFileUploadOptions()
            if (signal.aborted) return
            const maxBytes = (capabilities.max_file_size_mb || 0) * 1024 * 1024

            validTasks = []
            for (const task of reactiveTasks) {
                if (maxBytes > 0 && task.file && task.file.size > maxBytes) {
                    task.status = 'error'
                    task.progress = 0
                    task.error = i18n.global.t('system.file.sizeExceedsLimit', { size: capabilities.max_file_size_mb })
                } else {
                    validTasks.push(task)
                }
            }
        } catch (error) {
            Logger.error('获取存储配置以校验文件大小限制失败:', error)
            validTasks = reactiveTasks
        }

        if (validTasks.length === 0) return

        const nextOptions = { ...options, signal, capabilities }

        if (await runLocalBatchUpload(validTasks, nextOptions)) {
            return
        }
        if (await runDirectBatchUpload(validTasks, nextOptions)) {
            return
        }
        let cursor = 0
        const workers = Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, validTasks.length) }, async () => {
            while (cursor < validTasks.length) {
                if (signal.aborted) break
                const task = validTasks[cursor]
                cursor += 1
                try {
                    await uploadOneTask(task, nextOptions)
                } catch {
                    task.status = 'error'
                    if (!task.error) task.error = 'Upload failed'
                }
            }
        })
        await Promise.all(workers)
    }

    const clearTasks = () => {
        uploadAbortController?.abort()
        uploadAbortController = null
        uploadTasks.value = []
    }

    return {
        uploadTasks,
        uploading,
        uploadFinishedCount,
        uploadFinished,
        createUploadTask,
        uploadOneTask,
        runUploadQueue,
        clearTasks,
    }
}

async function uploadMultipart(task: UploadTask, options?: UploadOptions) {
    if (!task.file) {
        throw new Error('File is released')
    }
    const chunkSize = DEFAULT_CHUNK_SIZE
    const partCount = Math.ceil(task.size / chunkSize)

    const initResult: MultipartInitResult = await initMultipartUpload({
        hash: task.hash!,
        origin_name: task.name,
        size: task.size,
        mime_type: task.file.type || 'application/octet-stream',
        folder_id: options?.folderId,
        driver: options?.driver as StorageDriver,
        chunk_size: chunkSize,
        part_count: partCount,
    })

    const completeToken = resolveCompleteToken(initResult)
    if (!completeToken) {
        throw new Error(i18n.global.t('system.file.getUploadTokenFailed'))
    }

    try {
        if (isUploadCanceled(options)) throw new axios.CanceledError()

        if (!initResult.upload_id) {
            task.status = 'reuse'
            task.progress = 100
            options?.onReuse?.()
            const result = await completeMultipartUpload({
                complete_token: completeToken,
                reuse: true,
                origin_name: task.name,
                size: task.size,
                hash: task.hash,
                mime_type: task.file.type,
                folder_id: options?.folderId,
                driver: options?.driver as StorageDriver,
                parts: [],
            })
            if (isUploadCanceled(options)) throw new axios.CanceledError()
            return result
        }

        const { upload_id, parts: presignedParts = [] } = initResult
        if (!upload_id || presignedParts.length === 0) {
            throw new Error(i18n.global.t('system.file.getUploadTokenFailed'))
        }
        const completedParts: MultipartCompletePart[] = []
        const totalSize = Math.max(task.size, 1)
        let completedBytes = 0
        const inflightLoaded = new Map<number, number>()

        const refreshProgress = () => {
            let inflight = 0
            inflightLoaded.forEach((value) => {
                inflight += value
            })
            const ratio = (completedBytes + inflight) / totalSize
            task.progress = Math.min(99, Math.max(0, Math.round(ratio * 100)))
        }

        const partChunks: { index: number; start: number; end: number }[] = []
        for (let i = 0; i < presignedParts.length; i++) {
            const start = i * chunkSize
            const end = Math.min(start + chunkSize, task.file.size)
            partChunks.push({ index: i, start, end })
        }

        let cursor = 0
        const workers = Array.from({ length: Math.min(PART_CONCURRENCY, partChunks.length) }, async () => {
            while (cursor < partChunks.length) {
                if (options?.signal?.aborted) break
                const chunk = partChunks[cursor]
                cursor += 1
                const presignedPart = presignedParts[chunk.index]
                const blob = task.file!.slice(chunk.start, chunk.end)
                const partSize = chunk.end - chunk.start
                const headers: Record<string, string> = {
                    ...(presignedPart.headers || {}),
                }
                inflightLoaded.set(chunk.index, 0)
                try {
                    const response = await axios.put(presignedPart.upload_url, blob, {
                        headers,
                        signal: options?.signal,
                        onUploadProgress: (event) => {
                            // event.loaded 是已上传字节数；event.total 在分片 PUT 中可能缺失，回退用 partSize
                            const total = event.total && event.total > 0 ? event.total : partSize
                            const loaded = Math.min(event.loaded || 0, total)
                            // 归一化到当前 part 实际字节大小，避免使用 Math.round 引入中途累积误差
                            const normalized = total > 0 ? (loaded / total) * partSize : 0
                            inflightLoaded.set(chunk.index, Math.min(normalized, partSize))
                            refreshProgress()
                        },
                    })
                    const etag = (response.headers?.etag || '').replace(/^"|"$/g, '')
                    completedParts.push({ part_number: presignedPart.part_number, etag })
                    inflightLoaded.delete(chunk.index)
                    completedBytes += partSize
                    refreshProgress()
                } catch (err) {
                    // 失败时清除该 part 的进行中字节，避免重试或终止时进度残留
                    inflightLoaded.delete(chunk.index)
                    refreshProgress()
                    throw err
                }
            }
        })
        await Promise.all(workers)

        if (isUploadCanceled(options)) throw new axios.CanceledError()

        completedParts.sort((a, b) => a.part_number - b.part_number)

        const result = await completeMultipartUpload({
            complete_token: completeToken,
            origin_name: task.name,
            size: task.size,
            hash: task.hash,
            mime_type: task.file.type,
            folder_id: options?.folderId,
            driver: options?.driver as StorageDriver,
            parts: completedParts,
        })
        if (isUploadCanceled(options)) throw new axios.CanceledError()
        task.progress = 100
        task.status = 'success'
        return result
    } catch (error) {
        try {
            let abortRetries = 3
            while (abortRetries > 0) {
                try {
                    await abortMultipartUpload({
                        complete_token: completeToken,
                    })
                    break
                } catch (abortError) {
                    abortRetries--
                    if (abortRetries === 0) {
                        Logger.error('中止分片上传最终失败 (已重试):', abortError)
                    } else {
                        await new Promise((resolve) => setTimeout(resolve, 1000))
                    }
                }
            }
        } catch {
            // 避免 abort 操作内部发生的非预期错误掩盖/吞掉分片上传的原始 error
        }
        throw error
    }
}

function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') return ''
    const record = error as Record<string, unknown>
    const directData = record.data as Record<string, unknown> | undefined
    const response = record.response as Record<string, unknown> | undefined
    const data = response?.data as Record<string, unknown> | undefined
    return String(directData?.message || directData?.msg || data?.msg || data?.message || record.message || '')
}
