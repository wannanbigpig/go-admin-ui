<template>
    <div class="export-records-panel">
        <section class="xl-container xl-m-bottom-10 export-records-panel__overview">
            <div>
                <div class="export-records-panel__title-row">
                    <h3>{{ t('system.task.exportWorkspaceTitle') }}</h3>
                    <span class="export-records-panel__live" :class="`is-${connectionTone}`">
                        <i></i>
                        {{ connectionLabel }}
                    </span>
                </div>
                <p>{{ t('system.task.exportWorkspaceDescription') }}</p>
            </div>
            <el-button :loading="exportLoading" plain @click="handleManualRefresh">
                <el-icon><Refresh /></el-icon>
                {{ t('system.task.refreshNow') }}
            </el-button>
        </section>

        <div class="xl-container xl-m-bottom-10">
            <el-form ref="exportQueryFormRef" class="xl-search-form" :model="exportQuery" @submit.prevent="handleExportSearch" @keydown.enter.prevent="handleExportSearch">
                <el-row id="exportSearchForm" :gutter="20">
                    <el-col :xs="24" :sm="12" :md="8" :lg="4">
                        <el-form-item :label="t('system.task.exportScene')" prop="scene">
                            <el-select v-model="exportQuery.scene" :placeholder="t('system.task.exportScenePlaceholder')" clearable>
                                <el-option v-for="(label, value) in exportSceneNameMap" :key="value" :label="label" :value="value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="4">
                        <el-form-item :label="t('system.task.exportStatus')" prop="status">
                            <el-select v-model="exportQuery.status" clearable>
                                <el-option v-for="item in exportStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="8" :lg="4">
                        <el-form-item :label="t('system.task.exportPublicId')" prop="public_id">
                            <el-input v-model.trim="exportQuery.public_id" :placeholder="t('system.task.exportPublicIdHint')" clearable />
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="exportLoading" :maxShow="4" @search="handleExportSearch" @reset="handleExportReset" :modelRef="exportQueryFormRef" nodeName="#exportSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container export-records-panel__table">
            <xl-table-list :loading="exportLoading" :data="exportList" :tableTitle="exportTableTitle" :pagination="exportPagination">
                <template #td="{ item, row }">
                    <div v-if="item.prop === 'export_name'" class="export-record-summary">
                        <strong>{{ getExportCellValue('export_name', row) }}</strong>
                        <span>
                            <el-tag size="small" effect="plain">{{ getExportCellValue('scene', row) }}</el-tag>
                            <span :title="row.public_id">#{{ row.public_id.slice(0, 8) }}</span>
                        </span>
                    </div>
                    <div v-else-if="item.prop === 'status_progress'" class="export-status-cell">
                        <div class="export-status-cell__heading">
                            <el-tag :type="getExportStatusTagType(row.status)">{{ getExportStatusLabel(row.status) }}</el-tag>
                            <span>{{ getExportProgressDescription(row) || getExportRecordProgressText(row) || '-' }}</span>
                        </div>
                        <div class="task-export-progress-bar">
                            <el-progress
                                v-if="row.status !== 'pending' && getExportRecordProgress(row) !== null"
                                :percentage="getExportRecordProgress(row) || 0"
                                :status="getExportProgressStatus(row.status)"
                                :stroke-width="8"
                            />
                        </div>
                    </div>
                    <div v-else-if="item.prop === 'export_count'" class="export-count-cell">
                        <strong>{{ getExportCount(row) }}</strong>
                        <span v-if="isExportRecordActive(row)">{{ t('system.task.processedCount', { count: getProcessedCount(row) }) }}</span>
                    </div>
                    <div v-else-if="item.prop === 'file_name'" class="export-file-cell">
                        <strong>{{ row.file_name || '-' }}</strong>
                        <span v-if="row.file_name">
                            {{ String(row.format || '').toUpperCase() || '-' }} · {{ formatFileSize(row.file_size) }}
                            <template v-if="isExportRecordExpired(row)"> · {{ t('system.task.fileExpired') }}</template>
                        </span>
                        <span v-else>{{ row.status === 'success' ? t('system.task.filePending') : getExportProgressDescription(row) || '-' }}</span>
                    </div>
                    <span v-else>{{ getExportCellValue(item.prop, row) }}</span>
                </template>
                <template #operation>
                    <el-table-column width="170" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-button type="primary" link :show-icon="false" :text="t('system.task.detail')" @click="handleExportDetail(scope.row)" />
                            <xl-action-button
                                type="primary"
                                link
                                :show-icon="false"
                                :text="isExportRecordExpired(scope.row) ? t('system.task.fileExpired') : t('system.task.download')"
                                :disabled="!canDownloadExportRecord(scope.row)"
                                @click="handleExportDownload(scope.row)"
                            />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>

        <el-drawer v-model="showExportDetailDrawer" :title="t('system.task.exportDetailTitle')" size="min(620px, 92vw)" destroy-on-close>
            <template v-if="currentExportRecord">
                <div class="export-detail-progress">
                    <div>
                        <el-tag :type="getExportStatusTagType(currentExportRecord.status)">{{ getExportStatusLabel(currentExportRecord.status) }}</el-tag>
                        <span>{{ getExportProgressDescription(currentExportRecord) || '-' }}</span>
                    </div>
                    <el-progress :percentage="getExportRecordProgress(currentExportRecord) || 0" :status="getExportProgressStatus(currentExportRecord.status)" :stroke-width="10" />
                </div>
                <el-descriptions :column="1" border class="custom-descriptions">
                    <el-descriptions-item :label="t('system.task.exportName')">{{ getExportCellValue('export_name', currentExportRecord) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.exportPublicId')">{{ currentExportRecord.public_id }}</el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.exportScene')">{{ getExportCellValue('scene', currentExportRecord) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.exportCount')">{{ getExportCount(currentExportRecord) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.fileName')">{{ currentExportRecord.file_name || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.fileSize')">{{ formatFileSize(currentExportRecord.file_size) }}</el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.fileExpiresAt')">
                        <span :class="{ 'export-detail-expired': isExportRecordExpired(currentExportRecord) }">
                            {{ currentExportRecord.file_expires_at || '-' }}
                            <template v-if="isExportRecordExpired(currentExportRecord)">（{{ t('system.task.fileExpired') }}）</template>
                        </span>
                    </el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.finishedAt')">{{ currentExportRecord.finished_at || '-' }}</el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.failureReason')">
                        <span class="export-detail-error">{{ currentExportRecord.status === 'failed' ? t('system.task.exportFailedHint') : '-' }}</span>
                    </el-descriptions-item>
                </el-descriptions>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onActivated, onDeactivated, reactive, ref, watch } from 'vue'
