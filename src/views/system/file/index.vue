<template>
    <FileExplorerLayout>
        <template #sidebar>
            <FileSidebar
                :folder-tree="folderTree"
                :selected-folder-id="selectedFolderId"
                :selected-category="selectedCategory"
                @select-category="selectCategory"
                @select-folder="handleFolderSelect"
                @folder-command="({ command, folder }) => handleFolderAction(command, folder)"
                @open-folder-dialog="(mode, folder) => openFolderDialog(mode, folder)"
                @open-trash-dialog="openTrashDialog"
            />
        </template>

        <template #content>
            <FileToolbar
                v-model:view-mode="viewMode"
                v-model:search-name="queryWhere.origin_name"
                :selected-category="selectedCategory"
                :folder-path="folderPath"
                :exporting="exporting"
                :selected-count="selectedFiles.length"
                :batch-deleting="batchDeleting"
                :files-length="fileList.length"
                :is-all-selected="isAllSelected"
                :is-indeterminate="isIndeterminate"
                @breadcrumb-click="handleBreadcrumbClick"
                @search="handleSearch"
                @export="handleExportList"
                @upload-files="openUploadPicker"
                @upload-directory="openUploadDirectoryPicker"
                @batch-move="openBatchMoveDialog"
                @batch-delete="handleBatchDelete"
                @toggle-select-all="handleToggleSelectAll"
            />

            <div
                class="file-content-wrapper"
                v-loading="loading"
                @dragenter.prevent="handleUploadDragEnter"
                @dragover.prevent="handleUploadDragOver"
                @dragleave.prevent="handleUploadDragLeave"
                @drop.prevent="handleUploadDrop"
            >
                <div v-if="isDraggingUpload" class="upload-drag-overlay">
                    <div class="drag-message">
                        <el-icon class="drag-icon"><UploadFilled /></el-icon>
                        <span>{{ t('system.file.releaseToUpload') }}</span>
                    </div>
                </div>

                <FileUploadQueue
                    :tasks="uploadTasks"
                    :uploading="uploading"
                    :finished-count="uploadFinishedCount"
                    :upload-finished="uploadFinished"
                    :expanded="uploadQueueExpanded"
                    @toggle-expand="toggleUploadQueueExpanded"
                    @retry="retryUploadTask"
                />

                <el-scrollbar v-if="viewMode === 'grid'" :distance="30" @end-reached="handleScrollEnd" style="height: 100%">
                    <FileGrid
                        :files="displayFiles"
                        :folders="currentLevelFolders"
                        :selected-category="selectedCategory"
                        :selected-files="selectedFiles"
                        @selection-change="handleSelectionChange"
                        @folder-click="handleFolderSelect"
                        @file-click="openDetailDrawer"
                        @folder-command="({ command, folder }) => handleFolderAction(command, folder)"
                        @rename-file="openRenameDialog"
                        @delete-file="handleDelete"
                        @move-file="handleSingleMove"
                    />
                </el-scrollbar>

                <div v-else class="file-list-view">
                    <xl-pro-table
                        :loading="loading"
                        :skeleton="false"
                        :data="listTableRows"
                        :columns="columns"
                        :pagination="pagination"
                        row-key="list_key"
                        :selectable="isFileListRowSelectable"
                        @selection-change="handleListSelectionChange"
                    >
                        <template #td="{ item, val, row }">
                            <div v-if="item.prop === 'origin_name'" class="file-name-cell" @click="handleListNameClick(row)">
                                <div v-if="isFolderListRow(row)" class="file-thumbnail-placeholder folder-thumbnail">
                                    <el-icon color="var(--el-color-primary)"><FolderOpened /></el-icon>
                                </div>
                                <el-image
                                    v-else-if="isImageFile(row) && getFileThumbnailUrl(row)"
                                    :src="getFileThumbnailUrl(row)"
                                    fit="cover"
                                    class="file-thumbnail"
                                    :preview-src-list="getFilePreviewList(row)"
                                    preview-teleported
                                    hide-on-click-modal
                                    :alt="row.origin_name || ''"
                                    @click.stop
                                />
                                <div v-else class="file-thumbnail-placeholder">
                                    <el-icon color="var(--el-text-color-placeholder)"><Document /></el-icon>
                                    <span class="file-ext" v-if="row.ext">{{ String(row.ext).substring(0, 4).toUpperCase() }}</span>
                                </div>
                                <span class="file-name-text">{{ val || '-' }}</span>
                            </div>
                            <span v-else-if="isFolderListRow(row) && item.prop === 'file_type'">{{ t('system.file.folders') }}</span>
                            <span v-else-if="isFolderListRow(row) && item.prop === 'uploader_name'">{{ getFolderUploaderName(row) }}</span>
                            <el-tag v-else-if="isFolderListRow(row) && item.prop === 'is_public' && hasCellValue(row.is_public)" :type="item.tag?.[row.is_public as string | number]?.type || 'info'">
                                {{ item.tag?.[row.is_public as string | number]?.text || row.is_public }}
                            </el-tag>
                            <el-tag v-else-if="isFolderListRow(row) && item.prop === 'storage_driver' && hasCellValue(row.storage_driver)" :type="getStorageDriverTagType(row.storage_driver)">
                                {{ getStorageDriverLabel(row.storage_driver) }}
                            </el-tag>
                            <el-tag v-else-if="isFolderListRow(row) && item.prop === 'storage_status' && hasCellValue(row.storage_status)" :type="getStorageStatusTagType(row.storage_status)">
                                {{ getStorageStatusLabel(row.storage_status) }}
                            </el-tag>
                            <span v-else-if="isFolderListRow(row) && hasCellValue(val)">{{ val }}</span>
                            <span v-else-if="isFolderListRow(row)">-</span>
                            <el-tag v-else-if="item.prop === 'storage_driver'" :type="getStorageDriverTagType(row.storage_driver)">
                                {{ getStorageDriverLabel(row.storage_driver) }}
                            </el-tag>
                            <el-tag v-else-if="item.prop === 'storage_status'" :type="getStorageStatusTagType(row.storage_status)">
                                {{ getStorageStatusLabel(row.storage_status) }}
                            </el-tag>
                            <el-button v-else-if="item.prop === 'reference_count'" type="primary" link :disabled="Number(row.reference_count || 0) <= 0" @click="openReferencesDialog(row)">
                                {{ row.reference_count || 0 }}
                            </el-button>
                            <el-tag v-else-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                                {{ item.tag[val as string | number]?.text || val }}
                            </el-tag>
                            <span v-else>{{ val }}</span>
                        </template>
                        <template #operation>
                            <el-table-column width="150" :label="t('common.labels.operation')" align="center" fixed="right">
                                <template #default="scope">
                                    <xl-action-buttons :buttons="actionButtons" :scope="scope" />
                                </template>
                            </el-table-column>
                        </template>
                    </xl-pro-table>
                </div>
            </div>
        </template>

        <template #extras>
            <input ref="uploadInputRef" type="file" multiple class="file-upload-input" @change="handleFileInputChange" />
            <input ref="uploadDirectoryInputRef" type="file" multiple webkitdirectory directory class="file-upload-input" @change="handleDirectoryInputChange" />

            <el-dialog v-model="showFolderDialog" :title="folderDialogTitle" width="420px" append-to-body>
                <el-form ref="folderFormRef" :model="folderForm" :rules="folderRules" label-width="90px">
                    <el-form-item :label="t('system.file.folderName')" prop="name">
                        <el-input v-model.trim="folderForm.name" :placeholder="t('system.file.folderNamePlaceholder')" @keyup.enter="handleSubmitFolderDialog" />
                    </el-form-item>
                    <el-form-item :label="t('system.file.parentFolder')">
                        <el-tree-select v-model="folderForm.parent_id" :data="folderSelectOptions" :props="{ label: 'name', children: 'children', value: 'id' }" check-strictly clearable />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showFolderDialog = false">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" :loading="folderSubmitting" @click="handleSubmitFolderDialog">{{ t('common.actions.confirm') }}</el-button>
                </template>
            </el-dialog>

            <el-dialog v-model="showMoveDialog" :title="moveDialogTitle" width="420px" append-to-body>
                <el-form ref="moveFormRef" :model="moveFormData" :rules="moveRules" label-width="90px">
                    <el-form-item :label="t('system.file.targetFolder')" prop="target_folder_id">
                        <el-tree-select v-model="moveTargetFolderId" :data="folderSelectOptions" :props="{ label: 'name', children: 'children', value: 'id' }" check-strictly clearable />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showMoveDialog = false">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" :loading="moveSubmitting" @click="handleSubmitMoveDialog">{{ t('common.actions.confirm') }}</el-button>
                </template>
            </el-dialog>

            <el-dialog v-model="showRenameDialog" :title="renameDialogTitle" width="420px" append-to-body>
                <el-form label-width="90px" @submit.prevent>
                    <el-form-item :label="t('system.file.fileName')">
                        <el-input v-model.trim="renameForm.name" :placeholder="t('system.file.fileNamePlaceholder')" @keyup.enter="submitRenameDialog" />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showRenameDialog = false">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" :loading="renameSubmitting" @click="submitRenameDialog">{{ t('common.actions.confirm') }}</el-button>
                </template>
            </el-dialog>

            <FileDetailDrawer v-model="showDetailDrawer" :file="currentDetail" :references="detailReferences" :loading="detailLoading" />

            <!-- 文件夹删除确认弹窗 -->
            <ConfirmDeleteByNameDialog
                v-model="showFolderDeleteDialog"
                :title="t('common.actions.delete')"
                :warning-message="folderDeleteWarning"
                :confirm-name="folderDeleteName"
                :loading="folderDeleteLoading"
                @confirm="confirmDeleteFolder"
            />

            <!-- 引用文件删除确认弹窗 -->
            <ConfirmDeleteByNameDialog
                v-model="showDeleteConfirmDialog"
                :title="t('common.actions.delete')"
                :warning-message="deleteConfirmWarning"
                :confirm-name="deleteConfirmName"
                :references="deleteConfirmReferences"
                :loading="deleteConfirmLoading"
                @confirm="confirmForceDelete"
            />

            <el-dialog v-model="showReferencesDialog" :title="referencesDialogTitle" width="780px" append-to-body>
                <el-table v-loading="referencesLoading" :data="activeReferences" border size="small" empty-text="-" class="reference-dialog-table">
                    <el-table-column prop="owner_type" :label="t('system.file.referenceOwnerType')" width="120" show-overflow-tooltip />
                    <el-table-column prop="owner_id" :label="t('system.file.referenceOwnerId')" width="90" show-overflow-tooltip />
                    <el-table-column prop="source_name" :label="t('system.file.referenceSource')" min-width="130" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ row.source_name || row.owner_type || '-' }}
                        </template>
                    </el-table-column>
                    <el-table-column prop="owner_field" :label="t('system.file.referenceField')" min-width="170" show-overflow-tooltip>
                        <template #default="{ row }">
                            {{ formatReferenceField(row) }}
                        </template>
                    </el-table-column>
                </el-table>
            </el-dialog>

            <el-dialog v-model="showTrashDialog" :title="t('system.file.trash')" width="86%" append-to-body @open="loadTrashList">
                <div class="trash-batch-actions" style="margin-bottom: 12px; display: flex; gap: 10px">
                    <el-button type="primary" :disabled="selectedTrashFiles.length === 0" :loading="batchTrashOperating" @click="handleBatchRestore">
                        {{ t('system.file.batchRestore') }}
                    </el-button>
                    <el-button type="danger" :disabled="selectedTrashFiles.length === 0" :loading="batchTrashOperating" @click="handleBatchDestroy">
                        {{ t('system.file.batchDestroy') }}
                    </el-button>
                </div>
                <xl-pro-table :loading="trashLoading" :data="trashList" :columns="trashColumns" :pagination="trashPagination" selectable height="450" @selection-change="handleTrashSelectionChange">
                    <template #td="{ item, val, row }">
                        <div v-if="item.prop === 'origin_name'" class="file-name-cell">
                            <el-image
                                v-if="isImageFile(row) && getFileThumbnailUrl(row)"
                                :src="getFileThumbnailUrl(row)"
                                fit="cover"
                                class="file-thumbnail"
                                :preview-src-list="getFilePreviewList(row)"
                                preview-teleported
                                hide-on-click-modal
                                :alt="row.origin_name || ''"
                            />
                            <div v-else class="file-thumbnail-placeholder">
                                <el-icon color="var(--el-text-color-placeholder)"><Document /></el-icon>
                                <span class="file-ext" v-if="row.ext">{{ String(row.ext).substring(0, 4).toUpperCase() }}</span>
                            </div>
                            <span class="file-name-text">{{ val || '-' }}</span>
                        </div>
                        <el-tag v-else-if="item.prop === 'storage_status'" :type="getStorageStatusTagType(row.storage_status)">
                            {{ getStorageStatusLabel(row.storage_status) }}
                        </el-tag>
                        <el-tag v-else-if="item.prop === 'storage_driver'" :type="getStorageDriverTagType(row.storage_driver)">
                            {{ getStorageDriverLabel(row.storage_driver) }}
                        </el-tag>
                        <span v-else>{{ val }}</span>
                    </template>
                    <template #operation>
                        <el-table-column width="130" :label="t('common.labels.operation')" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="trashActionButtons" :scope="scope" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-pro-table>
            </el-dialog>
        </template>
    </FileExplorerLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { Document, FolderOpened, UploadFilled } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'
