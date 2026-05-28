import { computed, ref } from 'vue'
import axios from 'axios'
import {
    calculateSystemFileSha256,
    resolveSystemFileUploadDriver,
    uploadSystemFile,
    uploadSystemFiles,
    fetchSystemFileUploadCredentialBatchStream,
    completeSystemFileUploadBatchStream,
    initMultipartUpload,
    completeMultipartUpload,
    abortMultipartUpload,
    fetchStorageConfig,
} from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { MultipartInitResult, MultipartCompletePart, StorageDriver, SystemFileUploadCredential, SystemFileUploadCompleteBatchItemPayload } from '@/types/system'
export type { StorageDriver } from '@/types/system'

import { i18n } from '@/locales'

export interface UploadOptions {
    folderId?: number | string | null
    driver?: string
    enableMultipart?: boolean
    signal?: AbortSignal
    onReuse?: () => void
    onResult?: (result: unknown) => void
}

export type UploadTaskStatus = 'hashing' | 'pending' | 'uploading' | 'reuse' | 'success' | 'error'

export interface UploadTask {
    id: string
    file: File
    name: string
    size: number
    folderId?: number | string | null
    progress: number
    status: UploadTaskStatus
    hash?: string
    error?: string
    result?: unknown
}

const MAX_PARALLEL_UPLOADS = 5
const MULTIPART_THRESHOLD = 20 * 1024 * 1024
const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024
const PART_CONCURRENCY = 3

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

function getTaskTargetFolderId(task: UploadTask, options?: UploadOptions) {
    return task.folderId ?? options?.folderId
}

