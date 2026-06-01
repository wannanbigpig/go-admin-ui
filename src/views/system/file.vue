<template>
    <FileExplorerLayout>
        <template #sidebar>
            <FileSidebar
                :folder-tree="folderTree"
                :selected-folder-id="selectedFolderId"
                :selected-category="selectedCategory"
                @select-category="selectCategory"
                @select-folder="handleFolderSelect"
                @folder-command="({ command, folder }) => handleFolderCommand(command, folder)"
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
                v-infinite-scroll="loadMore"
                :infinite-scroll-disabled="scrollDisabled"
                :infinite-scroll-distance="30"
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
                    @clear="clearTasks"
                    @retry="retryUploadTask"
                />

                <FileGrid
                    v-if="viewMode === 'grid'"
                    :files="displayFiles"
                    :folders="currentLevelFolders"
                    :selected-category="selectedCategory"
                    :selected-files="selectedFiles"
                    @selection-change="handleSelectionChange"
                    @folder-click="handleFolderSelect"
                    @file-click="openDetailDrawer"
                    @folder-command="({ command, folder }) => handleFolderCommand(command, folder)"
                    @delete-file="handleDelete"
                    @move-file="handleSingleMove"
                />

                <div v-else class="file-list-view">
                    <xl-pro-table :loading="loading" :data="fileList" :columns="columns" :pagination="pagination" selectable @selection-change="handleSelectionChange">
                        <template #td="{ item, val, row }">
                            <div v-if="item.prop === 'origin_name'" class="file-name-cell" @click="openDetailDrawer(row)">
                                <el-image
                                    v-if="isImageFile(row) && getFileThumbnailUrl(row)"
                                    :src="getFileThumbnailUrl(row)"
                                    fit="cover"
                                    class="file-thumbnail"
                                    :preview-src-list="getFilePreviewList(row)"
                                    preview-teleported
                                    hide-on-click-modal
                                    @click.stop
                                />
                                <div v-else class="file-thumbnail-placeholder">
                                    <el-icon color="var(--el-text-color-placeholder)"><Document /></el-icon>
                                    <span class="file-ext" v-if="row.ext">{{ String(row.ext).substring(0, 4).toUpperCase() }}</span>
                                </div>
                                <span class="file-name-text">{{ val || '-' }}</span>
                            </div>
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
                            <el-table-column width="130" :label="t('common.labels.operation')" align="center" fixed="right">
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
                <el-form label-width="90px">
                    <el-form-item :label="t('system.file.folderName')">
                        <el-input v-model.trim="folderForm.name" :placeholder="t('system.file.folderNamePlaceholder')" @keyup.enter="submitFolderDialog" />
                    </el-form-item>
                    <el-form-item :label="t('system.file.parentFolder')">
                        <el-tree-select v-model="folderForm.parent_id" :data="folderSelectOptions" :props="{ label: 'name', children: 'children', value: 'id' }" check-strictly clearable />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showFolderDialog = false">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" :loading="folderSubmitting" @click="submitFolderDialog">{{ t('common.actions.confirm') }}</el-button>
                </template>
            </el-dialog>

            <el-dialog v-model="showMoveDialog" :title="moveDialogTitle" width="420px" append-to-body>
                <el-form label-width="90px">
                    <el-form-item :label="t('system.file.targetFolder')">
                        <el-tree-select v-model="moveTargetFolderId" :data="folderSelectOptions" :props="{ label: 'name', children: 'children', value: 'id' }" check-strictly clearable />
                    </el-form-item>
                </el-form>
                <template #footer>
                    <el-button @click="showMoveDialog = false">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" :loading="moveSubmitting" @click="submitMoveDialog">{{ t('common.actions.confirm') }}</el-button>
                </template>
            </el-dialog>

            <FileDetailDrawer v-model="showDetailDrawer" :file="currentDetail" :references="detailReferences" :loading="detailLoading" />

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
                <xl-pro-table :loading="trashLoading" :data="trashList" :columns="trashColumns" :pagination="trashPagination" selectable @selection-change="handleTrashSelectionChange">
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
import { Document, UploadFilled } from '@element-plus/icons-vue'
import xlProTable from '@/components/proTable/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import { useI18n } from 'vue-i18n'
import { useListPage } from '@/composables/useListPage'
import { createSystemFileQuery } from '@/modules/system/model'
import { fetchSystemFileList } from '@/modules/system/service'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import { debounce, formatFileSize } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import type { ProTableColumns } from '@/components/proTable/types'
import type { SystemFile } from '@/types/system'