import xlProTable from '@/components/proTable/index.vue'
import xlActionButtons, { type ActionButtonConfig, type TableScope } from '@/components/actionButtons/index.vue'
import { useI18n } from 'vue-i18n'
import { useListPage } from '@/composables/useListPage'
import { createSystemFileQuery } from '@/modules/system/model'
import { fetchSystemFileList } from '@/modules/system/service'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import { debounce, formatFileSize, getImageUrl } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import type { ProTableColumns } from '@/components/proTable/types'
import type { SystemFile, SystemFileFolder } from '@/types/system'

import { useFileFolder, ROOT_FOLDER_KEY } from '../composables/useFileFolder'
import { useFileOperations, type FileOperationItem } from '../composables/useFileOperations'
import { useFileCategory } from '../composables/useFileCategory'
import { useFileExport } from '../composables/useFileExport'
import { useFileUploadFlow } from '../composables/useFileUploadFlow'

import FileSidebar from '../components/FileSidebar.vue'
import FileToolbar from '../components/FileToolbar.vue'
import FileGrid from '../components/FileGrid.vue'
import FileDetailDrawer from '../components/FileDetailDrawer.vue'
import FileUploadQueue from '../components/FileUploadQueue.vue'
import FileExplorerLayout from '../components/FileExplorerLayout.vue'
import ConfirmDeleteByNameDialog from '../components/ConfirmDeleteByNameDialog.vue'

