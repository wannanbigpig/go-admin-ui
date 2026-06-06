<template>
    <div class="file-picker">
        <button class="file-picker-trigger" type="button" @click="openDialog">
            <template v-if="selectedItems.length">
                <el-image v-if="isImage(selectedItems[0])" :src="getThumbnailUrl(selectedItems[0])" fit="cover" class="file-picker-avatar" :alt="selectedItems[0].origin_name || ''" />
                <span v-else class="file-picker-file">{{ selectedItems[0].origin_name || selectedItems[0].uuid || selectedItems[0].id }}</span>
            </template>
            <el-icon v-else class="file-picker-empty"><i-ep-plus /></el-icon>
        </button>
        <el-button v-if="selectedItems.length" class="file-picker-clear" size="small" link type="danger" @click="clearSelection">{{ t('common.actions.reset') }}</el-button>
        <input ref="uploadInputRef" class="file-picker-input" type="file" :multiple="multiple" :accept="accept" @change="handleUploadInputChange" />

        <el-dialog v-model="showDialog" :title="t('filePicker.title')" width="880px" append-to-body @open="handleDialogOpen">
            <div class="file-picker-dialog">
                <aside v-loading="folderLoading" class="file-picker-folders">
                    <div class="file-picker-panel-title">{{ t('system.file.folderTitle') }}</div>
                    <el-tree
                        :data="folderTreeWithRoot"
                        node-key="id"
                        highlight-current
                        default-expand-all
                        :current-node-key="selectedFolderKey"
                        :props="{ label: 'name', children: 'children' }"
                        @node-click="handleFolderSelect"
                    />
                </aside>
                <section class="file-picker-files">
                    <div class="file-picker-toolbar">
                        <el-input v-model.trim="query.origin_name" :placeholder="t('system.file.originNamePlaceholder')" clearable @keyup.enter="reloadList" />
                        <el-button type="primary" :loading="loading" @click="reloadList">{{ t('common.actions.search') }}</el-button>
                        <el-button @click="triggerUpload">{{ t(uploadButtonTextKey) }}</el-button>
                        <div v-if="showImageViewToggle" class="file-picker-view-toggle">
                            <el-button-group>
                                <el-button :type="viewMode === 'grid' ? 'primary' : ''" @click="setViewMode('grid')">
                                    <el-icon><Menu /></el-icon>
                                    <span>{{ t('filePicker.gridView') }}</span>
                                </el-button>
                                <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="setViewMode('list')">
                                    <el-icon><List /></el-icon>
                                    <span>{{ t('filePicker.listView') }}</span>
                                </el-button>
                            </el-button-group>
                        </div>
                    </div>
                    <div
                        class="file-picker-dropzone"
                        :class="{ 'is-dragging': isDraggingUpload }"
                        @dragenter.prevent="handleUploadDragEnter"
                        @dragover.prevent="handleUploadDragOver"
                        @dragleave.prevent="handleUploadDragLeave"
                        @drop.prevent="handleUploadDrop"
                        @click="triggerUpload"
                    >
                        <div class="file-picker-drop-title">{{ t(dropUploadTitleKey) }}</div>
                        <div class="file-picker-drop-tip">{{ t(dropUploadTipKey) }}</div>
                    </div>
                    <div v-if="uploadTasks.length" class="file-picker-upload-queue">
                        <div v-for="task in uploadTasks" :key="task.id" class="file-picker-upload-task">
                            <div class="file-picker-upload-meta">
                                <span class="file-picker-upload-name">{{ task.name }}</span>
                                <el-tag size="small" :type="getUploadTaskTagType(task.status)">{{ getUploadTaskStatusLabel(task.status) }}</el-tag>
                            </div>
                            <el-progress :percentage="task.progress" :status="getUploadProgressStatus(task.status)" />
                            <div v-if="task.error" class="file-picker-upload-error">{{ task.error }}</div>
                        </div>
                    </div>
                    <div v-if="viewMode === 'grid'" v-loading="loading" class="file-picker-grid">
                        <button
                            v-for="row in fileList"
                            :key="row.id"
                            type="button"
                            class="file-picker-grid-card"
                            :class="{ 'is-selected': isFileSelected(row) }"
                            @click="handleGridItemClick(row)"
                            @dblclick="handleGridItemDblClick(row)"
                        >
                            <div class="file-picker-grid-media">
                                <el-image v-if="isImage(row)" :src="getThumbnailUrl(row)" fit="cover" class="file-picker-grid-thumb" lazy :alt="row.display_name || row.origin_name || ''" />
                                <div v-else class="file-picker-grid-file">{{ getFileExt(row) }}</div>
                                <div v-if="isFileSelected(row)" class="file-picker-grid-selected">
                                    <el-icon><Check /></el-icon>
                                </div>
                            </div>
                            <div class="file-picker-grid-name" :title="row.display_name || row.origin_name || row.uuid || '-'">
                                {{ row.display_name || row.origin_name || row.uuid || '-' }}
                            </div>
                            <div class="file-picker-grid-meta">{{ formatFileSize(row.size) }}</div>
                        </button>
                        <el-empty v-if="!loading && fileList.length === 0" :description="t('common.noData')" class="file-picker-empty-state" />
                    </div>
                    <el-table
                        v-else
                        ref="tableRef"
                        v-loading="loading"
                        :data="fileList"
                        row-key="id"
                        height="300"
                        highlight-current-row
                        :current-row-key="selectedRowKey"
                        :row-class-name="getTableRowClassName"
                        @selection-change="handleSelectionChange"
                        @row-click="handleRowClick"
                        @row-dblclick="handleRowDblClick"
                    >
                        <el-table-column v-if="multiple" type="selection" width="48" />
                        <el-table-column :label="t('system.file.originName')" min-width="240" show-overflow-tooltip>
                            <template #default="{ row }">
                                <div class="file-picker-name">
                                    <el-image v-if="isImage(row)" :src="getThumbnailUrl(row)" fit="cover" class="file-picker-list-thumb" lazy :alt="row.display_name || row.origin_name || ''" />
                                    <div v-else class="file-picker-list-file">{{ getFileExt(row) }}</div>
                                    <span>{{ row.display_name || row.origin_name || row.uuid || '-' }}</span>
                                </div>
                            </template>
                        </el-table-column>
                        <el-table-column prop="uuid" :label="t('system.file.uuid')" min-width="220" show-overflow-tooltip />
                        <el-table-column :label="t('system.file.size')" width="110" align="right">
                            <template #default="{ row }">{{ formatFileSize(row.size) }}</template>
                        </el-table-column>
                    </el-table>
                    <el-pagination
                        class="file-picker-pagination"
                        layout="total, prev, pager, next"
                        :total="pagination.total"
                        :current-page="pagination.page"
                        :page-size="pagination.per_page"
                        @current-change="handlePageChange"
                    />
                </section>
            </div>
            <template #footer>
                <el-button @click="showDialog = false">{{ t('common.actions.cancel') }}</el-button>
                <el-button type="primary" :disabled="selectedRows.length === 0" @click="confirmSelection">{{ t('common.actions.confirm') }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch, onUnmounted } from 'vue'
