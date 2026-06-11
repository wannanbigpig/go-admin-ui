import { ref, type Ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useFileUpload, type UploadTask, type UploadOptions } from '@/composables/useFileUpload'
import { addSystemFileFolder } from '@/modules/system/service'
import { ROOT_FOLDER_KEY, type FolderTreeNode } from './useFileFolder'

export interface UseFileUploadFlowOptions {
    selectedFolderId: Ref<number | string | null>
    folderTree: Ref<FolderTreeNode[]>
    getList: () => Promise<void>
    loadFolderTree: () => Promise<void>
}

export function useFileUploadFlow(options: UseFileUploadFlowOptions) {
    const { t } = useI18n()
    const uploadInputRef = ref<HTMLInputElement>()
    const uploadDirectoryInputRef = ref<HTMLInputElement>()
    const isDraggingUpload = ref(false)
    const uploadQueueExpanded = ref(false)


    const { uploadTasks, uploading, uploadFinishedCount, uploadFinished, createUploadTask, uploadOneTask, runUploadQueue, clearTasks } = useFileUpload()

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

    const uploadFilesInQueue = async (files: File[]) => {
        if (files.length === 0) return
        const uploadOptions = { folderId: options.selectedFolderId.value, enableMultipart: true }
        const currentTasks = files.map((file) => createUploadTask(file, { uploadOptions }))
        uploadTasks.value = currentTasks
        uploadQueueExpanded.value = false
        await runUploadQueue(uploadTasks.value, uploadOptions)
        showUploadSummary(uploadTasks.value)
        if (uploadTasks.value.some((task) => task.status === 'success' || task.status === 'reuse')) {
            await options.getList()
        }
        if (uploadTasks.value.every((task) => task.status === 'success' || task.status === 'reuse')) {
            window.setTimeout(() => {
                if (uploadTasks.value === currentTasks && !uploading.value) clearTasks()
            }, 1200)
        }
    }

    const retryUploadTask = async (task: UploadTask) => {
        if (task.status !== 'error') return
        await uploadOneTask(task, task.uploadOptions)
        await options.getList()
        if (uploadTasks.value.length > 0 && uploadTasks.value.every((item) => item.status === 'success' || item.status === 'reuse')) {
            showUploadSummary(uploadTasks.value)
            const snapshot = uploadTasks.value
            window.setTimeout(() => {
                if (uploadTasks.value === snapshot && !uploading.value) clearTasks()
            }, 1200)
        }
    }

    const buildFolderIndexKey = (parentId: number | string | null | undefined, name: string) => `${String(parentId ?? ROOT_FOLDER_KEY)}::${name}`

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

    const extractRelativeDisplayName = (file: File) => {
        const relativePath = typeof (file as File & { webkitRelativePath?: string }).webkitRelativePath === 'string' ? String((file as File & { webkitRelativePath?: string }).webkitRelativePath) : ''
        return relativePath || file.name
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

        const baseFolderId = options.selectedFolderId.value
        await options.loadFolderTree()
        const folderIndex = buildFolderIndex(options.folderTree.value as FolderTreeNode[])
        const createdPathIds = new Map<string, number | string | null>([['', baseFolderId]])
        const pendingPathIds = new Map<string, Promise<number | string | null>>()
        const relativeFolderPaths = Array.from(new Set(files.map(extractRelativeFolderPath).filter(Boolean))).sort((left, right) => left.split('/').length - right.split('/').length)

        const byDepth = new Map<number, string[]>()
        for (const p of relativeFolderPaths) {
            const depth = p.split('/').length
            if (!byDepth.has(depth)) byDepth.set(depth, [])
            byDepth.get(depth)!.push(p)
        }
        for (const paths of [...byDepth.values()].sort((a, b) => a[0].split('/').length - b[0].split('/').length)) {
            await Promise.all(paths.map((p) => ensureFolderPathExists(p, baseFolderId, folderIndex, createdPathIds, pendingPathIds)))
        }

        const uploadOptions = { enableMultipart: true }
        const currentTasks = [] as ReturnType<typeof createUploadTask>[]
        for (const file of files) {
            const relativeFolderPath = extractRelativeFolderPath(file)
            const targetFolderId = relativeFolderPath ? (createdPathIds.get(relativeFolderPath) ?? baseFolderId) : baseFolderId
            currentTasks.push(
                createUploadTask(file, {
                    name: extractRelativeDisplayName(file),
                    folderId: targetFolderId,
                    uploadOptions,
                })
            )
        }

        uploadTasks.value = currentTasks
        uploadQueueExpanded.value = false
        await runUploadQueue(currentTasks, uploadOptions)
        await options.loadFolderTree()
        showUploadSummary(currentTasks)
        if (currentTasks.some((task) => task.status === 'success' || task.status === 'reuse')) {
            await options.getList()
        }
        if (currentTasks.every((task) => task.status === 'success' || task.status === 'reuse')) {
            window.setTimeout(() => {
                if (uploadTasks.value === currentTasks && !uploading.value) clearTasks()
            }, 1200)
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
        await uploadDirectoryInQueue(files)
    }

    const handleUploadDragEnter = () => {
        isDraggingUpload.value = true
    }

    const handleUploadDragOver = () => {
        isDraggingUpload.value = true
    }

    const handleUploadDragLeave = (event: DragEvent) => {
        const current = event.currentTarget as HTMLElement
        const related = event.relatedTarget as Node | null
        if (!related || !current.contains(related)) isDraggingUpload.value = false
    }

    const handleUploadDrop = async (event: DragEvent) => {
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