import { useFileFolder, ROOT_FOLDER_KEY } from './composables/useFileFolder'
import { useFileOperations } from './composables/useFileOperations'
import { useFileCategory } from './composables/useFileCategory'
import { useFileExport } from './composables/useFileExport'
import { useFileUploadFlow } from './composables/useFileUploadFlow'

import FileSidebar from './components/FileSidebar.vue'
import FileToolbar from './components/FileToolbar.vue'
import FileGrid from './components/FileGrid.vue'
import FileDetailDrawer from './components/FileDetailDrawer.vue'
import FileUploadQueue from './components/FileUploadQueue.vue'
import FileExplorerLayout from './components/FileExplorerLayout.vue'

const { t } = useI18n()

const queryFormRef = ref()
const queryWhere = reactive(createSystemFileQuery())
queryWhere.per_page = 40
const dateRange = ref<[string, string] | []>([])
const viewMode = ref<'grid' | 'list'>('grid')

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
    clearTasks,
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
} = useFileOperations({
    selectedFolderId,
    getList,
    loadFolderTree,
})

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

// ==================== 全选/反选计算与逻辑 ====================
const isAllSelected = computed(() => {
    return displayFiles.value.length > 0 && selectedFiles.value.length === displayFiles.value.length
})

const isIndeterminate = computed(() => {
    return selectedFiles.value.length > 0 && selectedFiles.value.length < displayFiles.value.length
})

const handleToggleSelectAll = (val: boolean) => {
    if (val) {
        selectedFiles.value = [...displayFiles.value]
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

// 监听视图模式切换，重置参数并重新加载
watch(viewMode, (newMode) => {
    queryWhere.page = 1
    pagination.page = 1
    queryWhere.per_page = newMode === 'grid' ? 40 : 10
    pagination.pageSize = newMode === 'grid' ? 40 : 10

    selectedFiles.value = []
    allFilesList.value = []

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
    { label: t('system.file.storageStatuses.normal'), value: 'normal' },
    { label: t('system.file.storageStatuses.uploading'), value: 'uploading' },
    { label: t('system.file.storageStatuses.deleteFailed'), value: 'delete_failed' },
    { label: t('system.file.storageStatuses.missing'), value: 'missing' },
])

const getFileTypeLabel = (value?: string) => fileTypeOptions.value.find((item) => item.value === value)?.label || value || '-'

const isImageFile = (row?: SystemFile) => {
    if (!row) return false
    return row.file_type === 'image' || String(row.mime_type || '').startsWith('image/')
}

const getFileThumbnailUrl = (row?: SystemFile) => {
    if (!row) return ''
    return row.thumbnail_url || row.url || ''
}

const getFilePreviewList = (row?: SystemFile) => {
    if (!row?.url) return []
    return [row.url]
}

const getStorageDriverLabel = (value?: string) => storageDriverOptions.value.find((item) => item.value === value)?.label || value || '-'

const getStorageDriverTagType = (value?: string) => {
    const typeMap: Record<string, string> = { local: 'info', aliyun_oss: 'success' }
    return typeMap[value || ''] || 'info'
}

const getStorageStatusLabel = (value?: string) => storageStatusOptions.value.find((item) => item.value === value)?.label || value || '-'

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

const actionButtons = computed(() => [
    {
        permission: 'file:list',
        text: t('common.actions.detail'),
        showIcon: false,
        click: (row: SystemFile) => openDetailDrawer(row),
    },
    {
        permission: 'file:delete',
        text: t('common.actions.delete'),
        type: 'danger',
        showIcon: false,
        disabled: (row: SystemFile) => deletingId.value === row.id,
        click: (row: SystemFile) => handleDelete(row),
    },
])

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
            { prop: 'file_type', label: t('system.file.fileType') || '文件类型', h_label: t('system.file.fileType') || '文件类型', width: 100, align: 'center', formatter: (row) => getFileTypeLabel(row.file_type) },
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
            { prop: 'uuid', label: t('system.file.uuid'), h_label: t('system.file.uuid'), minWidth: 260, overflow: true },
            { prop: 'created_at', label: t('common.labels.createdAt'), h_label: t('common.labels.createdAt'), width: 180, align: 'center' },
        ] as ProTableColumns<SystemFile>
)

const trashColumns = computed(
    () =>
        [
            { prop: 'origin_name', label: t('system.file.originName'), h_label: t('system.file.originName'), minWidth: 260, overflow: true, type: 'custom' },
            { prop: 'file_type', label: t('system.file.fileType') || '文件类型', h_label: t('system.file.fileType') || '文件类型', width: 100, align: 'center', formatter: (row) => getFileTypeLabel(row.file_type) },
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
    overflow: auto;
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
