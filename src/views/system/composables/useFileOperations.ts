import { ref, computed, reactive, type Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Logger } from '@/utils/logger'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'
import type { PageData } from '@/types/common'
import type { SystemFile, SystemFileFolder, SystemFileReference, SystemFileBatchDeleteResult } from '@/types/system'
import {
    fetchSystemFileDetail,
    removeSystemFile,
    fetchSystemFileTrashList,
    restoreSystemFileFromTrash,
    restoreSystemFilesBatchFromTrash,
    destroySystemFileFromTrash,
    destroySystemFilesBatchFromTrash,
    fetchSystemFileReferences,
    removeSystemFilesBatch,
    moveSystemFileFolder,
    moveSystemFiles,
} from '@/modules/system/service'

export function useFileOperations(options: { selectedFolderId: Ref<number | string | null>; getList: () => Promise<void>; loadFolderTree: () => Promise<void> }) {
    const { t } = useI18n()
    const { selectedFolderId, getList, loadFolderTree } = options

    const selectedFiles = ref<SystemFile[]>([])
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

    const normalizeFolderId = (value?: number | string | null) => (value === '__root__' || value === undefined ? null : value)

    const handleSelectionChange = (selection: SystemFile[]) => {
        selectedFiles.value = selection
    }

    const openBatchMoveDialog = () => {
        if (selectedFiles.value.length === 0) {
            ElMessage.warning(t('system.file.selectFileFirst'))
            return
        }
        moveMode.value = 'file'
        moveTargetFolderId.value = selectedFolderId.value
        showMoveDialog.value = true
    }

    const openFolderMoveDialog = (folder: SystemFileFolder) => {
        moveMode.value = 'folder'
        movingFolder.value = folder
        moveTargetFolderId.value = folder.parent_id ?? null
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
            const ids = selectedFiles.value.map((item) => item.id)
            if (ids.length === 0) {
                ElMessage.warning(t('system.file.selectFileFirst'))
                return
            }
            await moveSystemFiles({ ids, folder_id: normalizeFolderId(moveTargetFolderId.value) })
            ElMessage.success(t('system.file.moveSuccess'))
            showMoveDialog.value = false
            selectedFiles.value = []
            await getList()
        } catch (error) {
            Logger.error('移动文件资源失败:', error)
        } finally {
            moveSubmitting.value = false
        }
    }

    const openDetailDrawer = async (row: SystemFile) => {
        showDetailDrawer.value = true
        detailLoading.value = true
        detailReferences.value = []
        try {
            const detail = await fetchSystemFileDetail(row.id)
            currentDetail.value = detail
            detailReferences.value = Array.isArray(detail.references) ? detail.references : await fetchSystemFileReferences({ id: row.id })
        } catch (error) {
            Logger.error('获取文件资源详情失败:', error)
        } finally {
            detailLoading.value = false
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

    const handleDelete = async (row: SystemFile) => {
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
            await ElMessageBox.confirm(t('system.file.batchDeleteConfirm', { count: selectedFiles.value.length }), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
            batchDeleting.value = true
            const result = await removeSystemFilesBatch({
                ids: selectedFiles.value.map((item) => item.id),
            })

            const firstFailureWithReferences = (result.failures || []).find((item) => Array.isArray(item.references) && item.references.length > 0)
            if (firstFailureWithReferences) {
                activeReferences.value = firstFailureWithReferences.references || []
                referencesDialogTitle.value = firstFailureWithReferences.message || t('system.file.deleteBlockedTitle')
                showReferencesDialog.value = true
            }

            selectedFiles.value = []
            await getList()
            showBatchDeleteResult(result)
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
