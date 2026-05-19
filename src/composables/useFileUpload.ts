import { computed, ref } from 'vue'
import axios from 'axios'
import { calculateSystemFileSha256, uploadSystemFile, initMultipartUpload, completeMultipartUpload, abortMultipartUpload } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { MultipartInitResult, MultipartCompletePart, StorageDriver } from '@/types/system'

export interface UploadOptions {
    folderId?: number | string | null
    driver?: string
    enableMultipart?: boolean
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

    const uploadOneTask = async (task: UploadTask, options?: UploadOptions) => {
        task.error = ''
        const targetFolderId = task.folderId ?? options?.folderId
        try {
            task.status = 'hashing'
            task.progress = 0
            task.hash = await calculateSystemFileSha256(task.file)
            task.status = 'uploading'
            if (options?.enableMultipart && task.file.size > MULTIPART_THRESHOLD) {
                const result = await uploadMultipart(task, {
                    ...options,
                    folderId: targetFolderId,
                })
                if (result) {
                    task.result = result
                    options?.onResult?.(result)
                }
            } else {
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
        } catch (error) {
            task.status = 'error'
            task.error = getErrorMessage(error)
            Logger.error('上传文件资源失败:', error)
        }
    }

    const runUploadQueue = async (tasks: UploadTask[], options?: UploadOptions) => {
        let cursor = 0
        const workers = Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, tasks.length) }, async () => {
            while (cursor < tasks.length) {
                const task = tasks[cursor]
                cursor += 1
                await uploadOneTask(task, options)
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
    let uploadedParts = 0

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
                const headers: Record<string, string> = {
                    ...(presignedPart.headers || {}),
                }
                const response = await axios.put(presignedPart.upload_url, blob, {
                    headers,
                    onUploadProgress: () => {
                        const baseProgress = (uploadedParts / presignedParts.length) * 100
                        task.progress = Math.min(99, Math.max(0, Math.round(baseProgress)))
                    },
                })
                const etag = (response.headers?.etag || '').replace(/^"|"$/g, '')
                completedParts.push({ part_number: presignedPart.part_number, etag })
                uploadedParts += 1
                task.progress = Math.min(99, Math.round((uploadedParts / presignedParts.length) * 100))
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
            await abortMultipartUpload({
                upload_id,
                bucket,
                object_key,
                driver: options?.driver as StorageDriver,
            })
        } catch (abortError) {
            Logger.error('中止分片上传失败:', abortError)
        }
        throw error
    }
}

function getErrorMessage(error: unknown): string {
    if (!error || typeof error !== 'object') return ''
    const record = error as Record<string, unknown>
    const response = record.response as Record<string, unknown> | undefined
    const data = response?.data as Record<string, unknown> | undefined
    return String(data?.msg || data?.message || record.message || '')
}
