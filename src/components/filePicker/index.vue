<template>
    <div class="file-picker">
        <button class="file-picker-trigger" type="button" @click="openDialog">
            <template v-if="selectedItems.length">
                <el-image v-if="isImage(selectedItems[0])" :src="getPreviewUrl(selectedItems[0])" fit="cover" class="file-picker-avatar" />
                <span v-else class="file-picker-file">{{ selectedItems[0].origin_name || selectedItems[0].uuid || selectedItems[0].id }}</span>
            </template>
            <el-icon v-else class="file-picker-empty"><i-ep-plus /></el-icon>
        </button>
        <el-button v-if="selectedItems.length" class="file-picker-clear" size="small" link type="danger" @click="clearSelection">{{ t('common.actions.reset') }}</el-button>
        <input ref="uploadInputRef" class="file-picker-input" type="file" :multiple="multiple" :accept="accept" @change="handleUploadInputChange" />

        <el-dialog v-model="showDialog" :title="t('filePicker.title')" width="960px" append-to-body @open="handleDialogOpen">
            <div class="file-picker-dialog">
                <aside class="file-picker-folders">
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
                        <el-button @click="triggerUpload">{{ t('filePicker.upload') }}</el-button>
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
                        <div class="file-picker-drop-title">{{ t('system.file.dropUploadTitle') }}</div>
                        <div class="file-picker-drop-tip">{{ t('system.file.dropUploadTip') }}</div>
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
                    <el-table ref="tableRef" v-loading="loading" :data="fileList" row-key="id" height="420" highlight-current-row @selection-change="handleSelectionChange" @row-dblclick="handleRowDblClick">
                        <el-table-column type="selection" width="48" />
                        <el-table-column :label="t('system.file.originName')" min-width="240" show-overflow-tooltip>
                            <template #default="{ row }">
                                <div class="file-picker-name">
                                    <el-image v-if="isImage(row)" :src="getPreviewUrl(row)" fit="cover" class="file-picker-list-thumb" />
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
                <el-button type="primary" @click="confirmSelection">{{ t('common.actions.confirm') }}</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { ElMessage, type TableInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { calculateSystemFileSha256, fetchSystemFileFolderTree, fetchSystemFileList, uploadSystemFile } from '@/modules/system/service'
import { getImageUrl } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import type { StorageDriver, SystemFile, SystemFileFolder } from '@/types/system'

export interface FilePickerValue {
    id?: number | string
    uuid?: string
    url?: string
    origin_name?: string
}

type FolderTreeNode = SystemFileFolder & { isRoot?: boolean; children?: FolderTreeNode[] }
type UploadTaskStatus = 'hashing' | 'pending' | 'uploading' | 'reuse' | 'success' | 'error'
interface UploadTask {
    id: string
    file: File
    name: string
    progress: number
    status: UploadTaskStatus
    hash?: string
    error?: string
    result?: SystemFile
}

const ROOT_FOLDER_KEY = '__root__'

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

const { t } = useI18n()
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
const uploadTasks = ref<UploadTask[]>([])
const isDraggingUpload = ref(false)
const MAX_PARALLEL_UPLOADS = 5
const query = reactive({
    origin_name: '',
})
const pagination = reactive({
    page: 1,
    per_page: 10,
    total: 0,
})

const selectedFolderKey = computed(() => selectedFolderId.value ?? ROOT_FOLDER_KEY)
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

const normalizeValue = (value: typeof props.modelValue): FilePickerValue[] => {
    if (!value) return []
    if (typeof value === 'string') {
        if (/^https?:\/\//.test(value) || value.startsWith('/')) {
            return [{ url: value }]
        }
        return [{ uuid: value }]
    }
    return Array.isArray(value) ? value : [value]
}

watch(
    () => props.modelValue,
    (value) => {
        selectedItems.value = normalizeValue(value)
    },
    { immediate: true }
)

const toPickerValue = (file: SystemFile): FilePickerValue => ({
    id: file.id,
    uuid: file.uuid,
    url: file.url,
    origin_name: file.display_name || file.origin_name,
})

const getPreviewUrl = (file: SystemFile | FilePickerValue) => file.url || (file.uuid ? getImageUrl(file.uuid) : '')

const isImage = (file: SystemFile | FilePickerValue) => {
    const value = file as SystemFile
    return isImageOnly() || value.file_type === 'image' || String(value.mime_type || '').startsWith('image/') || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(String(file.url || file.uuid || ''))
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

const isImageOnly = () => props.accept.split(',').some((item) => item.trim().startsWith('image/'))

const normalizeFolderId = (value?: number | string | null) => (value === ROOT_FOLDER_KEY || value === undefined ? null : value)

const openDialog = () => {
    showDialog.value = true
}

const handleDialogOpen = async () => {
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
            file_type: isImageOnly() ? 'image' : undefined,
        })
        fileList.value = result.list
        pagination.total = result.total
    } catch (error) {
        Logger.error('加载文件选择列表失败:', error)
        fileList.value = []
        pagination.total = 0
    } finally {
        loading.value = false
    }
}

