import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useFileUpload, type UploadTask } from '@/composables/useFileUpload'
import { addSystemFileFolder } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import { ROOT_FOLDER_KEY, type FolderTreeNode } from './useFileFolder'

export interface UseFileUploadFlowOptions {
    selectedFolderId: Ref<number | string | null>
    folderTree: Ref<FolderTreeNode[]>
    getList: () => Promise<void>
    loadFolderTree: () => Promise<void>
}

const normalizeFolderIndexParentId = (parentId: number | string | null | undefined) => {
    if (parentId === null || parentId === undefined || parentId === 0 || parentId === '0' || parentId === ROOT_FOLDER_KEY) {
        return null
    }
    return parentId
}

export const buildFolderIndexKey = (parentId: number | string | null | undefined, name: string) => `${String(normalizeFolderIndexParentId(parentId) ?? ROOT_FOLDER_KEY)}::${name}`

export const isSameUploadTaskBatch = (currentTasks: UploadTask[], expectedTasks: UploadTask[]) =>
    currentTasks.length === expectedTasks.length && expectedTasks.every((task, index) => currentTasks[index]?.id === task.id)

const MAX_PARALLEL_FOLDER_CREATES = 5

const isExternalFileDragEvent = (event?: DragEvent) => {
    const types = Array.from(event?.dataTransfer?.types || [])
    return types.includes('Files')
}

