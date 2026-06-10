<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form ref="exportQueryFormRef" class="xl-search-form" :model="exportQuery" @submit.prevent="handleExportSearch" @keydown.enter.prevent="handleExportSearch">
                <el-row id="exportSearchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item :label="t('system.task.exportScene')" prop="scene">
                            <el-input v-model.trim="exportQuery.scene" :placeholder="t('system.task.exportScenePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('system.task.exportStatus')" prop="status">
                            <el-select v-model="exportQuery.status" clearable>
                                <el-option v-for="item in exportStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('system.task.taskRunId')" prop="task_run_id">
                            <el-input v-model.trim="exportQuery.task_run_id" :placeholder="t('system.task.taskRunIdPlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="exportLoading" :maxShow="4" :onSearch="handleExportSearch" :onReset="handleExportReset" :modelRef="exportQueryFormRef" nodeName="#exportSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <el-alert v-if="!exportEndpointReady" class="xl-m-bottom-10" type="info" :title="t('system.task.exportEndpointPending')" />

            <xl-table-list :loading="exportLoading" :data="exportList" :tableTitle="exportTableTitle" :pagination="exportPagination">
                <template #td="{ item, row }">
                    <el-tag v-if="item.prop === 'status'" :type="getExportStatusTagType(row.status)">
                        {{ getExportStatusLabel(row.status) }}
                    </el-tag>
                    <div v-else-if="item.prop === 'progress'" class="task-export-progress">
                        <div v-if="getExportProgress(row) !== null" class="task-export-progress-bar">
                            <el-progress :percentage="getExportProgress(row) || 0" :status="getExportProgressStatus(row.status)" :stroke-width="8" />
                            <span class="task-export-progress-percent">{{ getExportProgressPercentText(row) }}</span>
                        </div>
                        <div v-if="getExportProgressDescription(row)" class="task-export-progress-text">{{ getExportProgressDescription(row) }}</div>
                        <span v-else-if="getExportProgress(row) === null">-</span>
                    </div>
                    <span v-else-if="item.prop === 'export_count'">{{ getExportCountText(row) }}</span>
                    <span v-else>{{ getExportCellValue(item.prop, row) }}</span>
                </template>
                <template #operation>
                    <el-table-column width="220" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-button
                                v-permission="'task:list'"
                                code="task:list"
                                type="primary"
                                link
                                :show-icon="false"
                                :text="t('system.task.download')"
                                :disabled="!canDownloadExportRecord(scope.row)"
                                @click="handleExportDownload(scope.row)"
                            />
                            <xl-action-button
                                v-if="canRetryExportRecord(scope.row)"
                                v-permission="'task:retry'"
                                code="task:retry"
                                type="primary"
                                link
                                :show-icon="false"
                                :text="t('system.task.retry')"
                                :disabled="operatingRunId === scope.row.task_run_id"
                                @click="handleExportRetry(scope.row)"
                            />
                            <xl-action-button
                                v-if="canCancelExportRecord(scope.row)"
                                v-permission="'task:cancel'"
                                code="task:cancel"
                                type="danger"
                                link
                                :show-icon="false"
                                :text="t('system.task.cancel')"
                                :disabled="operatingRunId === scope.row.task_run_id"
                                @click="handleExportCancel(scope.row)"
                            />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { useListPage } from '@/composables/useListPage'
import { useIntervalPolling } from '@/composables/useIntervalPolling'
import { canDownloadExportRecord, createExportRecordQuery, getExportRecordProgress, getExportRecordProgressText, hasActiveExportRecords } from '@/modules/exportCenter/model'
import { fetchExportRecordList } from '@/modules/exportCenter/service'
import { retryTaskByRunId, cancelTaskByRunId, fetchSystemFileDetail, downloadSystemFileBlob } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { TableColumn } from '@/types/common'
import type { ExportRecord } from '@/types/exportCenter'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'

const props = defineProps<{ active: boolean }>()

const { t } = useI18n()

const exportStatusOptions = computed(() => [
    { value: 'pending', label: t('system.task.exportStatusOptions.pending') },
    { value: 'running', label: t('system.task.exportStatusOptions.running') },
    { value: 'retrying', label: t('system.task.exportStatusOptions.retrying') },
    { value: 'success', label: t('system.task.exportStatusOptions.success') },
    { value: 'failed', label: t('system.task.exportStatusOptions.failed') },
    { value: 'canceled', label: t('system.task.exportStatusOptions.canceled') },
])

