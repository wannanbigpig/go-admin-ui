import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { buildFolderIndexKey, isSameUploadTaskBatch, useFileUploadFlow } from './useFileUploadFlow'
import type { UploadTask } from '@/composables/useFileUpload'

const mocks = vi.hoisted(() => ({ addFolder: vi.fn(), runQueue: vi.fn(), retryOne: vi.fn() }))
vi.mock('@/modules/system/service', () => ({ addSystemFileFolder: mocks.addFolder }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))
vi.mock('@/composables/useFileUpload', async () => {
    const { ref } = await import('vue')
    return {
        useFileUpload: () => {
            const uploadTasks = ref<UploadTask[]>([])
            let nextId = 0
            return {
                uploadTasks,
                uploading: ref(false),
                uploadFinishedCount: ref(0),
                uploadFinished: ref(false),
                createUploadTask: (file: File, overrides: { name?: string; uploadOptions?: unknown }) => ({
                    id: String(++nextId), file, name: overrides.name || file.name, status: 'pending', progress: 0,
                    size: file.size, uploadOptions: overrides.uploadOptions,
                } as UploadTask),
                uploadOneTask: mocks.retryOne,
                runUploadQueue: mocks.runQueue,
                clearTasks: vi.fn(),
            }
        },
    }
})