export function useFileUploadFlow(options: UseFileUploadFlowOptions) {
    const { t } = useI18n()
    const uploadInputRef = ref<HTMLInputElement>()
    const uploadDirectoryInputRef = ref<HTMLInputElement>()
    const isDraggingUpload = ref(false)
    const uploadQueueExpanded = ref(false)
    const preparingDirectory = ref(false)
    const retryingUpload = ref(false)
    const folderPathsByTaskId = new Map<string, string>()

    const { uploadTasks, uploading, uploadFinishedCount, uploadFinished, createUploadTask, uploadOneTask, runUploadQueue, clearTasks } = useFileUpload()

    const uploadBusy = () => uploading.value || preparingDirectory.value || retryingUpload.value
    const rejectConcurrentUpload = () => {
        if (!uploadBusy()) return false
        ElMessage.warning(t('system.file.uploadInProgress'))
        return true
    }

    const preventUnloadDuringUpload = (event: BeforeUnloadEvent) => {
        if (!uploadBusy()) return
        event.preventDefault()
        event.returnValue = ''
    }
    onMounted(() => window.addEventListener('beforeunload', preventUnloadDuringUpload))
    onBeforeUnmount(() => window.removeEventListener('beforeunload', preventUnloadDuringUpload))

    const toggleUploadQueueExpanded = () => {
        uploadQueueExpanded.value = !uploadQueueExpanded.value
    }

    const showUploadSummary = (tasks: UploadTask[]) => {
        const success = tasks.filter((t) => t.status === 'success' || t.status === 'reuse').length
        const failed = tasks.filter((t) => t.status === 'error').length
        const total = tasks.length

        if (failed === 0) {
            ElMessage.success(t('system.file.uploadSummaryAllSuccess', { total }))
        } else if (success === 0) {
            ElMessage.error(t('system.file.uploadSummaryAllFailed', { total }))
        } else {
            ElMessage.warning(t('system.file.uploadSummary', { success, failed }))
        }
    }

    const openUploadPicker = () => uploadInputRef.value?.click()
    const openUploadDirectoryPicker = () => uploadDirectoryInputRef.value?.click()

    const isCurrentTaskBatch = (tasks: UploadTask[]) => isSameUploadTaskBatch(uploadTasks.value, tasks)

    const uploadFilesInQueue = async (files: File[]) => {
        if (files.length === 0) return
        if (rejectConcurrentUpload()) return
        folderPathsByTaskId.clear()
        const uploadOptions = { folderId: options.selectedFolderId.value, enableMultipart: true }
        const currentTasks = files.map((file) => createUploadTask(file, { uploadOptions }))
        uploadTasks.value = currentTasks
        uploadQueueExpanded.value = false
        await runUploadQueue(uploadTasks.value, uploadOptions)
        if (!isCurrentTaskBatch(currentTasks)) return
        showUploadSummary(currentTasks)
        if (currentTasks.some((task) => task.status === 'success' || task.status === 'reuse')) {
            await options.getList()
        }
        if (currentTasks.every((task) => task.status === 'success' || task.status === 'reuse')) {
            window.setTimeout(() => {
                if (isCurrentTaskBatch(currentTasks) && !uploading.value) clearTasks()
            }, 1200)
        }
    }

    const retryUploadTask = async (task: UploadTask) => {
        if (task.status !== 'error') return
        if (rejectConcurrentUpload()) return
        retryingUpload.value = true
        try {
            const relativeFolderPath = folderPathsByTaskId.get(task.id)
            if (relativeFolderPath && task.folderId === undefined) {
                try {
                    await options.loadFolderTree()
                    task.folderId = await ensureFolderPathExists(
                        relativeFolderPath,
                        task.uploadOptions?.folderId ?? null,
                        buildFolderIndex(options.folderTree.value as FolderTreeNode[]),
                        new Map([['', task.uploadOptions?.folderId ?? null]]),
                        new Map()
                    )
                } catch (error) {
                    task.error = t('system.file.uploadFolderFailed')
                    Logger.error('重试创建上传目录失败:', error)
                    return
                }
            }
            await uploadOneTask(task, task.uploadOptions)
            const currentTask = uploadTasks.value.find((item) => item.id === task.id)
            if (!currentTask) return
            if (currentTask.status === 'success' || currentTask.status === 'reuse') await options.getList()
            if (uploadTasks.value.length > 0 && uploadTasks.value.every((item) => item.status === 'success' || item.status === 'reuse')) {
                showUploadSummary(uploadTasks.value)
                const snapshot = uploadTasks.value
                window.setTimeout(() => {
                    if (uploadTasks.value === snapshot && !uploading.value) clearTasks()
                }, 1200)
            }
        } finally {
            retryingUpload.value = false
        }
    }

    const buildFolderIndex = (folders: FolderTreeNode[]) => {
        const index = new Map<string, FolderTreeNode>()
        const walk = (nodes: FolderTreeNode[]) => {
            for (const node of nodes) {
                index.set(buildFolderIndexKey(node.parent_id ?? null, node.name), node)
                if (Array.isArray(node.children) && node.children.length) {
                    walk(node.children as FolderTreeNode[])
                }
            }
        }
        walk(folders)
        return index
    }

    const extractRelativeFolderPath = (file: File) => {
        const relativePath = typeof (file as File & { webkitRelativePath?: string }).webkitRelativePath === 'string' ? String((file as File & { webkitRelativePath?: string }).webkitRelativePath) : ''
        if (!relativePath.includes('/')) return ''
        return relativePath.split('/').slice(0, -1).join('/')
    }

    const ensureFolderPathExists = async (
        relativeFolderPath: string,
        baseFolderId: number | string | null,
        folderIndex: Map<string, FolderTreeNode>,
        createdPathIds: Map<string, number | string | null>,
        pendingPathIds: Map<string, Promise<number | string | null>>
    ) => {
        if (!relativeFolderPath) return baseFolderId
        if (createdPathIds.has(relativeFolderPath)) {
            return createdPathIds.get(relativeFolderPath) ?? baseFolderId
        }

        const segments = relativeFolderPath.split('/').filter(Boolean)
        let currentParentId = baseFolderId
        let currentPath = ''

        for (const segment of segments) {
            currentPath = currentPath ? `${currentPath}/${segment}` : segment
            if (createdPathIds.has(currentPath)) {
                currentParentId = createdPathIds.get(currentPath) ?? currentParentId
                continue
            }
            const pendingPathId = pendingPathIds.get(currentPath)
            if (pendingPathId) {
                currentParentId = (await pendingPathId) ?? currentParentId
                continue
            }

            const folderKey = buildFolderIndexKey(currentParentId, segment)
            let targetFolder = folderIndex.get(folderKey)
            if (!targetFolder) {
                const createFolderPromise = (async () => {
                    try {
                        const createdFolder = (await addSystemFileFolder({
                            name: segment,
                            parent_id: currentParentId,
                        })) as FolderTreeNode
                        targetFolder = {
                            ...createdFolder,
                            children: Array.isArray(createdFolder.children) ? createdFolder.children : [],
                        }
                    } catch (error) {
                        await options.loadFolderTree()
                        folderIndex.clear()
                        for (const [key, value] of buildFolderIndex(options.folderTree.value as FolderTreeNode[])) {
                            folderIndex.set(key, value)
                        }
                        targetFolder = folderIndex.get(folderKey)
                        if (!targetFolder) {
                            throw error
                        }
                    } finally {
                        pendingPathIds.delete(currentPath)
                    }

                    folderIndex.set(folderKey, targetFolder)
                    createdPathIds.set(currentPath, targetFolder.id)
                    return targetFolder.id
                })()
                pendingPathIds.set(currentPath, createFolderPromise)
                currentParentId = (await createFolderPromise) ?? currentParentId
                continue
            }

            currentParentId = targetFolder.id
            createdPathIds.set(currentPath, currentParentId)
        }

        return currentParentId
    }

    const uploadDirectoryInQueue = async (files: File[]) => {
        if (files.length === 0) return
        if (rejectConcurrentUpload()) return
        preparingDirectory.value = true

        try {
            const baseFolderId = options.selectedFolderId.value
            await options.loadFolderTree()
            const folderIndex = buildFolderIndex(options.folderTree.value as FolderTreeNode[])
            const createdPathIds = new Map<string, number | string | null>([['', baseFolderId]])
            const pendingPathIds = new Map<string, Promise<number | string | null>>()
            const uploadOptions = { folderId: baseFolderId, enableMultipart: true }
            const currentTasks = files.map((file) => createUploadTask(file, { name: file.name, uploadOptions }))
            folderPathsByTaskId.clear()
            currentTasks.forEach((task, index) => folderPathsByTaskId.set(task.id, extractRelativeFolderPath(files[index])))
            uploadTasks.value = currentTasks
            uploadQueueExpanded.value = false

            const relativeFolderPaths = Array.from(new Set(files.map(extractRelativeFolderPath).filter(Boolean))).sort((left, right) => left.split('/').length - right.split('/').length)
            const byDepth = new Map<number, string[]>()
            for (const path of relativeFolderPaths) {
                const depth = path.split('/').length
                if (!byDepth.has(depth)) byDepth.set(depth, [])
                byDepth.get(depth)!.push(path)
            }
            for (const paths of [...byDepth.values()].sort((a, b) => a[0].split('/').length - b[0].split('/').length)) {
                for (let offset = 0; offset < paths.length; offset += MAX_PARALLEL_FOLDER_CREATES) {
                    const batch = paths.slice(offset, offset + MAX_PARALLEL_FOLDER_CREATES)
                    const results = await Promise.allSettled(batch.map((path) => ensureFolderPathExists(path, baseFolderId, folderIndex, createdPathIds, pendingPathIds)))
                    results.forEach((result, index) => {
                        if (result.status === 'rejected') Logger.error(`创建上传目录 ${batch[index]} 失败:`, result.reason)
                    })
                }
            }

            const readyTasks = [] as ReturnType<typeof createUploadTask>[]
            for (const task of currentTasks) {
                const relativeFolderPath = folderPathsByTaskId.get(task.id) || ''
                if (relativeFolderPath && !createdPathIds.has(relativeFolderPath)) {
                    task.status = 'error'
                    task.error = t('system.file.uploadFolderFailed')
                    continue
                }
                task.folderId = createdPathIds.get(relativeFolderPath) ?? baseFolderId
                readyTasks.push(task)
            }

            preparingDirectory.value = false
            if (readyTasks.length > 0) await runUploadQueue(readyTasks, uploadOptions)
            if (!isCurrentTaskBatch(currentTasks)) return
            await options.loadFolderTree()
            showUploadSummary(currentTasks)
            if (currentTasks.some((task) => task.status === 'success' || task.status === 'reuse')) {
                await options.getList()
            }
            if (currentTasks.every((task) => task.status === 'success' || task.status === 'reuse')) {
                window.setTimeout(() => {
                    if (isCurrentTaskBatch(currentTasks) && !uploading.value) clearTasks()
                }, 1200)
            }
        } finally {
            preparingDirectory.value = false
        }
    }

    const handleFileInputChange = async (event: Event) => {
        const input = event.target as HTMLInputElement
        const files = Array.from(input.files || [])
        input.value = ''
        await uploadFilesInQueue(files)
    }

    const handleDirectoryInputChange = async (event: Event) => {
        const input = event.target as HTMLInputElement
        const files = Array.from(input.files || [])
        input.value = ''
        try {
            await uploadDirectoryInQueue(files)
        } catch (error) {
            Logger.error('上传目录失败:', error)
            ElMessage.error(t('system.file.uploadFolderFailed'))
        }
    }

    const handleUploadDragEnter = (event: DragEvent) => {
        if (!isExternalFileDragEvent(event)) return
        isDraggingUpload.value = true
    }

    const handleUploadDragOver = (event: DragEvent) => {
        if (!isExternalFileDragEvent(event)) return
        isDraggingUpload.value = true
    }

    const handleUploadDragLeave = (event: DragEvent) => {
        if (!isExternalFileDragEvent(event)) return
        const current = event.currentTarget as HTMLElement
        const related = event.relatedTarget as Node | null
        if (!related || !current.contains(related)) isDraggingUpload.value = false
    }

    const handleUploadDrop = async (event: DragEvent) => {
        if (!isExternalFileDragEvent(event)) return
        isDraggingUpload.value = false
        await uploadFilesInQueue(Array.from(event.dataTransfer?.files || []))
    }

    return {
        uploadInputRef,
        uploadDirectoryInputRef,
        isDraggingUpload,
        uploadQueueExpanded,
        uploadTasks,
        uploading,
        uploadFinishedCount,
        uploadFinished,
        toggleUploadQueueExpanded,
        openUploadPicker,
        openUploadDirectoryPicker,
        clearTasks,
        retryUploadTask,
        handleFileInputChange,
        handleDirectoryInputChange,
        handleUploadDragEnter,
        handleUploadDragOver,
        handleUploadDragLeave,
        handleUploadDrop,
    }
}