const { t } = useI18n()

const queryFormRef = ref()
const queryWhere = reactive(createSystemFileQuery())
queryWhere.per_page = 40
const dateRange = ref<[string, string] | []>([])
const viewMode = ref<'grid' | 'list'>('grid')

type FileListRow =
    | (SystemFile & {
          item_type: 'file'
          list_key: string
      })
    | (SystemFileFolder & {
          item_type: 'folder'
          list_key: string
          origin_name: string
          file_type: 'folder'
          size?: number
          mime_type?: string
          is_public?: number
          storage_driver?: string
          storage_status?: string
          reference_count?: number
          uploader_name?: string
          uploader_username?: string
          creator_name?: string
          creator_username?: string
          created_by?: number | string
          uuid?: string
      })

type FolderRowSource = Omit<Partial<SystemFileFolder>, 'item_type'> & {
    id?: number | string
    item_type?: string
    file_type?: string
    origin_name?: string
    display_name?: string
    size?: number
    total_size?: number
}

const {
    folderTree,
    selectedFolderId,
    showFolderDialog,
    folderSubmitting,
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
    showFolderDeleteDialog,
    folderDeleteLoading,
    folderDeleteName,
    folderDeleteWarning,
    confirmDeleteFolder,
} = useFileFolder({
    onSelectFolder: () => {
        selectedFiles.value = []
        queryWhere.folder_id = selectedFolderId.value
        pagination.page = 1
        getList()
    },
    onFolderDeleted: () => {
        getList()
    },
    onFolderMove: (folder) => {
        openFolderMoveDialog(folder)
    },
})