import { Check, List, Menu } from '@element-plus/icons-vue'
import { ElMessage, type TableInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { fetchSystemFileFolderTree, fetchSystemFileList } from '@/modules/system/service'
import { useFileUpload, type UploadTaskStatus } from '@/composables/useFileUpload'
import { getImageUrl } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import type { StorageDriver, SystemFile, SystemFileFolder } from '@/types/system'

export interface FilePickerValue {
    id?: number | string
    uuid?: string
    url?: string
    thumbnail_url?: string
    origin_name?: string
}

type FolderTreeNode = SystemFileFolder & { isRoot?: boolean; children?: FolderTreeNode[] }
type FilePickerMode = 'single-image' | 'single-file' | 'multi-file'
type FilePickerViewMode = 'grid' | 'list'

const ROOT_FOLDER_KEY = '__root__'
const GRID_PAGE_SIZE = 15
const LIST_PAGE_SIZE = 15

const props = withDefaults(
    defineProps<{
        modelValue?: string | FilePickerValue | FilePickerValue[] | null
        multiple?: boolean
        accept?: string
        maxSize?: number
        folderId?: number | string | null
        driver?: StorageDriver
    }>(),
    {
        modelValue: null,
        multiple: false,
        accept: '',
        maxSize: 0,
        folderId: null,
        driver: undefined,
    }
)

const emit = defineEmits<{
    (event: 'update:modelValue', value: string | FilePickerValue | FilePickerValue[] | null): void
    (event: 'change', value: FilePickerValue | FilePickerValue[] | null): void
}>()

let uploadTimer: number | undefined

const acceptsImage = () => props.accept.split(',').some((item) => item.trim().startsWith('image/'))

const { t } = useI18n()
const pickerMode = computed<FilePickerMode>(() => {
    if (props.multiple) return 'multi-file'
    return acceptsImage() ? 'single-image' : 'single-file'
})
const showImageViewToggle = computed(() => pickerMode.value === 'single-image')
const showDialog = ref(false)
const loading = ref(false)
const folderLoading = ref(false)
const tableRef = ref<TableInstance>()
const uploadInputRef = ref<HTMLInputElement>()
const fileList = ref<SystemFile[]>([])
const folderTree = ref<SystemFileFolder[]>([])
const selectedRows = ref<SystemFile[]>([])
const selectedItems = ref<FilePickerValue[]>([])
const selectedFolderId = ref<number | string | null>(props.folderId)
const { uploadTasks, createUploadTask, runUploadQueue, clearTasks } = useFileUpload()
const isDraggingUpload = ref(false)
const viewMode = ref<FilePickerViewMode>(pickerMode.value === 'single-image' ? 'grid' : 'list')
const query = reactive({
    origin_name: '',
})
const pagination = reactive({
    page: 1,
    per_page: LIST_PAGE_SIZE,
    total: 0,
})

const getPageSize = (mode = pickerMode.value, currentView = viewMode.value) => {
    if (mode === 'single-image' && currentView === 'grid') return GRID_PAGE_SIZE
    return LIST_PAGE_SIZE
}

const selectedFolderKey = computed(() => selectedFolderId.value ?? ROOT_FOLDER_KEY)
const selectedRowKey = computed(() => selectedRows.value[0]?.id)
const folderTreeWithRoot = computed<FolderTreeNode[]>(() => [
    {
        id: ROOT_FOLDER_KEY,
        parent_id: null,
        name: t('system.file.allFiles'),
        isRoot: true,
        children: folderTree.value as FolderTreeNode[],
        created_at: '',
        updated_at: '',
    },
])
const uploadButtonTextKey = computed(() => (pickerMode.value === 'single-image' ? 'filePicker.uploadImage' : 'filePicker.upload'))
const dropUploadTitleKey = computed(() => (pickerMode.value === 'single-image' ? 'filePicker.dropUploadImageTitle' : 'filePicker.dropUploadTitle'))
const dropUploadTipKey = computed(() => {
    if (pickerMode.value === 'single-image') return 'filePicker.dropUploadImageTip'
    if (pickerMode.value === 'single-file') return 'filePicker.dropUploadSingleFileTip'
    return 'filePicker.dropUploadTip'
})

const normalizeValue = (value: typeof props.modelValue): FilePickerValue[] => {
    if (!value) return []
    const currentItems = selectedItems.value
    if (typeof value === 'string') {
        if (/^https?:\/\//.test(value) || value.startsWith('/')) {
            const existing = currentItems.find((item) => item.url === value)
            return existing ? [{ ...existing }] : [{ url: value }]
        }
        const existing = currentItems.find((item) => item.uuid === value)
        return existing ? [{ ...existing }] : [{ uuid: value }]
    }
    return (Array.isArray(value) ? value : [value]).map((item) => ({ ...item }))
}

const matchesPickerValue = (file: SystemFile, item: FilePickerValue) => {
    if (item.id != null && String(file.id) === String(item.id)) return true
    if (item.uuid && file.uuid === item.uuid) return true
    if (item.url && file.url === item.url) return true
    return false
}

const syncSelectedRowsWithCurrentPage = () => {
    if (selectedItems.value.length === 0) {
        selectedRows.value = []
        return
    }

    const matchedRows = fileList.value.filter((file) => selectedItems.value.some((item) => matchesPickerValue(file, item)))
    selectedRows.value = props.multiple ? matchedRows : matchedRows.slice(0, 1)
}

watch(
    () => props.modelValue,
    (value) => {
        selectedItems.value = normalizeValue(value)
        syncSelectedRowsWithCurrentPage()
    },
    { immediate: true }
)

const toPickerValue = (file: SystemFile): FilePickerValue => ({
    id: file.id,
    uuid: file.uuid,
    url: file.url,
    thumbnail_url: file.thumbnail_url,
    origin_name: file.display_name || file.origin_name,
})

const getThumbnailUrl = (file: SystemFile | FilePickerValue) => file.thumbnail_url || file.url || (file.uuid ? getImageUrl(file.uuid) : '')

const isImage = (file: SystemFile | FilePickerValue) => {
    const value = file as SystemFile
    return acceptsImage() || value.file_type === 'image' || String(value.mime_type || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(file.url || file.thumbnail_url || file.uuid || ''))
}

const getFileExt = (file: SystemFile) =>
    String(file.ext || file.origin_name?.split('.').pop() || 'FILE')
        .replace(/^\./, '')
        .slice(0, 4)
        .toUpperCase()

const formatFileSize = (size?: number) => {
    const bytes = Number(size || 0)
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB']
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

const normalizeFolderId = (value?: number | string | null) => (value === ROOT_FOLDER_KEY || value === undefined ? null : value)

const openDialog = () => {
    showDialog.value = true
}

const handleDialogOpen = async () => {
    clearTasks()
    selectedRows.value = []
    pagination.per_page = getPageSize()
    await loadFolders()
    await loadList()
}

const loadFolders = async () => {
    folderLoading.value = true
    try {
        folderTree.value = await fetchSystemFileFolderTree()
    } catch (error) {
        Logger.error('加载文件目录失败:', error)
        folderTree.value = []
    } finally {
        folderLoading.value = false
    }
}

const loadList = async () => {
    loading.value = true
    try {
        const result = await fetchSystemFileList({
            page: pagination.page,
            per_page: pagination.per_page,
            origin_name: query.origin_name,
            folder_id: selectedFolderId.value,
            file_type: acceptsImage() ? 'image' : undefined,
        })
        fileList.value = result.list
        pagination.total = result.total
        syncSelectedRowsWithCurrentPage()
    } catch (error) {
        Logger.error('加载文件选择列表失败:', error)
        fileList.value = []
        pagination.total = 0
        selectedRows.value = []
    } finally {
        loading.value = false
    }
}

const reloadList = () => {
    pagination.page = 1
    void loadList()
}

const handleFolderSelect = (folder: FolderTreeNode) => {
    selectedFolderId.value = normalizeFolderId(folder.id)
    selectedRows.value = []
    reloadList()
}

const handlePageChange = (page: number) => {
    pagination.page = page
    void loadList()
}

const handleSelectionChange = (selection: SystemFile[]) => {
    if (props.multiple) {
        selectedRows.value = selection
    }
}

const isFileSelected = (row: SystemFile) => selectedRows.value.some((item) => item.id === row.id)

const handleRowClick = (row: SystemFile) => {
    if (!props.multiple) {
        selectedRows.value = [row]
    } else {
        tableRef.value?.toggleRowSelection(row)
    }
}

const handleRowDblClick = (row: SystemFile) => {
    if (props.multiple) return
    selectedRows.value = [row]
    confirmSelection()
}

const handleGridItemClick = (row: SystemFile) => {
    selectedRows.value = [row]
}

const handleGridItemDblClick = (row: SystemFile) => {
    selectedRows.value = [row]
    confirmSelection()
}

const getTableRowClassName = ({ row }: { row: SystemFile }) => {
    if (props.multiple) return ''
    return isFileSelected(row) ? 'file-picker-row-selected' : ''
}

const emitSelection = (items: FilePickerValue[]) => {
    selectedItems.value = items
    syncSelectedRowsWithCurrentPage()
    const value = props.multiple ? items : items[0] || null
    emit('update:modelValue', props.multiple ? items : items[0]?.uuid || items[0]?.url || null)
    emit('change', value)
}

const confirmSelection = () => {
    emitSelection(selectedRows.value.map(toPickerValue))
    showDialog.value = false
}

const clearSelection = () => {
    emitSelection([])
}

const setViewMode = (mode: FilePickerViewMode) => {
    if (viewMode.value === mode) return
    viewMode.value = mode
}

const triggerUpload = () => {
    uploadInputRef.value?.click()
}

const getUploadTaskStatusLabel = (status: UploadTaskStatus) => {
    const statusMap: Record<UploadTaskStatus, string> = {
        hashing: t('system.file.uploadTaskStatuses.hashing'),
        pending: t('system.file.uploadTaskStatuses.pending'),
        uploading: t('system.file.uploadTaskStatuses.uploading'),
        reuse: t('system.file.uploadTaskStatuses.reuse'),
        success: t('system.file.uploadTaskStatuses.success'),
        error: t('system.file.uploadTaskStatuses.error'),
    }
    return statusMap[status]
}

const getUploadTaskTagType = (status: UploadTaskStatus) => {
    const typeMap: Record<UploadTaskStatus, 'info' | 'warning' | 'success' | 'danger'> = {
        hashing: 'info',
        pending: 'info',
        uploading: 'warning',
        reuse: 'success',
        success: 'success',
        error: 'danger',
    }
    return typeMap[status]
}

const getUploadProgressStatus = (status: UploadTaskStatus) => {
    if (status === 'reuse' || status === 'success') return 'success'
    if (status === 'error') return 'exception'
    return undefined
}

const validateUploadFile = (file: File) => {
    if (props.accept) {
        const acceptList = props.accept.split(',').map((item) => item.trim())
        const ext = '.' + file.name.split('.').pop()?.toLowerCase()
        const mimeType = file.type.toLowerCase()

        const isMatch = acceptList.some((acceptItem) => {
            if (acceptItem.startsWith('.')) {
                return acceptItem.toLowerCase() === ext
            }
            if (acceptItem.includes('/*')) {
                const prefix = acceptItem.replace('/*', '')
                return mimeType.startsWith(prefix)
            }
            return mimeType === acceptItem.toLowerCase()
        })

        if (!isMatch) {
            ElMessage.error(t('filePicker.acceptInvalid'))
            return false
        }
    }
    if (props.maxSize > 0 && file.size > props.maxSize) {
        ElMessage.error(t('filePicker.maxSizeInvalid'))
        return false
    }
    return true
}

const uploadFilesInQueue = async (files: File[]) => {
    const validFiles = files.filter(validateUploadFile)
    if (validFiles.length === 0) return

    const finalFiles =
        pickerMode.value === 'multi-file'
            ? validFiles
            : (() => {
                  if (validFiles.length > 1) {
                      const messageKey = pickerMode.value === 'single-image' ? 'filePicker.singleImageOnlyNotice' : 'filePicker.singleFileOnlyNotice'
                      ElMessage.warning(t(messageKey))
                  }
                  return validFiles.slice(0, 1)
              })()

    const currentTasks = finalFiles.map((file) => createUploadTask(file))
    uploadTasks.value = currentTasks
    const uploaded: SystemFile[] = []
    await runUploadQueue(uploadTasks.value, {
        folderId: selectedFolderId.value,
        driver: props.driver,
        onResult: (result) => {
            if (result) uploaded.push(result as SystemFile)
        },
    })
    if (uploaded.length > 0) {
        emitSelection(props.multiple ? uploaded.map(toPickerValue) : [toPickerValue(uploaded[0])])
        ElMessage.success(t('common.result.uploadSuccess'))
        if (showDialog.value) await loadList()
    }
    if (uploadTasks.value.every((task) => task.status === 'success' || task.status === 'reuse')) {
        uploadTimer = window.setTimeout(() => {
            if (uploadTasks.value === currentTasks) clearTasks()
        }, 1200)
    }
}

const handleUploadInputChange = async (event: Event) => {
    const input = event.target as HTMLInputElement
    const files = Array.from(input.files || [])
    input.value = ''
    await uploadFilesInQueue(files)
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

watch(
    pickerMode,
    (mode) => {
        if (mode !== 'single-image') {
            viewMode.value = 'list'
        }
        pagination.per_page = getPageSize(mode, viewMode.value)
    },
    { immediate: true }
)

watch(viewMode, () => {
    const nextPageSize = getPageSize()
    if (pagination.per_page === nextPageSize) return
    pagination.per_page = nextPageSize
    pagination.page = 1
    if (showDialog.value) {
        void loadList()
    }
})

watch(showDialog, (val) => {
    if (!val) {
        clearTasks()
    }
})

onUnmounted(() => {
    if (uploadTimer) {
        window.clearTimeout(uploadTimer)
    }
})
</script>

<style scoped lang="scss">
.file-picker {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
}

.file-picker-trigger {
    width: 96px;
    height: 96px;
    padding: 0;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    overflow: hidden;
    background: var(--el-fill-color-lighter);
    cursor: pointer;
}

.file-picker-trigger:hover {
    border-color: var(--el-color-primary);
}

.file-picker-avatar {
    width: 100%;
    height: 100%;
}

.file-picker-empty {
    width: 100%;
    height: 100%;
    font-size: 26px;
    color: var(--el-text-color-placeholder);
}

.file-picker-clear {
    margin-left: 0;
}

.file-picker-dialog {
    display: grid;
    grid-template-columns: 180px minmax(0, 1fr);
    gap: 12px;
}

.file-picker-folders {
    min-height: 320px;
    padding: 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    overflow: auto;
}

.file-picker-panel-title {
    margin-bottom: 10px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.file-picker-files {
    min-width: 0;
}

.file-picker-toolbar {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 12px;

    :deep(.el-input) {
        width: 200px;
    }
}

.file-picker-view-toggle {
    margin-left: auto;
}

.file-picker-dropzone {
    margin-bottom: 10px;
    padding: 6px 12px;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    background: var(--el-fill-color-lighter);
    cursor: pointer;
    text-align: center;
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease;
}

.file-picker-dropzone:hover,
.file-picker-dropzone.is-dragging {
    border-color: var(--el-color-primary);
    background: var(--el-color-primary-light-9);
}

.file-picker-drop-title {
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
    color: var(--el-text-color-primary);
}

.file-picker-drop-tip {
    margin-top: 1px;
    font-size: 11px;
    line-height: 14px;
    color: var(--el-text-color-secondary);
}

.file-picker-upload-queue {
    display: grid;
    gap: 8px;
    margin-bottom: 12px;
}

.file-picker-upload-task {
    padding: 8px 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    background: var(--el-fill-color-light);
}

.file-picker-upload-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 6px;
}

.file-picker-upload-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--el-text-color-primary);
}

.file-picker-upload-error {
    margin-top: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--el-color-danger);
}