describe('views/system/composables/useFileUploadFlow.ts', () => {
    it.each(['folder', 'upload'])('blocks another retry and new files while retry awaits %s', async (stage) => {
        mocks.addFolder.mockReset().mockRejectedValue(new Error('folder unavailable'))
        mocks.runQueue.mockReset().mockResolvedValue(undefined)
        mocks.retryOne.mockReset().mockResolvedValue(undefined)
        const loadFolderTree = vi.fn().mockResolvedValue(undefined)
        let flow!: ReturnType<typeof useFileUploadFlow>
        const host = mount(defineComponent({
            setup() {
                flow = useFileUploadFlow({ selectedFolderId: ref(null), folderTree: ref([]), getList: vi.fn(), loadFolderTree })
                return () => h('div')
            },
        }))
        try {
            const file = new File(['one'], 'one.txt')
            if (stage === 'folder') {
                Object.defineProperty(file, 'webkitRelativePath', { value: 'broken/one.txt' })
                await flow.handleDirectoryInputChange({ target: { files: [file], value: '' } } as unknown as Event)
            } else {
                flow.uploadTasks.value = [{ id: 'retry', file, name: file.name, size: file.size, progress: 0, status: 'error' }]
            }
            const task = flow.uploadTasks.value[0]
            expect(task.status).toBe('error')
            let release!: () => void
            const pendingOperation = new Promise<void>((resolve) => { release = resolve })
            if (stage === 'folder') {
                loadFolderTree.mockReturnValueOnce(pendingOperation)
                mocks.addFolder.mockResolvedValue({ id: 1, name: 'broken', parent_id: 0 })
            } else mocks.retryOne.mockReturnValueOnce(pendingOperation)
            loadFolderTree.mockClear()
            const pendingRetry = flow.retryUploadTask(task)
            await flushPromises()
            await flow.retryUploadTask(task)
            await flow.handleFileInputChange({ target: { files: [new File(['two'], 'two.txt')], value: '' } } as unknown as Event)
            expect(flow.uploadTasks.value[0].id).toBe(task.id)
            expect(mocks.runQueue).not.toHaveBeenCalled()
            if (stage === 'folder') expect(loadFolderTree).toHaveBeenCalledTimes(1)
            else expect(mocks.retryOne).toHaveBeenCalledTimes(1)
            release()
            await pendingRetry
        } finally {
            host.unmount()
        }
    })

    it('treats root parent_id values consistently when building folder index keys', () => {
        expect(buildFolderIndexKey(null, 'docs')).toBe(buildFolderIndexKey(0, 'docs'))
        expect(buildFolderIndexKey(undefined, 'docs')).toBe(buildFolderIndexKey('0', 'docs'))
    })

    it('keeps non-root parent_id values distinct', () => {
        expect(buildFolderIndexKey(1, 'docs')).not.toBe(buildFolderIndexKey(null, 'docs'))
        expect(buildFolderIndexKey('1', 'docs')).toBe('1::docs')
    })

    it('uses task ids instead of array identity to recognize the active upload batch', () => {
        const task = { id: 'task-1' } as UploadTask
        const reactiveEquivalent = [{ ...task }] as UploadTask[]

        expect(isSameUploadTaskBatch(reactiveEquivalent, [task])).toBe(true)
        expect(isSameUploadTaskBatch([{ ...task, id: 'task-2' }], [task])).toBe(false)
    })

    it('uploads files in valid folders and keeps failed folder files retryable', async () => {
        mocks.addFolder.mockReset().mockImplementation(async ({ name }: { name: string }) => {
            if (name === 'broken') throw new Error('folder rejected')
            return { id: name === 'batch' ? 1 : 2, name, parent_id: name === 'batch' ? 0 : 1 }
        })
        mocks.runQueue.mockReset().mockImplementation(async (tasks: UploadTask[]) => {
            tasks.forEach((task) => { task.status = 'success' })
        })
        mocks.retryOne.mockReset().mockImplementation(async (task: UploadTask) => { task.status = 'success' })

        const folderTree = ref([])
        const getList = vi.fn().mockResolvedValue(undefined)
        const loadFolderTree = vi.fn().mockResolvedValue(undefined)
        let flow!: ReturnType<typeof useFileUploadFlow>
        const host = mount(defineComponent({
            setup() {
                flow = useFileUploadFlow({ selectedFolderId: ref(null), folderTree, getList, loadFolderTree })
                return () => h('div')
            },
        }))
        const broken = new File(['one'], 'one.txt')
        const good = new File(['two'], 'two.txt')
        Object.defineProperty(broken, 'webkitRelativePath', { value: 'batch/broken/one.txt' })
        Object.defineProperty(good, 'webkitRelativePath', { value: 'batch/good/two.txt' })
        await flow.handleDirectoryInputChange({ target: { files: [broken, good], value: 'selected' } } as unknown as Event)

        expect(mocks.runQueue).toHaveBeenCalledWith([expect.objectContaining({ name: 'two.txt', folderId: 2 })], expect.anything())
        const failed = flow.uploadTasks.value.find((task) => task.name === 'one.txt')!
        expect(failed.status).toBe('error')
        expect(failed.error).toBe('system.file.uploadFolderFailed')
        expect(getList).toHaveBeenCalledTimes(1)

        mocks.addFolder.mockImplementation(async ({ name }: { name: string }) => ({ id: name === 'broken' ? 3 : 1, name, parent_id: name === 'batch' ? 0 : 1 }))
        await flow.retryUploadTask(failed)
        expect(failed.folderId).toBe(3)
        expect(mocks.retryOne).toHaveBeenCalledWith(failed, failed.uploadOptions)
        host.unmount()
    })

    it('bounds folder creation requests for large directory uploads', async () => {
        let active = 0
        let peak = 0
        let nextFolderId = 1
        mocks.addFolder.mockReset().mockImplementation(async ({ name }: { name: string }) => {
            active += 1
            peak = Math.max(peak, active)
            await new Promise((resolve) => setTimeout(resolve, 1))
            active -= 1
            return { id: nextFolderId++, name, parent_id: name === 'batch' ? 0 : 1 }
        })
        mocks.runQueue.mockReset().mockImplementation(async (tasks: UploadTask[]) => {
            tasks.forEach((task) => { task.status = 'success' })
        })
        let flow!: ReturnType<typeof useFileUploadFlow>
        const host = mount(defineComponent({
            setup() {
                flow = useFileUploadFlow({ selectedFolderId: ref(null), folderTree: ref([]), getList: vi.fn(), loadFolderTree: vi.fn() })
                return () => h('div')
            },
        }))
        const files = Array.from({ length: 8 }, (_, index) => {
            const file = new File(['x'], `${index}.txt`)
            Object.defineProperty(file, 'webkitRelativePath', { value: `batch/folder-${index}/${index}.txt` })
            return file
        })
        await flow.handleDirectoryInputChange({ target: { files, value: 'selected' } } as unknown as Event)
        expect(peak).toBeLessThanOrEqual(5)
        expect(mocks.runQueue.mock.calls[0][0]).toHaveLength(8)
        host.unmount()
    })
})