const {
    loading,
    items: fileList,
    pagination,
    getList: rawGetList,
    handleSearch: rawHandleSearch,
} = useListPage<SystemFile, typeof queryWhere>({
    query: queryWhere,
    queryFormRef,
    transformParams: (query) => {
        const params = { ...query }
        const isAllCategory = selectedCategory.value === 'all'
        const hasSearch = !!params.origin_name

        if (isAllCategory) {
            params.folder_id = selectedFolderId.value ?? 0
            params.include_subfolder = hasSearch ? 1 : 0
        } else {
            params.folder_id = selectedFolderId.value || undefined
            params.include_subfolder = 1
        }

        const selectedDateRange = dateRange.value.length === 2 ? dateRange.value : null
        applyDateRangeToQuery(params, selectedDateRange)
        return params
    },
    fetcher: async (params) => {
        try {
            const result = await fetchSystemFileList(params)
            if (viewMode.value === 'grid') {
                if (params.page === 1 || !params.page) {
                    allFilesList.value = result.list
                } else {
                    allFilesList.value = [...allFilesList.value, ...result.list]
                }
            }
            return result
        } catch (error) {
            Logger.error('获取文件资源列表失败:', error)
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const handleSearch = debounce(rawHandleSearch, 300)

const getList = async () => {
    if (viewMode.value === 'grid') {
        await handleSearch()
    } else {
        await rawGetList()
    }
}

const { selectedCategory, selectCategory } = useFileCategory({
    onSelect: (category, fileType) => {
        selectedFolderId.value = null
        queryWhere.folder_id = null
        selectedFiles.value = []
        queryWhere.file_type = fileType
        handleSearch()
    },
})

const { exporting, handleExportList } = useFileExport({
    queryWhere,
    selectedCategory,
    selectedFolderId,
    dateRange,
})

const {
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
    retryUploadTask,
    handleFileInputChange,
    handleDirectoryInputChange,
    handleUploadDragEnter,
    handleUploadDragOver,
    handleUploadDragLeave,
    handleUploadDrop,
} = useFileUploadFlow({
    selectedFolderId,
    folderTree,
    getList,
    loadFolderTree,
})

const {
    selectedFiles,
    batchDeleting,
    showMoveDialog,
    moveSubmitting,
    moveTargetFolderId,
    moveDialogTitle,
    showRenameDialog,
    renameSubmitting,
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
    handleSelectionChange,
    selectedTrashFiles,
    batchTrashOperating,
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
    showDeleteConfirmDialog,
    deleteConfirmLoading,
    deleteConfirmName,
    deleteConfirmWarning,
    deleteConfirmReferences,
    confirmForceDelete,
} = useFileOperations({
    selectedFolderId,
    getList,
    loadFolderTree,
})

// ==================== 表单校验 ====================
const folderFormRef = ref<FormInstance>()
const moveFormRef = ref<FormInstance>()

const folderRules = {
    name: [{ required: true, min: 1, message: t('system.file.folderNameRequired'), trigger: 'blur' }],
}

const normalizeMoveTargetFolderId = (value?: number | string | null) => (value === '' || value === ROOT_FOLDER_KEY || value === undefined || value === 0 || value === '0' ? null : value)
const moveFormData = computed(() => ({ target_folder_id: normalizeMoveTargetFolderId(moveTargetFolderId.value) }))
const moveRules = {}

const handleSubmitFolderDialog = async () => {
    const valid = await folderFormRef.value?.validate().catch(() => false)
    if (!valid) return
    await submitFolderDialog()
}

const handleSubmitMoveDialog = async () => {
    moveTargetFolderId.value = normalizeMoveTargetFolderId(moveTargetFolderId.value)
    const valid = await moveFormRef.value?.validate().catch(() => false)
    if (!valid) return
    await submitMoveDialog()
}

const handleBreadcrumbClick = (folderId: number | string | null) => {
    selectedFolderId.value = folderId === ROOT_FOLDER_KEY ? null : folderId
    selectedFiles.value = []
    queryWhere.folder_id = selectedFolderId.value
    handleSearch()
}

const handleSingleMove = (file: SystemFile) => {
    selectedFiles.value = [file]
    openBatchMoveDialog()
}

const toFolderOperationItem = (folder: SystemFileFolder): FileOperationItem => ({
    ...folder,
    item_type: 'folder',
    origin_name: folder.name,
})

const isFolderLikeRow = (row?: { item_type?: string; file_type?: string } | null) => row?.item_type === 'folder' || row?.file_type === 'folder'
const hasCellValue = (value: unknown) => value !== undefined && value !== null && value !== ''

const getFolderUploaderName = (row: Extract<FileListRow, { item_type: 'folder' }>) => {
    return row.uploader_name || row.creator_name || row.uploader_username || row.creator_username || (hasCellValue(row.created_by) ? String(row.created_by) : '-')
}

const toListFolderRow = (folder: FolderRowSource): Extract<FileListRow, { item_type: 'folder' }> => {
    const folderWithoutChildren = { ...folder }
    delete folderWithoutChildren.children
    const name = String(folder.name || folder.origin_name || folder.display_name || '')
    const uploaderName = folder.uploader_name || folder.creator_name || ''
    const uploaderUsername = folder.uploader_username || folder.creator_username || ''
    return {
        ...folderWithoutChildren,
        item_type: 'folder',
        list_key: `folder-${folder.id}`,
        origin_name: name,
        name,
        file_type: 'folder',
        size: folder.total_size || folder.size || 0,
        reference_count: 0,
        uploader_name: uploaderName,
        uploader_username: uploaderUsername,
    } as Extract<FileListRow, { item_type: 'folder' }>
}

const handleFolderAction = (command: string, folder: SystemFileFolder | null) => {
    if (!folder) return
    const folderItem = toFolderOperationItem(folder)

    if (command === 'rename') {
        openRenameDialog(folderItem)
        return
    }

    if (command === 'move') {
        selectedFiles.value = [folderItem]
        openBatchMoveDialog()
        return
    }

    if (command === 'delete') {
        void handleDelete(folderItem)
        return
    }

    handleFolderCommand(command, folder)
}

const isFolderListRow = (row?: FileListRow | FileOperationItem): row is Extract<FileListRow, { item_type: 'folder' }> => isFolderLikeRow(row)
const getOperationItemKey = (item: FileOperationItem) => `${item.item_type === 'folder' ? 'folder' : 'file'}-${item.id}`

const listTableRows = computed<FileListRow[]>(() => {
    const rows = fileList.value.map((file) => {
        if (isFolderLikeRow(file)) {
            return toListFolderRow(file)
        }
        return {
            ...file,
            item_type: 'file' as const,
            list_key: `file-${file.id}`,
        }
    })

    if (selectedCategory.value !== 'all') return rows

    const folderRows = currentLevelFolders.value.map(toListFolderRow)

    const uniqueRows = new Map<string, FileListRow>()
    for (const row of [...folderRows, ...rows]) {
        uniqueRows.set(row.list_key, row)
    }
    return [...uniqueRows.values()]
})

const isFileListRowSelectable = () => true

const handleListSelectionChange = (selection: FileListRow[]) => {
    handleSelectionChange(selection)
}

const handleListNameClick = (row: FileListRow) => {
    if (isFolderListRow(row)) {
        handleFolderSelect(row)
        return
    }
    openDetailDrawer(row)
}

// ==================== 全选/反选计算与逻辑 ====================
const gridSelectableItems = computed<FileOperationItem[]>(() => {
    const fileRows = displayFiles.value.map((file) => ({
        ...file,
        item_type: 'file' as const,
    }))

    if (selectedCategory.value !== 'all') return fileRows

    return [...currentLevelFolders.value.map(toFolderOperationItem), ...fileRows]
})

const selectedCurrentGridCount = computed(() => {
    const selectedKeys = new Set(selectedFiles.value.map(getOperationItemKey))
    return gridSelectableItems.value.filter((item) => selectedKeys.has(getOperationItemKey(item))).length
})

const isAllSelected = computed(() => {
    return gridSelectableItems.value.length > 0 && selectedCurrentGridCount.value === gridSelectableItems.value.length
})

const isIndeterminate = computed(() => {
    return selectedCurrentGridCount.value > 0 && selectedCurrentGridCount.value < gridSelectableItems.value.length
})

const handleToggleSelectAll = (val: boolean) => {
    if (val) {
        selectedFiles.value = [...gridSelectableItems.value]
    } else {
        selectedFiles.value = []
    }
}

// ==================== 滚动加载与网格展示逻辑 ====================
const allFilesList = ref<SystemFile[]>([])

const displayFiles = computed(() => {
    return viewMode.value === 'grid' ? allFilesList.value : fileList.value
})

const noMore = computed(() => {
    return fileList.value.length === 0 || allFilesList.value.length >= pagination.total
})

const scrollDisabled = computed(() => {
    return viewMode.value !== 'grid' || loading.value || noMore.value
})

const loadMore = async () => {
    if (viewMode.value !== 'grid' || loading.value || noMore.value) return
    const nextPage = (queryWhere.page || 1) + 1
    queryWhere.page = nextPage
    pagination.page = nextPage
    await rawGetList()
}

const handleScrollEnd = (direction: 'top' | 'bottom' | 'left' | 'right') => {
    if (direction === 'bottom' && !scrollDisabled.value) {
        void loadMore()
    }
}

// 监听视图模式切换，重置参数并重新加载
watch(viewMode, (newMode) => {
    queryWhere.page = 1
    pagination.page = 1
    queryWhere.per_page = newMode === 'grid' ? 40 : 10
    pagination.pageSize = newMode === 'grid' ? 40 : 10

    selectedFiles.value = []
    allFilesList.value = []
    fileList.value = []

    void handleSearch()
})

const fileTypeOptions = computed(() => [
    { label: t('system.file.fileTypes.image'), value: 'image' },
    { label: t('system.file.fileTypes.document'), value: 'document' },
    { label: t('system.file.fileTypes.pdf'), value: 'pdf' },
    { label: t('system.file.fileTypes.word'), value: 'word' },
    { label: t('system.file.fileTypes.excel'), value: 'excel' },
    { label: t('system.file.fileTypes.ppt'), value: 'ppt' },
    { label: t('system.file.fileTypes.archive'), value: 'archive' },
    { label: t('system.file.fileTypes.text'), value: 'text' },
    { label: t('system.file.fileTypes.audio'), value: 'audio' },
    { label: t('system.file.fileTypes.video'), value: 'video' },
    { label: t('system.file.fileTypes.other'), value: 'other' },
])

const storageDriverOptions = computed(() => [
    { label: t('system.file.storageDrivers.local'), value: 'local' },
    { label: t('system.file.storageDrivers.aliyunOss'), value: 'aliyun_oss' },
])

const storageStatusOptions = computed(() => [
    { label: t('system.file.storageStatuses.stored'), value: 'stored' },
    { label: t('system.file.storageStatuses.deleteFailed'), value: 'delete_failed' },
])

const storageStatusLabelOptions = computed(() => [
    ...storageStatusOptions.value,
    { label: t('system.file.storageStatuses.normal'), value: 'normal' },
    { label: t('system.file.storageStatuses.uploading'), value: 'uploading' },
    { label: t('system.file.storageStatuses.missing'), value: 'missing' },
])

const getFileTypeLabel = (value?: string) => fileTypeOptions.value.find((item) => item.value === value)?.label || value || '-'

const isImageFile = (row?: FileListRow | SystemFile) => {
    if (!row) return false
    if ('item_type' in row && row.item_type === 'folder') return false
    return row.file_type === 'image' || String(row.mime_type || '').startsWith('image/')
}

const getFileThumbnailUrl = (row?: FileListRow | SystemFile) => {
    if (!row) return ''
    if ('item_type' in row && row.item_type === 'folder') return ''
    return row.thumbnail_url || row.url || (row.uuid ? getImageUrl(row.uuid) : '')
}

const getFilePreviewList = (row?: FileListRow | SystemFile) => {
    if (!row) return []
    if ('item_type' in row && row.item_type === 'folder') return []
    const url = row.url || (row.uuid ? getImageUrl(row.uuid) : '')
    return url ? [url] : []
}

const getStorageDriverLabel = (value?: string) => storageDriverOptions.value.find((item) => item.value === value)?.label || value || '-'

const getStorageDriverTagType = (value?: string) => {
    const typeMap: Record<string, string> = { local: 'info', aliyun_oss: 'success' }
    return typeMap[value || ''] || 'info'
}

const getStorageStatusLabel = (value?: string) => storageStatusLabelOptions.value.find((item) => item.value === value)?.label || value || '-'

const getStorageStatusTagType = (value?: string) => {
    const typeMap: Record<string, string> = {
        stored: 'success',
        normal: 'success',
        uploading: 'warning',
        delete_failed: 'danger',
        missing: 'danger',
    }
    return typeMap[value || ''] || 'info'
}

const actionButtons = (scope: TableScope<FileListRow> | FileListRow): ActionButtonConfig<FileListRow>[] => {
    const row = 'row' in scope ? scope.row : scope
    const isFolder = isFolderListRow(row)
    return [
        {
            permission: 'file:list',
            text: t('common.actions.detail'),
            showIcon: false,
            click: (targetRow: FileListRow) => openDetailDrawer(targetRow),
        },
        {
            permission: 'file:update',
            text: isFolder ? t('system.file.renameFolder') : t('system.file.renameFile'),
            showIcon: false,
            click: (targetRow: FileListRow) => openRenameDialog(targetRow),
        },
        {
            permission: 'file:update',
            text: isFolder ? t('system.file.moveFolder') : t('system.file.moveFile'),
            showIcon: false,
            click: (targetRow: FileListRow) => {
                selectedFiles.value = [targetRow]
                openBatchMoveDialog()
            },
        },
        {
            permission: 'file:delete',
            text: t('common.actions.delete'),
            type: 'danger',
            showIcon: false,
            disabled: (targetRow: FileListRow) => deletingId.value === targetRow.id,
            click: (targetRow: FileListRow) => {
                handleDelete(targetRow)
            },
        },
    ]
}

const trashActionButtons = computed(() => [
    {
        permission: 'file:delete',
        text: t('system.file.restore'),
        type: 'primary',
        showIcon: false,
        disabled: (row: SystemFile) => trashOperatingId.value === row.id,
        click: (row: SystemFile) => handleRestore(row),
    },
    {
        permission: 'file:delete',
        text: t('system.file.destroy'),
        type: 'danger',
        showIcon: false,
        disabled: (row: SystemFile) => trashOperatingId.value === row.id,
        click: (row: SystemFile) => handleDestroy(row),
    },
])

const columns = computed(
    () =>
        [
            { prop: 'origin_name', label: t('system.file.originName'), h_label: t('system.file.originName'), minWidth: 260, overflow: true, type: 'custom' },
            { prop: 'file_type', label: t('system.file.fileType'), h_label: t('system.file.fileType'), width: 100, align: 'center', formatter: (row) => getFileTypeLabel(row.file_type) },
            { prop: 'size', label: t('system.file.size'), h_label: t('system.file.size'), width: 100, align: 'right', formatter: (row) => formatFileSize(row.size) },
            { prop: 'mime_type', label: t('system.file.mimeType'), h_label: t('system.file.mimeType'), minWidth: 140, overflow: true },
            {
                prop: 'is_public',
                label: t('system.file.publicStatus'),
                h_label: t('system.file.publicStatus'),
                h_tip: t('system.file.publicStatusTip'),
                width: 120,
                align: 'center',
                type: 'tag',
                tag: {
                    1: { type: 'success', text: t('common.yes') },
                    0: { type: 'info', text: t('common.no') },
                },
            },
            { prop: 'storage_driver', label: t('system.file.storageDriver'), h_label: t('system.file.storageDriver'), width: 130, align: 'center', type: 'custom' },
            { prop: 'storage_status', label: t('system.file.storageStatus'), h_label: t('system.file.storageStatus'), width: 130, align: 'center', type: 'custom' },
            { prop: 'reference_count', label: t('system.file.referenceCount'), h_label: t('system.file.referenceCount'), width: 110, align: 'center', type: 'custom' },
            { prop: 'uploader_name', label: t('system.file.uploaderName'), h_label: t('system.file.uploaderName'), width: 120, align: 'center', formatter: (row) => row.uploader_name || row.uploader_username || '-' },
            { prop: 'uuid', label: t('system.file.uuid'), h_label: t('system.file.uuid'), minWidth: 260, overflow: true },
            { prop: 'created_at', label: t('common.labels.createdAt'), h_label: t('common.labels.createdAt'), width: 180, align: 'center' },
        ] as ProTableColumns<FileListRow>
)

const trashColumns = computed(
    () =>
        [
            { prop: 'origin_name', label: t('system.file.originName'), h_label: t('system.file.originName'), minWidth: 260, overflow: true, type: 'custom' },
            { prop: 'file_type', label: t('system.file.fileType'), h_label: t('system.file.fileType'), width: 100, align: 'center', formatter: (row) => getFileTypeLabel(row.file_type) },
            { prop: 'storage_driver', label: t('system.file.storageDriver'), h_label: t('system.file.storageDriver'), width: 130, align: 'center', type: 'custom' },
            { prop: 'storage_status', label: t('system.file.storageStatus'), h_label: t('system.file.storageStatus'), width: 130, align: 'center', type: 'custom' },
            { prop: 'reference_count', label: t('system.file.referenceCount'), h_label: t('system.file.referenceCount'), width: 110, align: 'center' },
            { prop: 'deleted_at', label: t('system.file.deletedAt'), h_label: t('system.file.deletedAt'), width: 180, align: 'center' },
            { prop: 'deleted_by', label: t('system.file.deletedBy'), h_label: t('system.file.deletedBy'), width: 120, align: 'center' },
            { prop: 'deleted_reason', label: t('system.file.deletedReason'), h_label: t('system.file.deletedReason'), minWidth: 180, overflow: true },
        ] as ProTableColumns<SystemFile>
)

onMounted(() => {
    loadFolderTree()
    getList()
})
</script>

<style scoped lang="scss">
.file-content-wrapper {
    flex: 1;
    overflow: hidden;
    padding: var(--xl-space-5);
    position: relative;
    min-width: 0;
    min-height: 0;
}

.file-list-view {
    height: 100%;
}

.file-name-cell {
    display: flex;
    align-items: center;
    gap: var(--xl-space-3);
    cursor: pointer;

    &:hover .file-name-text {
        color: var(--el-color-primary);
    }
}

.file-thumbnail,
.file-thumbnail-placeholder {
    width: 32px;
    height: 32px;
    border-radius: var(--xl-radius-sm);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--el-fill-color-light);
    position: relative;
}

.file-ext {
    position: absolute;
    bottom: -2px;
    font-size: 8px;
    font-weight: 700;
    color: var(--el-text-color-placeholder);
    background: var(--el-fill-color-light);
    padding: 0 2px;
    border-radius: 2px;
}

.file-name-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    transition: color 0.2s;
}

.upload-drag-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(var(--el-color-primary-rgb), 0.1);
    border: 2px dashed var(--el-color-primary);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;

    .drag-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--xl-space-3);
        color: var(--el-color-primary);
        font-weight: 600;

        .drag-icon {
            font-size: 48px;
        }
    }
}

.file-upload-input {
    display: none;
}

.reference-dialog-table {
    margin-top: 10px;
}
</style>
