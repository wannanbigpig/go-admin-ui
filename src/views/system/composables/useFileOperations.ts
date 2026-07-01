import { ref, computed, reactive, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Logger } from '@/utils/logger'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'
import type { PageData } from '@/types/common'
import type { SystemFile, SystemFileFolder, SystemFileReference, SystemFileBatchDeleteResult } from '@/types/system'
import {
    fetchSystemFileDetail,
    fetchSystemFileFolderStats,
    removeSystemFile,
    removeSystemFileFolder,
    fetchSystemFileTrashList,
    restoreSystemFileFromTrash,
    restoreSystemFilesBatchFromTrash,
    destroySystemFileFromTrash,
    destroySystemFilesBatchFromTrash,
    fetchSystemFileReferences,
    modifySystemFile,
    modifySystemFileFolder,
    removeSystemFilesBatch,
    moveSystemFileFolder,
    moveSystemFiles,
} from '@/modules/system/service'
import { ROOT_FOLDER_KEY } from './useFileFolder'

export type FileOperationItem = (SystemFile & { item_type?: 'file' }) | (SystemFileFolder & { item_type: 'folder'; origin_name?: string; total_size?: number; file_count?: number; child_folder_count?: number })

export function useFileOperations(options: { selectedFolderId: Ref<number | string | null>; getList: () => Promise<void>; loadFolderTree: () => Promise<void> }) {
    const { t } = useI18n()
    const { selectedFolderId, getList, loadFolderTree } = options

    const selectedFiles = ref<FileOperationItem[]>([])
    const selectedTrashFiles = ref<SystemFile[]>([])
    const batchDeleting = ref(false)
    const batchTrashOperating = ref(false)
    const showMoveDialog = ref(false)
    const moveSubmitting = ref(false)
    const moveMode = ref<'file' | 'folder'>('file')
    const moveTargetFolderId = ref<number | string | null>(null)
    const movingFolder = ref<SystemFileFolder | null>(null)

    const showDetailDrawer = ref(false)
    const detailLoading = ref(false)
    const currentDetail = ref<SystemFile | null>(null)
    const detailReferences = ref<SystemFileReference[]>([])

    const deletingId = ref<number | string | null>(null)
    const trashOperatingId = ref<number | string | null>(null)

    const showReferencesDialog = ref(false)
    const referencesLoading = ref(false)
    const activeReferences = ref<SystemFileReference[]>([])
    const referencesDialogTitle = ref('')

    // 引用文件删除确认弹窗状态
    const showDeleteConfirmDialog = ref(false)
    const deleteConfirmLoading = ref(false)
    const deleteConfirmName = ref('')
    const deleteConfirmWarning = ref('')
    const deleteConfirmReferences = ref<SystemFileReference[]>([])
    const pendingDeleteFile = ref<SystemFile | null>(null)

    const showRenameDialog = ref(false)
    const renameSubmitting = ref(false)
    const renameTarget = ref<FileOperationItem | null>(null)
    const renameForm = reactive({ name: '' })

    const showTrashDialog = ref(false)
    const trashList = ref<SystemFile[]>([])
    const trashLoading = ref(false)

    const trashPagination = reactive({
        page: 1,
        pageSize: 10,
        total: 0,
        pageChange: (page: number) => {
            trashPagination.page = page
            loadTrashList()
        },
        pageSizeChange: (pageSize: number) => {
            trashPagination.page = 1
            trashPagination.pageSize = pageSize
            loadTrashList()
        },
    })

    const moveDialogTitle = computed(() => (moveMode.value === 'folder' ? t('system.file.moveFolder') : t('system.file.batchMove')))
    const renameDialogTitle = computed(() => (isFolderItem(renameTarget.value) ? t('system.file.renameFolder') : t('system.file.renameFile')))

    const normalizeFolderId = (value?: number | string | null) => (value === ROOT_FOLDER_KEY || value === undefined || value === '' || value === 0 || value === '0' ? null : value)
    const normalizeFolderSelectValue = (value?: number | string | null): number | string | null => (normalizeFolderId(value) === null ? ROOT_FOLDER_KEY : (value ?? null))

    const isFolderItem = (item?: FileOperationItem | null): item is Extract<FileOperationItem, { item_type: 'folder' }> => item?.item_type === 'folder'
    const isFileItem = (item?: FileOperationItem | null): item is SystemFile => !isFolderItem(item)
    const splitOperationItems = (items: FileOperationItem[]) => ({
        files: items.filter(isFileItem),
        folders: items.filter(isFolderItem),
    })
    const getItemName = (item: FileOperationItem | null) => {
        if (!item) return ''
        return isFolderItem(item) ? item.name : item.origin_name || item.display_name || item.name || ''
    }

    const handleSelectionChange = (selection: FileOperationItem[]) => {
        selectedFiles.value = selection
    }

    const openBatchMoveDialog = () => {
        if (selectedFiles.value.length === 0) {
            ElMessage.warning(t('system.file.selectFileFirst'))
            return
        }
        moveMode.value = 'file'
        moveTargetFolderId.value = normalizeFolderSelectValue(selectedFolderId.value)
        showMoveDialog.value = true
    }

    const openFolderMoveDialog = (folder: SystemFileFolder) => {
        moveMode.value = 'folder'
        movingFolder.value = folder
        moveTargetFolderId.value = normalizeFolderSelectValue(folder.parent_id)
        showMoveDialog.value = true
    }

    const submitMoveDialog = async () => {
        moveSubmitting.value = true
        try {
            if (moveMode.value === 'folder') {
                if (!movingFolder.value) return
                await moveSystemFileFolder(movingFolder.value.id, normalizeFolderId(moveTargetFolderId.value))
                ElMessage.success(t('system.file.moveSuccess'))
                showMoveDialog.value = false
                await loadFolderTree()
                return
            }
            const { files, folders } = splitOperationItems(selectedFiles.value)
            if (files.length === 0 && folders.length === 0) {
                ElMessage.warning(t('system.file.selectFileFirst'))
                return
            }
            const targetFolderId = normalizeFolderId(moveTargetFolderId.value)
            if (files.length > 0) {
                await moveSystemFiles({ ids: files.map((item) => item.id), folder_id: targetFolderId })
            }
            for (const folder of folders) {
                await moveSystemFileFolder(folder.id, targetFolderId)
            }
            ElMessage.success(t('system.file.moveSuccess'))
            showMoveDialog.value = false
            selectedFiles.value = []
            await loadFolderTree()
            await getList()
        } catch (error) {
            Logger.error('移动文件资源失败:', error)
        } finally {
            moveSubmitting.value = false
        }
    }

    const openDetailDrawer = async (row: FileOperationItem) => {
        showDetailDrawer.value = true
        detailLoading.value = true
        detailReferences.value = []
        try {
            if (isFolderItem(row)) {
                const stats = await fetchSystemFileFolderStats(row.id)
                currentDetail.value = {
                    id: row.id,
                    item_type: 'folder',
                    uid: 0,
                    folder_id: row.parent_id ?? null,
                    logical_path: row.path || '',
                    display_name: row.name,
                    origin_name: row.name,
                    name: row.name,
                    path: row.path || '',
                    size: stats.total_size || row.total_size || 0,
                    uuid: '',
                    mime_type: '',
                    file_type: 'folder',
                    is_public: 0,
                    file_count: stats.file_count,
                    child_folder_count: stats.child_folder_count,
                    total_size: stats.total_size,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                } as SystemFile
                return
            }
            const detail = await fetchSystemFileDetail(row.id)
            currentDetail.value = detail
            detailReferences.value = Array.isArray(detail.references) ? detail.references : await fetchSystemFileReferences({ id: row.id })
        } catch (error) {
            Logger.error('获取文件资源详情失败:', error)
        } finally {
            detailLoading.value = false
        }
    }

    const openRenameDialog = (item: FileOperationItem) => {
        renameTarget.value = item
        renameForm.name = getItemName(item)
        showRenameDialog.value = true
    }

    const submitRenameDialog = async () => {
        const target = renameTarget.value
        const name = renameForm.name.trim()
        if (!target || !name) {
            ElMessage.warning(t('system.file.fileNameRequired'))
            return
        }
        renameSubmitting.value = true
        try {
            if (isFolderItem(target)) {
                await modifySystemFileFolder({ id: target.id, name })
                await loadFolderTree()
            } else {
                await modifySystemFile({ id: target.id, origin_name: name })
            }
            ElMessage.success(t('common.result.editSuccess'))
            showRenameDialog.value = false
            await getList()
        } catch (error) {
            Logger.error('重命名文件资源失败:', error)
        } finally {
            renameSubmitting.value = false
        }
    }

    const formatReferenceField = (row: SystemFileReference) => {
        const field = String(row.owner_field || '').trim()
        const name = String(row.field_name || '').trim()
        if (field && name) return `${field}（${name}）`
        return field || name || '-'
    }

    const findReferencesInError = (value: unknown): SystemFileReference[] => {
        if (!value || typeof value !== 'object') return []
        const record = value as Record<string, unknown>
        if (Array.isArray(record.references)) return record.references as SystemFileReference[]
        if (record.data) return findReferencesInError(record.data)
        if (record.response) return findReferencesInError(record.response)
        return []
    }

    const openReferencesDialog = async (row: SystemFile) => {
        referencesDialogTitle.value = t('system.file.referencesTitle', { name: row.origin_name || row.uuid || row.id })
        activeReferences.value = []
        showReferencesDialog.value = true
        referencesLoading.value = true
        try {
            activeReferences.value = Array.isArray(row.references) ? row.references : await fetchSystemFileReferences({ id: row.id })
        } catch (error) {
            Logger.error('获取文件引用列表失败:', error)
        } finally {
            referencesLoading.value = false
        }
    }

    const loadTrashList = async () => {
        trashLoading.value = true
        try {
            const result = (await fetchSystemFileTrashList({
                page: trashPagination.page,
                per_page: trashPagination.pageSize,
                is_deleted: 1,
            })) as PageData<SystemFile> & { page?: number; pageSize?: number }
            trashList.value = result.list
            trashPagination.total = result.total
            trashPagination.page = result.page ?? trashPagination.page
            trashPagination.pageSize = result.pageSize ?? trashPagination.pageSize
        } catch (error) {
            Logger.error('获取文件回收站列表失败:', error)
            trashList.value = []
            trashPagination.total = 0
        } finally {
            trashLoading.value = false
        }
    }

    const openTrashDialog = () => {
        showTrashDialog.value = true
    }

    const handleRestore = async (row: SystemFile) => {
        try {
            trashOperatingId.value = row.id
            await restoreSystemFileFromTrash(row.id)
            ElMessage.success(t('system.file.restoreSuccess'))
            await loadTrashList()
            await getList()
        } catch (error) {
            Logger.error('恢复文件失败:', error)
        } finally {
            trashOperatingId.value = null
        }
    }

    const handleDestroy = async (row: SystemFile) => {
        try {
            await ElMessageBox.confirm(t('system.file.destroyConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
            trashOperatingId.value = row.id
            await destroySystemFileFromTrash(row.id)
            ElMessage.success(t('common.result.deleteSuccess'))
            await loadTrashList()
        } catch (error) {
            if (error === 'cancel' || error === 'close') return
            Logger.error('硬删除文件失败:', error)
        } finally {
            trashOperatingId.value = null
        }
    }

    const showReferenceFailure = (references: SystemFileReference[], title?: string) => {
        activeReferences.value = references
        referencesDialogTitle.value = title || t('system.file.deleteBlockedTitle')
        showReferencesDialog.value = true
    }

    const deleteFolderWithConfirm = async (folder: Extract<FileOperationItem, { item_type: 'folder' }>) => {
        const stats = await fetchSystemFileFolderStats(folder.id)
        await ElMessageBox.confirm(
            t('system.file.deleteFolderCascadeConfirm', {
                fileCount: stats.file_count,
                folderCount: stats.child_folder_count,
            }),
            t(CONFIRM_DIALOG_TITLE),
            { type: 'warning' }
        )
        deletingId.value = folder.id
        await removeSystemFileFolder(folder.id)
        ElMessage.success(t('common.result.deleteSuccess'))
        await loadFolderTree()
        await getList()
    }

    const handleDelete = async (row: FileOperationItem) => {
        if (isFolderItem(row)) {
            try {
                await deleteFolderWithConfirm(row)
            } catch (error) {
                if (error === 'cancel' || error === 'close') return
                const references = findReferencesInError(error)
                if (references.length > 0) {
                    showReferenceFailure(references)
                    return
                }
                Logger.error('删除文件夹失败:', error)
            } finally {
                deletingId.value = null
            }
            return
        }

        try {
            await ElMessageBox.confirm(t('system.file.deleteConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
            deletingId.value = row.id
            await removeSystemFile(row.id)
            ElMessage.success(t('common.result.deleteSuccess'))
            await getList()
        } catch (error) {
            if (error === 'cancel' || error === 'close') return
            // 有引用：弹出输入名称确认弹窗
            const references = findReferencesInError(error)
            if (references.length > 0) {
                deleteConfirmReferences.value = references
                deleteConfirmWarning.value = t('system.file.deleteReferencedConfirm', { count: references.length })
                deleteConfirmName.value = row.origin_name
                pendingDeleteFile.value = row
                showDeleteConfirmDialog.value = true
                return
            }
            Logger.error('删除文件资源失败:', error)
        } finally {
            deletingId.value = null
        }
    }

    const confirmForceDelete = async () => {
        const file = pendingDeleteFile.value
        if (!file) return
        deleteConfirmLoading.value = true
        try {
            await removeSystemFile(file.id, true)
            ElMessage.success(t('common.result.deleteSuccess'))
            showDeleteConfirmDialog.value = false
            await getList()
        } catch (error) {
            Logger.error('强制删除文件资源失败:', error)
        } finally {
            deleteConfirmLoading.value = false
        }
    }

    const handleTrashSelectionChange = (selection: SystemFile[]) => {
        selectedTrashFiles.value = selection
    }

    const handleBatchRestore = async () => {
        if (selectedTrashFiles.value.length === 0) {
            ElMessage.warning(t('system.file.selectFileFirst'))
            return
        }
        try {
            batchTrashOperating.value = true
            const ids = selectedTrashFiles.value.map((item) => item.id)
            await restoreSystemFilesBatchFromTrash(ids)
            ElMessage.success(t('system.file.restoreSuccess'))
            selectedTrashFiles.value = []
            await loadTrashList()
            await getList()
        } catch (error) {
            Logger.error('批量恢复文件失败:', error)
        } finally {
            batchTrashOperating.value = false
        }
    }

    const handleBatchDestroy = async () => {
        if (selectedTrashFiles.value.length === 0) {
            ElMessage.warning(t('system.file.selectFileFirst'))
            return
        }
        try {
            await ElMessageBox.confirm(t('system.file.batchDestroyConfirm', { count: selectedTrashFiles.value.length }), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
            batchTrashOperating.value = true
            const ids = selectedTrashFiles.value.map((item) => item.id)
            await destroySystemFilesBatchFromTrash(ids)
            ElMessage.success(t('common.result.deleteSuccess'))
            selectedTrashFiles.value = []
            await loadTrashList()
        } catch (error) {
            if (error === 'cancel' || error === 'close') return
            Logger.error('批量彻底删除文件失败:', error)
        } finally {
            batchTrashOperating.value = false
        }
    }

    const handleBatchDelete = async () => {
        if (selectedFiles.value.length === 0) {
            ElMessage.warning(t('system.file.selectFileFirst'))
            return
        }

        try {
            const { files, folders } = splitOperationItems(selectedFiles.value)
            if (folders.length > 0) {
                const statsList = await Promise.all(folders.map((folder) => fetchSystemFileFolderStats(folder.id)))
                const fileCount = statsList.reduce((total, item) => total + Number(item.file_count || 0), 0)
                const childFolderCount = statsList.reduce((total, item) => total + Number(item.child_folder_count || 0), 0)
                await ElMessageBox.confirm(
                    t('system.file.batchDeleteWithFoldersConfirm', {
                        count: selectedFiles.value.length,
                        folderCount: folders.length,
                        fileCount,
                        childFolderCount,
                    }),
                    t(CONFIRM_DIALOG_TITLE),
                    { type: 'warning' }
                )
            } else {
                await ElMessageBox.confirm(t('system.file.batchDeleteConfirm', { count: files.length }), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
            }
            batchDeleting.value = true

            let fileResult: SystemFileBatchDeleteResult | null = null
            if (files.length > 0) {
                fileResult = await removeSystemFilesBatch({
                    ids: files.map((item) => item.id),
                })

                const firstFailureWithReferences = (fileResult.failures || []).find((item) => Array.isArray(item.references) && item.references.length > 0)
                if (firstFailureWithReferences) {
                    showReferenceFailure(firstFailureWithReferences.references || [], firstFailureWithReferences.message)
                }
            }

            for (const folder of folders) {
                try {
                    await removeSystemFileFolder(folder.id)
                } catch (error) {
                    const references = findReferencesInError(error)
                    if (references.length > 0) {
                        showReferenceFailure(references)
                        continue
                    }
                    throw error
                }
            }

            selectedFiles.value = []
            await loadFolderTree()
            await getList()
            if (fileResult) {
                showBatchDeleteResult(fileResult)
            } else {
                ElMessage.success(t('common.result.deleteSuccess'))
            }
        } catch (error) {
            if (error === 'cancel' || error === 'close') return
            Logger.error('批量删除文件资源失败:', error)
        } finally {
            batchDeleting.value = false
        }
    }

    const showBatchDeleteResult = (result: SystemFileBatchDeleteResult) => {
        if (result.deleted > 0 && result.failed === 0) {
            ElMessage.success(t('system.file.batchDeleteSuccess', { count: result.deleted }))
            return
        }
        if (result.deleted > 0) {
            ElMessage.warning(t('system.file.batchDeletePartial', { success: result.deleted, failed: result.failed }))
            return
        }
        ElMessage.error(t('system.file.batchDeleteFailed'))
    }

    return {
        selectedFiles,
        batchDeleting,
        showMoveDialog,
        moveSubmitting,
        moveMode,
        moveTargetFolderId,
        movingFolder,
        moveDialogTitle,
        showRenameDialog,
        renameSubmitting,
        renameTarget,
        renameForm,
        renameDialogTitle,
        showDetailDrawer,
        detailLoading,
        currentDetail,
        detailReferences,
        deletingId,
        trashOperatingId,
        showReferencesDialog,
        referencesLoading,
        activeReferences,
        referencesDialogTitle,
        showTrashDialog,
        trashList,
        trashLoading,
        trashPagination,
        selectedTrashFiles,
        batchTrashOperating,
        showDeleteConfirmDialog,
        deleteConfirmLoading,
        deleteConfirmName,
        deleteConfirmWarning,
        deleteConfirmReferences,
        confirmForceDelete,
        handleSelectionChange,
        handleTrashSelectionChange,
        openBatchMoveDialog,
        openFolderMoveDialog,
        submitMoveDialog,
        openDetailDrawer,
        openRenameDialog,
        submitRenameDialog,
        formatReferenceField,
        openReferencesDialog,
        loadTrashList,
        openTrashDialog,
        handleRestore,
        handleDestroy,
        handleDelete,
        handleBatchDelete,
        handleBatchRestore,
        handleBatchDestroy,
    }
}