const reloadList = () => {
    pagination.page = 1
    loadList()
}

const handleFolderSelect = (folder: FolderTreeNode) => {
    selectedFolderId.value = normalizeFolderId(folder.id)
    selectedRows.value = []
    reloadList()
}

const handlePageChange = (page: number) => {
    pagination.page = page
    loadList()
}

const handleSelectionChange = (selection: SystemFile[]) => {
    if (props.multiple || selection.length <= 1) {
        selectedRows.value = selection
        return
    }
    const latest = selection[selection.length - 1]
    selectedRows.value = [latest]
    nextTick(() => {
        tableRef.value?.clearSelection()
        tableRef.value?.toggleRowSelection(latest, true)
    })
}

const handleRowDblClick = (row: SystemFile) => {
    if (props.multiple) return
    selectedRows.value = [row]
    confirmSelection()
}

const emitSelection = (items: FilePickerValue[]) => {
    selectedItems.value = items
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

const triggerUpload = () => {
    uploadInputRef.value?.click()
}

const createUploadTask = (file: File): UploadTask => ({
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    file,
    name: file.name,
    progress: 0,
    status: 'pending',
})

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
    if (props.accept && file.type && !props.accept.split(',').some((item) => file.type.match(item.trim().replace('*', '.*')))) {
        ElMessage.error(t('filePicker.acceptInvalid'))
        return false
    }
    if (props.maxSize > 0 && file.size > props.maxSize) {
        ElMessage.error(t('filePicker.maxSizeInvalid'))
        return false
    }
    return true
}

const getErrorMessage = (error: unknown) => {
    if (!error || typeof error !== 'object') return ''
    const record = error as Record<string, unknown>
    const response = record.response as Record<string, unknown> | undefined
    const data = response?.data as Record<string, unknown> | undefined
    return String(data?.msg || data?.message || record.message || '')
}

const uploadOneTask = async (task: UploadTask) => {
    task.error = ''
    try {
        task.status = 'hashing'
        task.progress = 0
        task.hash = await calculateSystemFileSha256(task.file)
        task.status = 'uploading'
        let reused = false
        task.result = await uploadSystemFile(task.file, {
            folder_id: selectedFolderId.value,
            driver: props.driver,
            hash: task.hash,
            onProgress: (percent) => {
                task.progress = Math.min(99, Math.max(0, percent))
            },
            onReuse: () => {
                reused = true
                task.status = 'reuse'
                task.progress = 100
            },
        })
        task.progress = 100
        task.status = reused ? 'reuse' : 'success'
    } catch (error) {
        task.status = 'error'
        task.error = getErrorMessage(error) || t('system.file.uploadTaskFailed')
        Logger.error('文件选择器上传失败:', error)
    }
}

const runUploadQueue = async (tasks: UploadTask[]) => {
    let cursor = 0
    const workers = Array.from({ length: Math.min(MAX_PARALLEL_UPLOADS, tasks.length) }, async () => {
        while (cursor < tasks.length) {
            const task = tasks[cursor]
            cursor += 1
            await uploadOneTask(task)
        }
    })
    await Promise.all(workers)
}

const uploadFilesInQueue = async (files: File[]) => {
    const validFiles = files.filter(validateUploadFile)
    if (validFiles.length === 0) return
    const currentTasks = validFiles.map(createUploadTask)
    uploadTasks.value = currentTasks
    await runUploadQueue(currentTasks)
    const uploaded = currentTasks.map((task) => task.result).filter(Boolean) as SystemFile[]
    if (uploaded.length > 0) {
        emitSelection(props.multiple ? uploaded.map(toPickerValue) : [toPickerValue(uploaded[uploaded.length - 1])])
        ElMessage.success(t('common.result.uploadSuccess'))
        if (showDialog.value) await loadList()
    }
    if (currentTasks.every((task) => task.status === 'success')) {
        window.setTimeout(() => {
            if (uploadTasks.value === currentTasks) uploadTasks.value = []
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
    grid-template-columns: 220px minmax(0, 1fr);
    gap: 12px;
}

.file-picker-folders {
    min-height: 480px;
    padding: 12px;
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

.file-picker-toolbar,
.file-picker-name {
    display: flex;
    align-items: center;
    gap: 8px;
}

.file-picker-toolbar {
    margin-bottom: 12px;
}

.file-picker-dropzone {
    margin-bottom: 12px;
    padding: 14px;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    background: var(--el-fill-color-lighter);
    cursor: pointer;
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
    font-weight: 600;
    line-height: 22px;
    color: var(--el-text-color-primary);
}

.file-picker-drop-tip {
    margin-top: 2px;
    font-size: 12px;
    line-height: 18px;
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

.file-picker-file {
    display: block;
    padding: 10px;
    font-size: 12px;
    color: var(--el-text-color-regular);
    word-break: break-all;
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

.file-picker-input {
    display: none;
}
</style>