.file-picker-grid {
    min-height: 340px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
    align-content: start;
}

.file-picker-grid-card {
    position: relative;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-bg-color);
    padding: 8px;
    text-align: left;
    cursor: pointer;
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;
}

.file-picker-grid-card:hover {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 8px 18px rgb(64 158 255 / 12%);
    transform: translateY(-1px);
}

.file-picker-grid-card.is-selected {
    border-color: var(--el-color-primary);
    box-shadow: 0 0 0 1px rgb(64 158 255 / 18%);
}

.file-picker-grid-media {
    position: relative;
    aspect-ratio: 1 / 1;
    border-radius: 8px;
    overflow: hidden;
    background: var(--el-fill-color-light);
}

.file-picker-grid-thumb {
    width: 100%;
    height: 100%;
}

.file-picker-grid-file {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    font-size: 18px;
    font-weight: 600;
}

.file-picker-grid-selected {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    background: var(--el-color-primary);
    color: var(--el-color-white);
    box-shadow: 0 4px 10px rgb(64 158 255 / 28%);
}

.file-picker-grid-name {
    margin-top: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.file-picker-grid-meta {
    margin-top: 2px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
}

.file-picker-empty-state {
    grid-column: 1 / -1;
    align-self: center;
}

.file-picker-file {
    display: block;
    padding: 10px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    word-break: break-all;
}

.file-picker-name {
    display: flex;
    align-items: center;
    gap: 8px;
}

.file-picker-list-thumb,
.file-picker-list-file {
    width: 36px;
    height: 36px;
    flex: none;
    border: 1px solid var(--el-border-color);
    border-radius: 6px;
    overflow: hidden;
    background: var(--el-fill-color-light);
}

.file-picker-list-file {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    color: var(--el-color-primary);
}

.file-picker-pagination {
    justify-content: flex-end;
    margin-top: 12px;
}

:deep(.file-picker-row-selected td) {
    background: var(--el-color-primary-light-9);
}

.file-picker-input {
    display: none;
}

@media (max-width: 1280px) {
    .file-picker-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }
}
</style>