import type { FormInstance } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { useListPage } from '@/composables/useListPage'
import { useIntervalPolling } from '@/composables/useIntervalPolling'
import {
    applyExportProgressEvent,
    canDownloadExportRecord,
    createExportRecordQuery,
    getExportRecordProgress,
    getExportRecordProgressText,
    hasActiveExportRecords,
    isActiveExportRecordStatus,
    isExportRecordExpired,
} from '@/modules/exportCenter/model'
import { fetchExportRecordList } from '@/modules/exportCenter/service'
import { downloadSystemFileBlob } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { TableColumn } from '@/types/common'
import type { ExportRecord } from '@/types/exportCenter'

const props = defineProps<{ active: boolean }>()
let hasActivated = false

const { t } = useI18n()
const notificationStore = useNotificationStore()

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
const showExportDetailDrawer = ref(false)
const currentExportRecord = ref<ExportRecord | null>(null)

const connectionTone = computed(() => (notificationStore.connectionStatus === 'connected' ? 'connected' : 'fallback'))
const connectionLabel = computed(() => (notificationStore.connectionStatus === 'connected' ? t('system.task.realtimeConnected') : t('system.task.fallbackPolling')))

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
    fetcher: fetchExportRecordList,
})

const shouldPollExportList = computed(() => props.active && hasActiveExportRecords(exportList.value))