function isSameTaskFolder(tasks: UploadTask[], options?: UploadOptions) {
    if (tasks.length === 0) return false
    const firstFolderId = getTaskTargetFolderId(tasks[0], options)
    return tasks.every((task) => getTaskTargetFolderId(task, options) === firstFolderId)
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

export function useFileUpload() {
    const uploadTasks = ref<UploadTask[]>([])

    const uploading = computed(() => uploadTasks.value.some((task) => task.status === 'hashing' || task.status === 'pending' || task.status === 'uploading'))
    const uploadFinishedCount = computed(() => uploadTasks.value.filter((task) => task.status === 'reuse' || task.status === 'success' || task.status === 'error').length)
    const uploadFinished = computed(() => uploadTasks.value.length > 0 && uploadFinishedCount.value === uploadTasks.value.length)

    const createUploadTask = (file: File, overrides?: { name?: string; folderId?: number | string | null }): UploadTask => ({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        name: overrides?.name || file.name,
        size: file.size,
        folderId: overrides?.folderId,
        progress: 0,
        status: 'pending',
    })

    const isLocalStorageMultipartUnsupportedError = (error: unknown): boolean => {
        if (!error || typeof error !== 'object') return false
        const record = error as Record<string, unknown>
        if (record.code === 11011) {
            return true
        }
        const response = record.response as Record<string, unknown> | undefined
        const data = response?.data as Record<string, unknown> | undefined
        if (data?.code === 11011) {
            return true
        }
        return false
    }

    const uploadOneTask = async (rawTask: UploadTask, options?: UploadOptions) => {
        const task = uploadTasks.value.find((item) => item.id === rawTask.id) || rawTask
        task.error = ''
        const targetFolderId = task.folderId ?? options?.folderId

        const doNormalUpload = async () => {
            let reused = false
            const result = await uploadSystemFile(task.file, {
                folder_id: targetFolderId,
                driver: options?.driver,
                hash: task.hash,
                onProgress: (percent) => {
                    task.progress = Math.min(99, Math.max(0, percent))
                },
                onReuse: () => {
                    reused = true
                    task.status = 'reuse'
                    task.progress = 100
                    options?.onReuse?.()
                },
            })
            task.progress = 100
            task.status = reused ? 'reuse' : 'success'
            if (result) {
                task.result = result
                options?.onResult?.(result)
            }
        }

        try {
            const storageConfig = await fetchStorageConfig()
            const maxBytes = (storageConfig?.config?.max_file_size_mb || 0) * 1024 * 1024
            if (maxBytes > 0 && task.file.size > maxBytes) {
                task.status = 'error'
                task.progress = 0
                task.error = i18n.global.t('system.file.sizeExceedsLimit', { size: storageConfig.config.max_file_size_mb })
                return
            }

            task.status = 'hashing'
            task.progress = 0
            task.hash = await calculateSystemFileSha256(task.file, (progress) => {
                task.progress = progress
            })
            task.status = 'uploading'
            if (options?.enableMultipart && task.file.size > MULTIPART_THRESHOLD) {
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
            task.status = 'error'
            task.error = getErrorMessage(error)
            Logger.error('上传文件资源失败:', error)
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
                tasks.map((task) => task.file),
                {
                    folder_id: getTaskTargetFolderId(tasks[0], options),
                    driver: resolvedDriver,
                    onProgress: (percent) => {
                        tasks.forEach((task) => {
                            if (task.status === 'uploading') {
                                task.progress = Math.min(99, Math.max(0, percent))
                            }
                        })
                    },
                }
            )

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
                        task = unassignedTasks.find((candidate) => candidate.file.name === failureName || candidate.name === failureName)
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
            task.error = ''
            task.result = undefined
            task.progress = 0
            task.status = 'hashing'
            task.hash = await calculateSystemFileSha256(task.file, (progress) => {
                task.progress = progress
            })
            task.status = 'uploading'
        }

        try {
            const taskById = new Map<string, UploadTask>()
            for (const task of tasks) {
                taskById.set(task.id, task)
            }
            const credentialResult = await fetchSystemFileUploadCredentialBatchStream(
                {
                    driver: resolvedDriver,
                    items: tasks.map((task) => ({
                        client_id: task.id,
                        folder_id: getTaskTargetFolderId(task, options),
                        origin_name: task.file.name,
                        size: task.file.size,
                        mime_type: task.file.type || 'application/octet-stream',
                        hash: task.hash!,
                    })),
                },
                (progress) => {
                    if (!progress.client_id) return
                    const task = taskById.get(progress.client_id)
                    if (!task || task.status !== 'uploading') return
                    if (task.progress < 10) {
                        task.progress = 10
                    }
                },
                options?.signal
            )

            const completeItems: SystemFileUploadCompleteBatchItemPayload[] = []
            const reuseClientIds = new Set<string>()
            const pendingUploads: Array<{ task: UploadTask; file: File; credential: SystemFileUploadCredential }> = []

            for (const item of credentialResult.items || []) {
                const task = tasks.find((current) => current.id === item.client_id)
                if (!task) continue
                if (!item.success || !item.data) {
                    task.status = 'error'
                    task.progress = 0
                    task.error = item.error?.message || i18n.global.t('system.file.getUploadTokenFailed')
                    continue
                }

                const credential = item.data
                const uploadMeta = {
                    hash: task.hash,
                    origin_name: task.file.name,
                    size: task.file.size,
                    mime_type: task.file.type || 'application/octet-stream',
                    folder_id: getTaskTargetFolderId(task, options),
                }

                if (credential.reuse) {
                    reuseClientIds.add(task.id)
                    options?.onReuse?.()
                    completeItems.push({
                        client_id: task.id,
                        ...(credential.complete_payload || {}),
                        reuse: true,
                        file_object_id: credential.file_object_id,
                        upload_id: credential.upload_id,
                        file_id: credential.file_id,
                        uuid: credential.uuid,
                        bucket: credential.bucket,
                        object_key: credential.object_key,
                        driver: credential.driver || resolvedDriver,
                        ...uploadMeta,
                    })
                    continue
                }

                if (credential.upload_url) {
                    pendingUploads.push({ task, file: task.file, credential })
                }

                completeItems.push({
                    client_id: task.id,
                    ...(credential.complete_payload || {}),
                    reuse: false,
                    file_object_id: credential.file_object_id,
                    upload_id: credential.upload_id,
                    file_id: credential.file_id,
                    uuid: credential.uuid,
                    bucket: credential.bucket,
                    object_key: credential.object_key,
                    driver: credential.driver || resolvedDriver,
                    ...uploadMeta,
                })
            }

            if (pendingUploads.length > 0) {
                let cursor = 0
                const workers = Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, pendingUploads.length) }, async () => {
                    while (cursor < pendingUploads.length) {
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

            const validCompleteItems = completeItems.filter((item) => {
                const cid = item.client_id
                if (!cid) return true
                const task = taskById.get(cid)
                return !task || task.status !== 'error'
            })
            if (validCompleteItems.length === 0) {
                return true
            }

            const completeResult = await completeSystemFileUploadBatchStream(
                {
                    driver: resolvedDriver,
                    items: validCompleteItems,
                },
                (progress) => {
                    if (!progress.client_id) return
                    const task = taskById.get(progress.client_id)
                    if (!task) return
                    if (task.status === 'success' || task.status === 'reuse' || task.status === 'error') return
                    // 完成登记阶段每完成一项，即将切到最终状态，把进度推到 99%（complete 后会置 100%）。
                    if (task.progress < 99) {
                        task.progress = 99
                    }
                }
            )

            for (const item of completeResult.items || []) {
                const task = tasks.find((current) => current.id === item.client_id)
                if (!task) continue
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

            return true
        } catch (error) {
            tasks.forEach((task) => {
                if (task.status === 'success' || task.status === 'reuse') return
                task.status = 'error'
                task.progress = 0
                task.error = getErrorMessage(error)
            })
            Logger.error('批量直传文件资源失败:', error)
            return true
        }
    }

    const runUploadQueue = async (tasks: UploadTask[], options?: UploadOptions) => {
        const reactiveTasks = tasks.map((t) => uploadTasks.value.find((item) => item.id === t.id) || t)

        let validTasks = reactiveTasks
        try {
            const storageConfig = await fetchStorageConfig()
            const maxBytes = (storageConfig?.config?.max_file_size_mb || 0) * 1024 * 1024

            validTasks = []
            for (const task of reactiveTasks) {
                if (maxBytes > 0 && task.file.size > maxBytes) {
                    task.status = 'error'
                    task.progress = 0
                    task.error = i18n.global.t('system.file.sizeExceedsLimit', { size: storageConfig.config.max_file_size_mb })
                } else {
                    validTasks.push(task)
                }
            }
        } catch (error) {
            Logger.error('获取存储配置以校验文件大小限制失败:', error)
            validTasks = reactiveTasks
        }

        if (validTasks.length === 0) return

        if (await runLocalBatchUpload(validTasks, options)) {
            return
        }
        if (await runDirectBatchUpload(validTasks, options)) {
            return
        }
        let cursor = 0
        const workers = Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, validTasks.length) }, async () => {
            while (cursor < validTasks.length) {
                const task = validTasks[cursor]
                cursor += 1
                try {
                    await uploadOneTask(task, options)
                } catch {
                    task.status = 'error'
                    if (!task.error) task.error = 'Upload failed'
                }
            }
        })
        await Promise.all(workers)
    }

    const clearTasks = () => {
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
    const chunkSize = DEFAULT_CHUNK_SIZE
    const partCount = Math.ceil(task.file.size / chunkSize)

    const initResult: MultipartInitResult = await initMultipartUpload({
        hash: task.hash!,
        origin_name: task.file.name,
        size: task.file.size,
        mime_type: task.file.type || 'application/octet-stream',
        folder_id: options?.folderId,
        driver: options?.driver as StorageDriver,
        chunk_size: chunkSize,
        part_count: partCount,
    })

    if (!initResult.upload_id) {
        task.status = 'reuse'
        task.progress = 100
        options?.onReuse?.()
        return await completeMultipartUpload({
            upload_id: '',
            bucket: initResult.bucket,
            object_key: initResult.object_key,
            origin_name: task.file.name,
            size: task.file.size,
            hash: task.hash,
            mime_type: task.file.type,
            folder_id: options?.folderId,
            driver: options?.driver as StorageDriver,
            parts: [],
        })
    }

    const { upload_id, bucket, object_key, parts: presignedParts } = initResult
    const completedParts: MultipartCompletePart[] = []
    const totalSize = Math.max(task.file.size, 1)
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

    try {
        const partChunks: { index: number; start: number; end: number }[] = []
        for (let i = 0; i < presignedParts.length; i++) {
            const start = i * chunkSize
            const end = Math.min(start + chunkSize, task.file.size)
            partChunks.push({ index: i, start, end })
        }

        let cursor = 0
        const workers = Array.from({ length: Math.min(PART_CONCURRENCY, partChunks.length) }, async () => {
            while (cursor < partChunks.length) {
                const chunk = partChunks[cursor]
                cursor += 1
                const presignedPart = presignedParts[chunk.index]
                const blob = task.file.slice(chunk.start, chunk.end)
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

        completedParts.sort((a, b) => a.part_number - b.part_number)

        const result = await completeMultipartUpload({
            upload_id,
            bucket,
            object_key,
            origin_name: task.file.name,
            size: task.file.size,
            hash: task.hash,
            mime_type: task.file.type,
            folder_id: options?.folderId,
            driver: options?.driver as StorageDriver,
            parts: completedParts,
        })
        task.progress = 100
        task.status = 'success'
        return result
    } catch (error) {
        try {
            let abortRetries = 3
            while (abortRetries > 0) {
                try {
                    await abortMultipartUpload({
                        upload_id,
                        bucket,
                        object_key,
                        driver: options?.driver as StorageDriver,
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