const exportQueryFormRef = ref<FormInstance>()
const exportQuery = reactive(createExportRecordQuery())
const exportEndpointReady = ref(true)
const operatingRunId = ref<number | string | null>(null)

const getErrorStatus = (error: unknown) => {
    if (!error || typeof error !== 'object' || !('response' in error)) return null
    const response = (error as { response?: { status?: number } }).response
    return typeof response?.status === 'number' ? response.status : null
}

const {
    loading: exportLoading,
    items: exportList,
    pagination: exportPagination,
    getList: getExportList,
    handleSearch: handleExportSearch,
    handleReset: handleExportReset,
} = useListPage<ExportRecord, typeof exportQuery>({
    query: exportQuery,
    queryFormRef: exportQueryFormRef,
    fetcher: async (params) => {
        try {
            const result = await fetchExportRecordList(params)
            exportEndpointReady.value = true
            return result
        } catch (error) {
            Logger.error('获取导出记录列表失败:', error)
            if (getErrorStatus(error) === 404) {
                exportEndpointReady.value = false
            }
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const shouldPollExportList = computed(() => props.active && exportEndpointReady.value && hasActiveExportRecords(exportList.value))

const exportListPolling = useIntervalPolling(
    async ({ signal }) => {
        if (exportLoading.value) return
        await getExportList()
        if (signal.aborted) return
    },
    {
        interval: 5000,
        when: () => shouldPollExportList.value,
        pauseWhenHidden: true,
    }
)

const formatFileSize = (size?: number) => {
    const bytes = Number(size || 0)
    if (!bytes) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

const getExportStatusLabel = (status?: string) => {
    return exportStatusOptions.value.find((item) => item.value === status)?.label || status || '-'
}

const getExportStatusTagType = (status?: string) => {
    switch (status) {
        case 'success':
            return 'success'
        case 'failed':
            return 'danger'
        case 'running':
            return 'primary'
        case 'retrying':
            return 'warning'
        case 'pending':
            return 'warning'
        case 'canceled':
            return 'info'
        default:
            return 'info'
    }
}

const getExportProgressStatus = (status?: string) => {
    if (status === 'failed') return 'exception'
    if (status === 'success') return 'success'
    if (status === 'canceled') return 'warning'
    return undefined
}

const getExportProgress = (row: ExportRecord) => getExportRecordProgress(row)
const getExportProgressPercentText = (row: ExportRecord) => {
    const progress = getExportProgress(row)
    return progress === null ? '-' : `${progress}%`
}
const getExportProgressDescription = (row: ExportRecord) => row.stage_name || '-'
const getExportCountText = (row: ExportRecord) => getExportRecordProgressText(row) || '-'

const exportSceneNameMap = computed<Record<string, string>>(() => ({
    request_log: t('system.task.exportSceneFallback.request_log'),
    file_list: t('system.task.exportSceneFallback.file_list'),
}))

const getExportDisplayName = (row: ExportRecord) => row.export_name || row.scene_name || exportSceneNameMap.value[row.scene || ''] || row.scene || '-'
const getExportDisplayScene = (row: ExportRecord) => row.scene || '-'
const getExportFailureReason = (row: ExportRecord) => row.fail_reason || row.error_message || '-'

const getExportCellValue = (prop: string, row: ExportRecord) => {
    switch (prop) {
        case 'export_name':
            return getExportDisplayName(row)
        case 'scene':
            return getExportDisplayScene(row)
        case 'file_name':
            return row.file_name || '-'
        case 'file_size':
            return formatFileSize(row.file_size)
        case 'format':
            return row.format ? String(row.format).toUpperCase() : '-'
        case 'fail_reason':
            return getExportFailureReason(row)
        case 'finished_at':
            return row.finished_at || '-'
        default:
            return (row as unknown as Record<string, unknown>)[prop] ?? '-'
    }
}

const handleExportDownload = async (row: ExportRecord) => {
    try {
        let uuid = row.file_uuid
        let fileName = row.file_name
        if (!uuid && row.file_id) {
            const fileDetail = await fetchSystemFileDetail(row.file_id)
            uuid = fileDetail.uuid || uuid
            fileName = fileName || fileDetail.origin_name || fileDetail.name
        }

        if (uuid) {
            await downloadSystemFileBlob(uuid, fileName)
            return
        }

        if (row.download_url) {
            if (!/^https?:\/\//.test(row.download_url)) {
                ElMessage.error(t('common.result.operationFailed'))
                return
            }
            globalThis.open(row.download_url, '_blank', 'noopener,noreferrer')
        }
    } catch (error) {
        Logger.error('打开导出文件失败:', error)
    }
}

const canRetryExportRecord = (row: ExportRecord) => {
    return row.can_retry === true && row.status === 'failed'
}

const canCancelExportRecord = (row: ExportRecord) => {
    return !!row.task_run_id && ['pending', 'running', 'retrying'].includes(row.status || '')
}

const handleExportRetry = async (row: ExportRecord) => {
    if (!row.task_run_id) return
    try {
        await ElMessageBox.confirm(t('system.task.retryConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        operatingRunId.value = row.task_run_id
        await retryTaskByRunId(row.task_run_id)
        ElMessage.success(t('common.result.operationSuccess'))
        await getExportList()
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        Logger.error('重试导出任务失败:', error)
    } finally {
        operatingRunId.value = null
    }
}

const handleExportCancel = async (row: ExportRecord) => {
    if (!row.task_run_id) return
    try {
        const { value } = await ElMessageBox.prompt(t('system.task.cancelConfirm'), t(CONFIRM_DIALOG_TITLE), {
            type: 'warning',
            inputPlaceholder: t('system.task.cancelReasonPlaceholder'),
        })
        operatingRunId.value = row.task_run_id
        await cancelTaskByRunId(row.task_run_id, value || '')
        ElMessage.success(t('common.result.operationSuccess'))
        await getExportList()
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        Logger.error('取消导出任务失败:', error)
    } finally {
        operatingRunId.value = null
    }
}

const exportTableTitle = computed(
    () =>
        [
            { prop: 'id', h_label: t('common.labels.id'), width: 80, align: 'center' },
            { prop: 'export_name', h_label: t('system.task.exportName'), minWidth: 180, overflow: true, customRow: true },
            { prop: 'scene', h_label: t('system.task.exportScene'), minWidth: 140, overflow: true, customRow: true },
            { prop: 'task_code', h_label: t('system.task.code'), minWidth: 160, overflow: true, customRow: true },
            { prop: 'task_run_id', h_label: t('system.task.taskRunId'), width: 120, align: 'center', customRow: true },
            { prop: 'status', h_label: t('system.task.exportStatus'), width: 110, align: 'center', customRow: true },
            { prop: 'queue', h_label: t('system.task.queue'), minWidth: 110, overflow: true, customRow: true },
            { prop: 'progress', h_label: t('system.task.exportProgress'), width: 190, align: 'center', customRow: true },
            { prop: 'export_count', h_label: t('system.task.exportCount'), width: 120, align: 'center', customRow: true },
            { prop: 'file_name', h_label: t('system.task.fileName'), minWidth: 220, overflow: true, customRow: true },
            { prop: 'file_size', h_label: t('system.task.fileSize'), width: 110, align: 'right', customRow: true },
            { prop: 'format', h_label: t('system.task.fileFormat'), width: 100, align: 'center', customRow: true },
            { prop: 'started_at', h_label: t('system.task.startedAt'), width: 160, align: 'center', customRow: true },
            { prop: 'finished_at', h_label: t('system.task.finishedAt'), width: 160, align: 'center', customRow: true },
            { prop: 'created_at', h_label: t('common.labels.createdAt'), width: 160, align: 'center', customRow: true },
            { prop: 'fail_reason', h_label: t('system.task.failureReason'), minWidth: 220, overflow: true, customRow: true },
        ] as TableColumn<ExportRecord>[]
)

watch(
    shouldPollExportList,
    (value) => {
        if (value) {
            exportListPolling.resume()
            return
        }
        exportListPolling.pause()
    },
    { immediate: true }
)

onMounted(async () => {
    await getExportList()
})
</script>

<style scoped lang="scss">
:deep(.el-form-item) {
    width: 100%;
}

.task-export-progress {
    min-width: 120px;

    .task-export-progress-bar {
        display: flex;
        align-items: center;
        gap: var(--xl-space-2);
    }

    .task-export-progress-percent {
        min-width: 40px;
        font-size: var(--xl-font-sm);
        line-height: 1;
        color: var(--el-text-color-regular);
        text-align: right;
        flex-shrink: 0;
    }

    .task-export-progress-text {
        margin-top: 6px;
        font-size: var(--xl-font-sm);
        line-height: 1.4;
        color: var(--el-text-color-secondary);
        text-align: center;
    }
}
</style>