const exportListPolling = useIntervalPolling(
    async ({ signal }) => {
        if (exportLoading.value) return
        await getExportList()
        if (signal.aborted) return
    },
    {
        interval: 15000,
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

const getExportProgressDescription = (row: ExportRecord) => {
    if (row.stage) return t(`system.task.exportStage.${row.stage}`)
    if (row.status === 'pending') return '-'
    return ''
}
const getExportCount = (row: ExportRecord) => {
    const count = Number(row.total_count)
    return Number.isFinite(count) && count >= 0 ? Math.round(count).toLocaleString() : '-'
}
const getProcessedCount = (row: ExportRecord) => {
    const count = Number(row.processed_count)
    return Number.isFinite(count) && count >= 0 ? Math.round(count).toLocaleString() : '0'
}
const isExportRecordActive = (row: ExportRecord) => isActiveExportRecordStatus(row.status)
const exportSceneNameMap = computed<Record<string, string>>(() => ({
    request_log: t('system.task.exportSceneFallback.request_log'),
    file_list: t('system.task.exportSceneFallback.file_list'),
}))

const getExportCellValue = (prop: string, row: ExportRecord) => {
    switch (prop) {
        case 'export_name':
            return exportSceneNameMap.value[row.scene || ''] || row.export_name || row.scene || '-'
        case 'scene':
            return exportSceneNameMap.value[row.scene || ''] || row.scene || '-'
        case 'file_name':
            return row.file_name || '-'
        case 'file_size':
            return formatFileSize(row.file_size)
        case 'format':
            return row.format ? String(row.format).toUpperCase() : '-'
        case 'finished_at':
            return row.finished_at || '-'
        default:
            return (row as unknown as Record<string, unknown>)[prop] ?? '-'
    }
}

const handleExportDownload = async (row: ExportRecord) => {
    try {
        if (!row.file_uuid) return
        await downloadSystemFileBlob(row.file_uuid, row.file_name)
    } catch (error) {
        Logger.error('打开导出文件失败:', error)
    }
}

const handleManualRefresh = async () => {
    await getExportList()
}

const handleExportDetail = (row: ExportRecord) => {
    currentExportRecord.value = row
    showExportDetailDrawer.value = true
}

const exportTableTitle = computed(
    () =>
        [
            { prop: 'export_name', h_label: t('system.task.exportName'), minWidth: 240, customRow: true },
            { prop: 'status_progress', h_label: t('system.task.exportStatus'), minWidth: 260, customRow: true },
            { prop: 'export_count', h_label: t('system.task.exportCount'), width: 130, align: 'center', customRow: true },
            { prop: 'file_name', h_label: t('system.task.exportFile'), minWidth: 250, customRow: true },
            { prop: 'created_at', h_label: t('common.labels.createdAt'), width: 170, align: 'center', customRow: true },
            { prop: 'finished_at', h_label: t('system.task.finishedAt'), width: 160, align: 'center', customRow: true },
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

watch(
    () => notificationStore.exportFinishedTime,
    (value) => {
        if (value > 0) {
            void getExportList()
        }
    }
)

watch(
    () => notificationStore.exportProgressEvent,
    (event) => {
        if (!event) return
        exportList.value = applyExportProgressEvent(exportList.value, event)
        if (currentExportRecord.value && currentExportRecord.value.public_id === event.public_id) {
            currentExportRecord.value = applyExportProgressEvent([currentExportRecord.value], event)[0]
        }
    }
)

onMounted(async () => {
    await getExportList()
})

onActivated(() => {
    if (!hasActivated) {
        hasActivated = true
        return
    }
    void getExportList()
    if (shouldPollExportList.value) exportListPolling.resume()
})

onDeactivated(() => {
    exportListPolling.pause()
})
</script>

<style scoped lang="scss">
:deep(.el-form-item) {
    width: 100%;
}

.export-records-panel {
    &__overview {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        padding: 18px 20px;
        border-left: 3px solid var(--el-color-primary);

        h3 {
            margin: 0;
            color: var(--el-text-color-primary);
            font-size: 16px;
        }

        p {
            margin: 6px 0 0;
            color: var(--el-text-color-secondary);
            font-size: 13px;
            line-height: 1.6;
        }
    }

    &__title-row {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    &__live {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 3px 8px;
        border-radius: 999px;
        color: var(--el-text-color-secondary);
        background: var(--el-fill-color-light);
        font-size: 12px;

        i {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--el-color-warning);
        }

        &.is-connected {
            color: var(--el-color-success);
            background: var(--el-color-success-light-9);

            i {
                background: var(--el-color-success);
                box-shadow: 0 0 0 4px color-mix(in srgb, var(--el-color-success) 16%, transparent);
            }
        }
    }

    &__table {
        overflow: hidden;
    }
}

.export-record-summary,
.export-file-cell {
    display: flex;
    flex-direction: column;
    min-width: 0;
    gap: 5px;

    strong {
        overflow: hidden;
        color: var(--el-text-color-primary);
        font-weight: 600;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    > span {
        display: flex;
        align-items: center;
        gap: 8px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
    }
}

.export-status-cell {
    display: flex;
    flex-direction: column;
    gap: 8px;

    &__heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;

        span {
            overflow: hidden;
            color: var(--el-text-color-secondary);
            font-size: 12px;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }
}

.export-count-cell {
    strong,
    span {
        display: block;
        text-align: center;
    }

    strong {
        color: var(--el-text-color-primary);
        font-size: 16px;
        font-variant-numeric: tabular-nums;
    }

    span {
        margin-top: 3px;
        color: var(--el-text-color-secondary);
        font-size: 11px;
    }
}

.task-export-progress-bar {
    min-height: 8px;

    :deep(.el-progress) {
        width: 100%;

        .el-progress__text {
            min-width: 38px;
            font-size: 12px !important;
        }

        .el-progress-bar__inner {
            transition: width 0.42s cubic-bezier(0.22, 1, 0.36, 1);
        }
    }
}

.export-detail-progress {
    margin-bottom: 18px;
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-fill-color-extra-light);

    > div {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
        color: var(--el-text-color-secondary);
        font-size: 13px;
    }
}

.export-detail-error {
    color: var(--el-color-danger);
    word-break: break-word;
}

.export-detail-expired {
    color: var(--el-color-warning);
}

@media (max-width: 768px) {
    .export-records-panel__overview {
        align-items: flex-start;
        flex-direction: column;

        :deep(.el-button) {
            width: 100%;
        }
    }
}
</style>
