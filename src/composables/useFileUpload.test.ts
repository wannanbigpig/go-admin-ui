import { describe, expect, it, vi } from 'vitest'
import { useFileUpload, type UploadTask } from '@/composables/useFileUpload'

const hoisted = vi.hoisted(() => ({
    mockCalculateHash: vi.fn(),
    mockResolveDriver: vi.fn(),
    mockFetchCredentialBatch: vi.fn(),
    mockCompleteBatch: vi.fn(),
    mockFetchStorageConfig: vi.fn(),
}))

vi.mock('@/modules/system/service', () => ({
    calculateSystemFileSha256: hoisted.mockCalculateHash,
    resolveSystemFileUploadDriver: hoisted.mockResolveDriver,
    fetchSystemFileUploadCredentialBatch: hoisted.mockFetchCredentialBatch,
    completeSystemFileUploadBatch: hoisted.mockCompleteBatch,
    fetchStorageConfig: hoisted.mockFetchStorageConfig,
    uploadSystemFile: vi.fn(),
    uploadSystemFiles: vi.fn(),
    initMultipartUpload: vi.fn(),
    completeMultipartUpload: vi.fn(),
    abortMultipartUpload: vi.fn(),
}))

vi.mock('@/utils/logger', () => ({
    Logger: {
        error: vi.fn(),
        warn: vi.fn(),
    },
}))

vi.mock('@/locales', () => ({
    i18n: {
        global: {
            t: (key: string) => key,
        },
    },
}))

describe('composables/useFileUpload.ts', () => {
    it('批量直传 complete 漏项时应将对应任务标记为 error', async () => {
        hoisted.mockFetchStorageConfig.mockResolvedValue({ config: { max_file_size_mb: 0 } })
        hoisted.mockResolveDriver.mockResolvedValue('aliyun_oss')
        hoisted.mockCalculateHash.mockResolvedValueOnce('a'.repeat(64)).mockResolvedValueOnce('b'.repeat(64))
        hoisted.mockFetchCredentialBatch.mockResolvedValue({
            items: [
                {
                    client_id: 'task-1',
                    success: true,
                    data: { complete_token: 'token-a', complete_payload: { complete_token: 'token-a' } },
                },
                {
                    client_id: 'task-2',
                    success: true,
                    data: { complete_token: 'token-b', complete_payload: { complete_token: 'token-b' } },
                },
            ],
        })
        hoisted.mockCompleteBatch.mockResolvedValue({
            items: [{ client_id: 'task-1', success: true, data: { id: 1 } }],
        })

        const { runUploadQueue } = useFileUpload()
        const tasks: UploadTask[] = [
            { id: 'task-1', file: new File(['a'], 'a.txt', { type: 'text/plain' }), name: 'a.txt', size: 1, progress: 0, status: 'pending' as const },
            { id: 'task-2', file: new File(['b'], 'b.txt', { type: 'text/plain' }), name: 'b.txt', size: 1, progress: 0, status: 'pending' as const },
        ]

        await runUploadQueue(tasks)

        expect(tasks[0].status).toBe('success')
        expect(tasks[1].status).toBe('error')
        expect(tasks[1].error).toBe('system.file.completeUploadRegistrationFailed')
        expect(tasks[0].file).toBeNull()
        expect(tasks[1].file).toBeNull()
    })

    it('runUploadQueue 批量上传时，fetchStorageConfig 调用次数不超过 1 次', async () => {
        hoisted.mockFetchStorageConfig.mockClear()
        hoisted.mockFetchStorageConfig.mockResolvedValue({ config: { max_file_size_mb: 10 } })
        
        const { uploadSystemFile: mockUploadSystemFile } = await import('@/modules/system/service')
        vi.mocked(mockUploadSystemFile).mockResolvedValue({ id: 1 } as any)
        
        hoisted.mockCalculateHash.mockResolvedValue('hash-code')
        
        const { runUploadQueue } = useFileUpload()
        const tasks: UploadTask[] = [
            { id: 'task-1', file: new File(['a'], 'a.txt', { type: 'text/plain' }), name: 'a.txt', size: 1, progress: 0, status: 'pending' as const },
            { id: 'task-2', file: new File(['b'], 'b.txt', { type: 'text/plain' }), name: 'b.txt', size: 1, progress: 0, status: 'pending' as const },
        ]

        await runUploadQueue(tasks, { enableMultipart: true })
        
        expect(hoisted.mockFetchStorageConfig).toHaveBeenCalledTimes(1)
    })

    it('clearTasks 应取消进行中的 axios 请求', async () => {
        hoisted.mockFetchStorageConfig.mockResolvedValue({ config: { max_file_size_mb: 10 } })
        
        const { uploadSystemFile: mockUploadSystemFile } = await import('@/modules/system/service')
        
        let capturedSignal: AbortSignal | undefined
        vi.mocked(mockUploadSystemFile).mockImplementation(async (file, options) => {
            capturedSignal = (options as any)?.signal
            return new Promise((resolve) => setTimeout(resolve, 1000))
        })
        
        const { runUploadQueue, clearTasks } = useFileUpload()
        const tasks: UploadTask[] = [
            { id: 'task-1', file: new File(['a'], 'a.txt', { type: 'text/plain' }), name: 'a.txt', size: 1, progress: 0, status: 'pending' as const }
        ]
        
        const uploadPromise = runUploadQueue(tasks, { enableMultipart: true })
        
        await new Promise((resolve) => setTimeout(resolve, 10))
        
        expect(capturedSignal).toBeDefined()
        expect(capturedSignal?.aborted).toBe(false)
        
        clearTasks()
        
        expect(capturedSignal?.aborted).toBe(true)
        
        try {
            await uploadPromise
        } catch {}
    })

    it('retry 时 uploadOneTask 应使用 task 自身固化的 uploadOptions', async () => {
        const { uploadSystemFile: mockUploadSystemFile } = await import('@/modules/system/service')
        vi.mocked(mockUploadSystemFile).mockClear()

        const { uploadOneTask } = useFileUpload()
        
        const task: UploadTask = {
            id: 'task-1',
            file: new File(['a'], 'a.txt', { type: 'text/plain' }),
            name: 'a.txt',
            size: 1,
            progress: 0,
            status: 'error' as const,
            uploadOptions: { folderId: 101, enableMultipart: true }
        }

        await uploadOneTask(task, task.uploadOptions)

        expect(vi.mocked(mockUploadSystemFile)).toHaveBeenCalledWith(
            expect.any(File),
            expect.objectContaining({
                folder_id: 101
            })
        )
    })
})
