import { ref, computed, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { Logger } from '@/utils/logger'
import type { SystemFileFolder } from '@/types/system'
import { fetchSystemFileFolderTree, addSystemFileFolder, modifySystemFileFolder, removeSystemFileFolder, fetchSystemFileFolderStats } from '@/modules/system/service'

export const ROOT_FOLDER_KEY = '__root__'
export type FolderTreeNode = SystemFileFolder & { isRoot?: boolean; children?: FolderTreeNode[] }

export function useFileFolder(options?: { onSelectFolder?: (folderId: number | string | null) => void; onFolderDeleted?: (folderId: number | string) => void; onFolderMove?: (folder: SystemFileFolder) => void }) {
    const { t } = useI18n()
    const folderTree = ref<SystemFileFolder[]>([])
    const selectedFolderId = ref<number | string | null>(null)
    const showFolderDialog = ref(false)
    const folderSubmitting = ref(false)
    const folderDialogMode = ref<'create' | 'rename'>('create')
    const activeFolder = ref<SystemFileFolder | null>(null)

    // 文件夹删除确认弹窗状态
    const showFolderDeleteDialog = ref(false)
    const folderDeleteLoading = ref(false)
    const folderDeleteName = ref('')
    const folderDeleteWarning = ref('')
    const pendingDeleteFolder = ref<SystemFileFolder | null>(null)

    const folderForm = reactive<{ id?: number | string; parent_id?: number | string | null; name: string }>({
        id: undefined,
        parent_id: null,
        name: '',
    })

    const normalizeFolderId = (value?: number | string | null) => {
        return value === ROOT_FOLDER_KEY || value === undefined ? null : value
    }

    const folderSelectOptions = computed<FolderTreeNode[]>(() => [
        {
            id: ROOT_FOLDER_KEY,
            parent_id: null,
            name: t('system.file.rootFolder'),
            isRoot: true,
            children: folderTree.value as FolderTreeNode[],
            created_at: '',
            updated_at: '',
        },
    ])

    const folderDialogTitle = computed(() => (folderDialogMode.value === 'create' ? t('system.file.createFolder') : t('system.file.renameFolder')))

    const currentLevelFolders = computed(() => {
        if (selectedFolderId.value === null || selectedFolderId.value === ROOT_FOLDER_KEY) {
            return folderTree.value.filter((f) => !f.parent_id)
        }

        const findChildren = (folders: FolderTreeNode[]): FolderTreeNode[] => {
            for (const f of folders) {
                if (f.id === selectedFolderId.value) return f.children || []
                if (f.children) {
                    const result = findChildren(f.children)
                    if (result.length) return result
                }
            }
            return []
        }
        return findChildren(folderTree.value)
    })

    const folderPath = computed(() => {
        if (!selectedFolderId.value || selectedFolderId.value === ROOT_FOLDER_KEY) return []

        const path: { id: number | string; name: string }[] = []
        const findPath = (folders: FolderTreeNode[], targetId: number | string): boolean => {
            for (const f of folders) {
                if (f.id === targetId) {
                    path.push({ id: f.id, name: f.name })
                    return true
                }
                if (f.children && findPath(f.children, targetId)) {
                    path.unshift({ id: f.id, name: f.name })
                    return true
                }
            }
            return false
        }
        findPath(folderTree.value, selectedFolderId.value)
        return path
    })

    const confirmDeleteFolder = async () => {
        const folder = pendingDeleteFolder.value
        if (!folder) return
        folderDeleteLoading.value = true
        try {
            await removeSystemFileFolder(folder.id)
            ElMessage.success(t('common.result.deleteSuccess'))
            showFolderDeleteDialog.value = false
            if (selectedFolderId.value === folder.id) {
                selectedFolderId.value = null
            }
            options?.onFolderDeleted?.(folder.id)
            await loadFolderTree()
        } catch (error) {
            Logger.error('删除文件目录失败:', error)
        } finally {
            folderDeleteLoading.value = false
        }
    }

    const loadFolderTree = async () => {
        try {
            folderTree.value = await fetchSystemFileFolderTree()
        } catch (error) {
            Logger.error('获取文件目录树失败:', error)
            folderTree.value = []
        }
    }

    const handleFolderSelect = (folder: FolderTreeNode) => {
        selectedFolderId.value = normalizeFolderId(folder.id)
        options?.onSelectFolder?.(selectedFolderId.value)
    }

    const openFolderDialog = (mode: 'create' | 'rename', folder?: SystemFileFolder) => {
        folderDialogMode.value = mode
        activeFolder.value = folder || null
        folderForm.id = mode === 'rename' ? folder?.id : undefined
        folderForm.parent_id = mode === 'create' ? selectedFolderId.value : (folder?.parent_id ?? null)
        folderForm.name = mode === 'rename' ? folder?.name || '' : ''
        showFolderDialog.value = true
    }

    const submitFolderDialog = async () => {
        if (!folderForm.name.trim()) {
            ElMessage.warning(t('system.file.folderNameRequired'))
            return
        }
        folderSubmitting.value = true
        try {
            if (folderDialogMode.value === 'rename' && folderForm.id) {
                await modifySystemFileFolder({
                    id: folderForm.id,
                    name: folderForm.name.trim(),
                    parent_id: normalizeFolderId(folderForm.parent_id),
                })
                ElMessage.success(t('common.result.editSuccess'))
            } else {
                await addSystemFileFolder({
                    name: folderForm.name.trim(),
                    parent_id: normalizeFolderId(folderForm.parent_id),
                })
                ElMessage.success(t('common.result.addSuccess'))
            }
            showFolderDialog.value = false
            await loadFolderTree()
        } catch (error) {
            Logger.error('保存文件目录失败:', error)
        } finally {
            folderSubmitting.value = false
        }
    }

    const handleFolderCommand = async (command: string, folder: SystemFileFolder) => {
        if (command === 'create') {
            selectedFolderId.value = folder.id
            openFolderDialog('create', folder)
            return
        }
        if (command === 'rename') {
            openFolderDialog('rename', folder)
            return
        }
        if (command === 'move') {
            options?.onFolderMove?.(folder)
            return
        }
        if (command === 'delete') {
            try {
                const stats = await fetchSystemFileFolderStats(folder.id)
                if (stats.file_count > 0 || stats.child_folder_count > 0) {
                    folderDeleteWarning.value = t('system.file.deleteFolderCascadeConfirm', {
                        fileCount: stats.file_count,
                        folderCount: stats.child_folder_count,
                    })
                } else {
                    folderDeleteWarning.value = t('system.file.deleteFolderConfirm')
                }
                folderDeleteName.value = folder.name
                pendingDeleteFolder.value = folder
                showFolderDeleteDialog.value = true
            } catch (error) {
                Logger.error('获取目录统计信息失败:', error)
            }
        }
    }

    return {
        folderTree,
        selectedFolderId,
        showFolderDialog,
        folderSubmitting,
        folderDialogMode,
        activeFolder,
        folderForm,
        folderSelectOptions,
        folderDialogTitle,
        currentLevelFolders,
        folderPath,
        loadFolderTree,
        handleFolderSelect,
        openFolderDialog,
        submitFolderDialog,
        handleFolderCommand,
        normalizeFolderId,
        showFolderDeleteDialog,
        folderDeleteLoading,
        folderDeleteName,
        folderDeleteWarning,
        confirmDeleteFolder,
    }
}
