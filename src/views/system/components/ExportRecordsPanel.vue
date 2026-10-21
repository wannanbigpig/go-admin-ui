<template>
    <div class="export-records-panel">
        <!-- 顶部 4 维指标看板 -->
        <div class="export-metrics-grid xl-m-bottom-16">
            <button
                v-for="card in exportMetricCards"
                :key="card.key"
                class="export-metric-card"
                :class="[`is-${card.tone}`, { 'is-active': activeFilterKey === card.key }]"
                type="button"
                :aria-pressed="activeFilterKey === card.key"
                @click="toggleExportFilter(card.key)"
            >
                <div class="export-metric-card__icon">
                    <el-icon :size="20"><component :is="card.icon" /></el-icon>
                </div>
                <div class="export-metric-card__content">
                    <span class="export-metric-card__label">{{ card.label }}</span>
                    <div class="export-metric-card__value-wrap">
                        <strong class="export-metric-card__value">{{ card.value }}</strong>
                        <span class="export-metric-card__unit">{{ t('system.task.exportItemUnit', Number(card.value) || 0) }}</span>
                    </div>
                </div>
                <div v-if="activeFilterKey === card.key" class="export-metric-card__badge">
                    {{ t('system.task.filtering') }}
                </div>
            </button>
        </div>

        <!-- 标准化 ProTable 数据表格与内建搜索 -->
        <xl-pro-table
            :search-model="searchModel"
            :table-title="exportTableTitle"
            :search-schema="searchSchema"
            :loading="exportLoading"
            :data="exportList"
            :pagination="exportPagination"
            :search-max-show="3"
            row-key="public_id"
            @search="onSearch"
            @reset="onReset"
            @sort-change="onSortChange"
        >
            <template #td="{ item, row }">
                <!-- 导出任务名称与标识 -->
                <div v-if="item.prop === 'export_name'" class="export-name-cell">
                    <span class="export-name-text" :title="getExportCellValue('export_name', row)">
                        {{ getExportCellValue('export_name', row) }}
                    </span>
                    <span class="export-id-tag" :title="row.public_id">#{{ row.public_id.slice(0, 8) }}</span>
                </div>

                <!-- 导出状态与进度（精致双行排版：上层状态Tag+百分比，下层5px微型圆角进度条） -->
                <div v-else-if="item.prop === 'status_progress'" class="export-status-progress-cell">
                    <div class="cell-status-row">
                        <el-tag size="small" :type="getExportStatusTagType(row.status)">
                            <el-icon v-if="row.status === 'running' || row.status === 'pending'" class="is-loading"><Loading /></el-icon>
                            <el-icon v-else-if="row.status === 'success'"><CircleCheck /></el-icon>
                            <el-icon v-else-if="row.status === 'failed'"><CircleClose /></el-icon>
                            <span>{{ getExportStatusLabel(row.status) }}</span>
                        </el-tag>
                        <span class="cell-progress-num" :class="`is-${row.status}`"> {{ getExportRecordProgress(row) || 0 }}% </span>
                    </div>
                    <div class="cell-progress-bar-wrap">
                        <el-progress
                            :percentage="getExportRecordProgress(row) || 0"
                            :status="getExportProgressStatus(row.status)"
                            :stroke-width="5"
                            :show-text="false"
                            :striped="row.status === 'running'"
                            :striped-flow="row.status === 'running'"
                        />
                    </div>
                </div>

                <!-- 数据总数 -->
                <div v-else-if="item.prop === 'export_count'" class="export-count-col">
                    <strong class="export-count-total">{{ getExportCount(row) }}</strong>
                    <span v-if="isExportRecordActive(row)" class="export-count-sub">
                        {{ t('system.task.processedCount', { count: getProcessedCount(row) }) }}
                    </span>
                </div>

                <!-- 结果文件 -->
                <div v-else-if="item.prop === 'file_name'" class="export-file-cell">
                    <template v-if="row.file_name">
                        <div class="export-file-info">
                            <el-tag size="small" effect="plain" class="export-format-tag">
                                {{ String(row.format || 'FILE').toUpperCase() }}
                            </el-tag>
                            <span class="export-file-name" :title="row.file_name">{{ row.file_name }}</span>
                        </div>
                        <div v-if="isExportRecordExpired(row)" class="export-file-meta">
                            <el-tag size="small" type="danger" effect="light">{{ t('system.task.fileExpired') }}</el-tag>
                        </div>
                    </template>
                    <div v-else class="export-file-empty">
                        <span class="empty-hint">{{ row.status === 'success' ? t('system.task.filePending') : '-' }}</span>
                    </div>
                </div>

                <span v-else-if="item.prop === 'file_size'">{{ row.file_name ? formatFileSize(row.file_size) : '-' }}</span>

                <!-- 默认回退 -->
                <span v-else>{{ getExportCellValue(item.prop, row) }}</span>
            </template>

            <!-- 操作列（标准链接按钮） -->
            <template #operation>
                <el-table-column width="170" :label="t('common.labels.operation')" align="center" fixed="right">
                    <template #default="scope">
                        <xl-action-buttons :buttons="exportActionButtons(scope.row)" :scope="scope" :max-visible-buttons="2" />
                    </template>
                </el-table-column>
            </template>
        </xl-pro-table>

        <!-- 详情抽屉：现代化卡片式结构 -->
        <el-drawer v-model="showExportDetailDrawer" :title="t('system.task.exportDetailTitle')" size="var(--xl-drawer-md)" destroy-on-close class="export-detail-drawer">
            <template v-if="currentExportRecord">
                <!-- 顶部状态看板 Hero 卡片 -->
                <div class="export-detail-hero" :class="`is-${currentExportRecord.status}`">
                    <div class="hero-top-row">
                        <div class="hero-status-group">
                            <el-tag :type="getExportStatusTagType(currentExportRecord.status)" size="default" effect="light" class="hero-status-tag">
                                <el-icon v-if="currentExportRecord.status === 'running'" class="is-loading"><Loading /></el-icon>
                                <el-icon v-else-if="currentExportRecord.status === 'success'"><CircleCheck /></el-icon>
                                <el-icon v-else-if="currentExportRecord.status === 'failed'"><CircleClose /></el-icon>
                                <el-icon v-else-if="currentExportRecord.status === 'pending'"><Clock /></el-icon>
                                <el-icon v-else><Warning /></el-icon>
                                <span>{{ getExportStatusLabel(currentExportRecord.status) }}</span>
                            </el-tag>
                            <span v-if="currentExportRecord.stage" class="hero-desc-text">
                                {{ getExportProgressDescription(currentExportRecord) }}
                            </span>
                        </div>
                        <div class="hero-progress-num" :class="`is-${currentExportRecord.status}`">{{ getExportRecordProgress(currentExportRecord) || 0 }}%</div>
                    </div>

                    <!-- 精致高质感进度条（全状态均优雅呈现，已完成为100%温润绿，进行中为条纹动态蓝） -->
                    <div class="hero-progress-bar-wrap">
                        <el-progress
                            :percentage="getExportRecordProgress(currentExportRecord) || 0"
                            :status="getExportProgressStatus(currentExportRecord.status)"
                            :stroke-width="8"
                            :show-text="false"
                            :striped="currentExportRecord.status === 'running'"
                            :striped-flow="currentExportRecord.status === 'running'"
                        />
                    </div>

                    <!-- 进度刻度与完成时间说明 -->
                    <div class="hero-meta-row">
                        <span class="hero-meta-item">
                            <el-icon><Tickets /></el-icon>
                            <span>{{ t('system.task.exportTotalRows', { count: getExportCount(currentExportRecord) }) }}</span>
                        </span>
                        <span v-if="currentExportRecord.finished_at" class="hero-meta-item">
                            <el-icon><Timer /></el-icon>
                            <span>{{ t('system.task.exportFinishedAt', { time: currentExportRecord.finished_at }) }}</span>
                        </span>
                        <span v-else-if="currentExportRecord.status === 'running'" class="hero-meta-item">
                            <el-icon class="is-loading"><Loading /></el-icon>
                            <span>{{ t('system.task.exportProcessing') }}</span>
                        </span>
                    </div>

                    <!-- 失败提示 -->
                    <div v-if="currentExportRecord.status === 'failed'" class="hero-failed-notice">
                        <el-icon><CircleClose /></el-icon>
                        <span>{{ t('system.task.exportFailedHint') }}</span>
                    </div>
                </div>

                <!-- 任务基础信息 -->
                <div class="drawer-section-header">
                    <span class="section-accent-line"></span>
                    <el-icon class="section-icon"><Tickets /></el-icon>
                    <span class="section-title-text">{{ t('system.task.baseInfo') }}</span>
                </div>
                <el-descriptions :column="detailColumns" border size="default" class="detail-modern-descriptions xl-m-bottom-20">
                    <el-descriptions-item :label="t('system.task.exportName')" :span="detailColumns">
                        <span class="detail-strong-title">{{ getExportCellValue('export_name', currentExportRecord) }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.exportPublicId')" :span="detailColumns">
                        <div class="detail-id-box">
                            <code class="detail-code-mono">{{ currentExportRecord.public_id }}</code>
                            <el-tooltip :content="t('common.actions.copySuccess')" trigger="click" placement="top">
                                <el-button link type="primary" size="small" :icon="CopyDocument" @click="handleCopyId(currentExportRecord.public_id)" />
                            </el-tooltip>
                        </div>
                    </el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.exportScene')">
                        <el-tag size="small" effect="plain">{{ getExportCellValue('scene', currentExportRecord) }}</el-tag>
                    </el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.exportCount')">
                        <span class="detail-count-text">{{ t('system.task.exportRowsValue', { count: getExportCount(currentExportRecord) }) }}</span>
                    </el-descriptions-item>
                    <el-descriptions-item :label="t('common.labels.createdAt')">
                        {{ currentExportRecord.created_at || '-' }}
                    </el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.finishedAt')">
                        {{ currentExportRecord.finished_at || '-' }}
                    </el-descriptions-item>
                </el-descriptions>

                <!-- 产物文件区域：高质感文件卡片 -->
                <div class="drawer-section-header">
                    <span class="section-accent-line"></span>
                    <el-icon class="section-icon"><Document /></el-icon>
                    <span class="section-title-text">{{ t('system.task.exportFile') }}</span>
                </div>

                <div v-if="currentExportRecord.file_name" class="export-artifact-card" :class="{ 'is-expired': isExportRecordExpired(currentExportRecord) }">
                    <div class="artifact-card__icon-wrap">
                        <el-icon :size="24" class="artifact-icon"><Document /></el-icon>
                        <span class="artifact-format">{{ (currentExportRecord.format || 'FILE').toUpperCase() }}</span>
                    </div>
                    <div class="artifact-card__body">
                        <div class="artifact-card__name-row">
                            <span class="artifact-file-name" :title="currentExportRecord.file_name">
                                {{ currentExportRecord.file_name }}
                            </span>
                            <el-tag v-if="isExportRecordExpired(currentExportRecord)" size="small" type="danger" effect="light">
                                {{ t('system.task.fileExpired') }}
                            </el-tag>
                            <el-tag v-else-if="currentExportRecord.status === 'success'" size="small" type="success" effect="plain">
                                {{ t('system.task.fileAvailable') }}
                            </el-tag>
                        </div>
                        <div class="artifact-card__meta-row">
                            <span class="meta-item">{{ formatFileSize(currentExportRecord.file_size) }}</span>
                            <span class="meta-divider">·</span>
                            <span class="meta-item">
                                <el-icon><Timer /></el-icon>
                                <span>{{ t('system.task.exportExpiresAt', { time: currentExportRecord.file_expires_at || '-' }) }}</span>
                            </span>
                        </div>
                    </div>
                    <div class="artifact-card__action">
                        <el-tag v-if="isExportRecordExpired(currentExportRecord)" size="small" type="danger" effect="light">
                            {{ t('system.task.fileExpired') }}
                        </el-tag>
                        <el-tag v-else-if="currentExportRecord.status === 'success'" size="small" type="success" effect="light" class="artifact-ready-tag">
                            <el-icon><CircleCheck /></el-icon>
                            <span>{{ t('system.task.fileReady') }}</span>
                        </el-tag>
                    </div>
                </div>

                <div v-else class="export-artifact-empty">
                    <el-icon :size="28" class="empty-icon"><Document /></el-icon>
                    <span class="empty-text">
                        {{ currentExportRecord.status === 'failed' ? t('system.task.exportFailedHint') : t('system.task.filePending') }}
                    </span>
                </div>
            </template>

            <!-- 底部标准抽屉操作栏 -->
            <template #footer>
                <div class="drawer-footer-actions">
                    <el-button @click="showExportDetailDrawer = false">{{ t('common.actions.cancel') }}</el-button>
                    <el-button v-if="currentExportRecord && canDownloadExportRecord(currentExportRecord)" type="primary" :icon="Download" @click="handleExportDownload(currentExportRecord)">
                        {{ t('system.task.download') }}
                    </el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onActivated, onDeactivated, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { Download, Document, CircleCheck, CircleClose, Clock, Loading, Tickets, Warning, CopyDocument, Timer } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useClipboard } from '@/composables/useClipboard'
import { useNotificationStore } from '@/stores/notification'
import xlProTable from '@/components/proTable/index.vue'
import xlActionButtons, { type ActionButtonConfig } from '@/components/actionButtons/index.vue'
import { useListPage } from '@/composables/useListPage'
import { useIntervalPolling } from '@/composables/useIntervalPolling'
import { useMediaQuery } from '@/composables/useMediaQuery'
import {
    applyExportProgressEvent,
    canDownloadExportRecord,
    createExportRecordQuery,
    getExportRecordProgress,
    hasActiveExportRecords,
    isActiveExportRecordStatus,
    isExportRecordExpired,
    resolveExportRecordSort,
} from '@/modules/exportCenter/model'
import { fetchExportRecordDetail, fetchExportRecordListWithSummary } from '@/modules/exportCenter/service'
import { downloadSystemFileBlob } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { TableColumn } from '@/types/common'
import type { ProTableSearchSchema } from '@/components/proTable/types'
import type { ExportRecord, ExportRecordStatus, ExportSummary } from '@/types/exportCenter'

const props = defineProps<{ active: boolean }>()
let hasActivated = false

const { t } = useI18n()
const { copyText } = useClipboard()
const notificationStore = useNotificationStore()
const compactDetail = useMediaQuery('(max-width: 600px)')
const detailColumns = computed(() => (compactDetail.value ? 1 : 2))

const handleCopyId = async (id?: string) => {
    if (!id) return
    await copyText(id)
}

const exportStatusOptions = computed(() => [
    { value: 'pending', label: t('system.task.exportStatusOptions.pending') },
    { value: 'running', label: t('system.task.exportStatusOptions.running') },
    { value: 'retrying', label: t('system.task.exportStatusOptions.retrying') },
    { value: 'success', label: t('system.task.exportStatusOptions.success') },
    { value: 'failed', label: t('system.task.exportStatusOptions.failed') },
    { value: 'canceled', label: t('system.task.exportStatusOptions.canceled') },
])

const exportQuery = reactive(createExportRecordQuery())
const searchModel = reactive({
    scene: '',
    status: '',
    public_id: '',
})

const activeFilterKey = ref('all')
const exportSummary = ref<ExportSummary | null>(null)

const exportMetricCards = computed(() => [
    {
        key: 'all',
        label: t('system.task.allTasks'),
        value: exportSummary.value?.total ?? '-',
        icon: Document,
        tone: 'primary',
    },
    {
        key: 'running',
        label: t('system.task.exportStatusOptions.running'),
        value: exportSummary.value?.running ?? '-',
        icon: Loading,
        tone: 'warning',
    },
    {
        key: 'success',
        label: t('system.task.exportStatusOptions.success'),
        value: exportSummary.value?.success ?? '-',
        icon: CircleCheck,
        tone: 'success',
    },
    {
        key: 'failed',
        label: t('system.task.exportStatusOptions.failed'),
        value: exportSummary.value?.failed ?? '-',
        icon: Warning,
        tone: 'danger',
    },
])

const toggleExportFilter = (key: string) => {
    if (activeFilterKey.value === key) {
        activeFilterKey.value = 'all'
        exportQuery.status = null
        searchModel.status = ''
    } else {
        activeFilterKey.value = key
        if (key === 'all') {
            exportQuery.status = null
            searchModel.status = ''
        } else {
            exportQuery.status = key as ExportRecordStatus
            searchModel.status = key
        }
    }
    rawHandleSearch()
}

const getExportStatusTagType = (status?: string): '' | 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
        case 'pending':
            return 'info'
        case 'running':
            return 'warning'
        case 'retrying':
            return 'warning'
        case 'success':
            return 'success'
        case 'failed':
            return 'danger'
        case 'canceled':
            return 'info'
        default:
            return 'info'
    }
}

const showExportDetailDrawer = ref(false)
const currentExportRecord = ref<ExportRecord | null>(null)
let detailRequestVersion = 0

const refreshExportDetail = async () => {
    if (!showExportDetailDrawer.value || !currentExportRecord.value) return
    const publicID = currentExportRecord.value.public_id
    const requestVersion = ++detailRequestVersion
    try {
        const record = await fetchExportRecordDetail(publicID)
        if (record && requestVersion === detailRequestVersion && showExportDetailDrawer.value && currentExportRecord.value?.public_id === publicID) {
            currentExportRecord.value = record
        }
    } catch (error) {
        if (requestVersion === detailRequestVersion) Logger.error('刷新导出详情失败:', error)
    }
}

const {
    loading: exportLoading,
    items: exportList,
    pagination: exportPagination,
    getList: getExportList,
    handleSearch: rawHandleSearch,
    handleReset: rawHandleReset,
} = useListPage<ExportRecord, typeof exportQuery>({
    query: exportQuery,
    fetcher: fetchExportRecordListWithSummary,
    onSuccess: (result) => {
        exportSummary.value = (result as { summary?: ExportSummary | null }).summary ?? null
        if (!showExportDetailDrawer.value || !currentExportRecord.value) return
        const latest = result.list.find((record) => record.public_id === currentExportRecord.value?.public_id)
        if (latest) {
            detailRequestVersion++
            currentExportRecord.value = latest
        } else {
            // 完成后记录可能离开当前状态筛选，详情仍需取得最终文件信息。
            void refreshExportDetail()
        }
    },
    onError: () => {
        exportSummary.value = null
    },
})

const onSearch = (model: Record<string, unknown>) => {
    exportQuery.scene = (model.scene as string) || null
    exportQuery.public_id = (model.public_id as string) || null
    exportQuery.status = (model.status as ExportRecordStatus) || null
    activeFilterKey.value = exportQuery.status || 'all'
    rawHandleSearch()
}

const onReset = async () => {
    const sortBy = exportQuery.sort_by
    const sortOrder = exportQuery.sort_order
    searchModel.scene = ''
    searchModel.public_id = ''
    searchModel.status = ''
    activeFilterKey.value = 'all'
    await rawHandleReset({ refetch: false })
    exportQuery.sort_by = sortBy
    exportQuery.sort_order = sortOrder
    await rawHandleSearch()
}

const onSortChange = ({ prop, order }: { prop: string; order: 'ascending' | 'descending' | null }) => {
    const sort = resolveExportRecordSort(prop, order)
    if (!sort) return
    Object.assign(exportQuery, sort)
    rawHandleSearch()
}

const shouldPollExportList = computed(() => props.active && (hasActiveExportRecords(exportList.value) || (showExportDetailDrawer.value && isActiveExportRecordStatus(currentExportRecord.value?.status))))

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

const getExportCellValue = (prop: string, row: ExportRecord): string => {
    switch (prop) {
        case 'export_name':
            return String(exportSceneNameMap.value[row.scene || ''] || row.export_name || row.scene || '-')
        case 'scene':
            return String(exportSceneNameMap.value[row.scene || ''] || row.scene || '-')
        case 'file_name':
            return row.file_name || '-'
        case 'file_size':
            return row.file_name ? formatFileSize(row.file_size) : '-'
        case 'format':
            return row.format ? String(row.format).toUpperCase() : '-'
        case 'finished_at':
            return row.finished_at || '-'
        default:
            return String((row as unknown as Record<string, unknown>)[prop] ?? '-')
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

const handleExportDetail = (row: ExportRecord) => {
    detailRequestVersion++
    currentExportRecord.value = row
    showExportDetailDrawer.value = true
    void refreshExportDetail()
}

const exportActionButtons = (row: ExportRecord): ActionButtonConfig<ExportRecord>[] => [
    {
        permission: null,
        text: t('system.task.detail'),
        showIcon: false,
        click: handleExportDetail,
    },
    {
        permission: null,
        text: isExportRecordExpired(row) ? t('system.task.fileExpired') : t('system.task.download'),
        showIcon: false,
        disabled: !canDownloadExportRecord(row),
        click: handleExportDownload,
    },
]

const searchSchema = computed<ProTableSearchSchema>(() => [
    {
        prop: 'scene',
        label: t('system.task.exportScene'),
        type: 'select',
        placeholder: t('system.task.exportScenePlaceholder'),
        options: Object.entries(exportSceneNameMap.value).map(([value, label]) => ({
            value,
            label,
        })),
        span: 6,
    },
    {
        prop: 'status',
        label: t('system.task.exportStatus'),
        type: 'select',
        placeholder: t('system.task.exportStatus'),
        options: [{ label: t('system.task.allTasks'), value: '' }, ...exportStatusOptions.value],
        span: 6,
    },
    {
        prop: 'public_id',
        label: t('system.task.exportPublicId'),
        type: 'input',
        placeholder: t('system.task.exportPublicIdHint'),
        span: 6,
    },
])

const exportTableTitle = computed(
    () =>
        [
            { prop: 'export_name', h_label: t('system.task.exportName'), minWidth: 240, customRow: true },
            { prop: 'status_progress', h_label: t('system.task.exportStatus'), minWidth: 260, customRow: true },
            { prop: 'export_count', h_label: t('system.task.exportCount'), width: 130, align: 'center', customRow: true },
            { prop: 'file_name', h_label: t('system.task.exportFile'), minWidth: 230, customRow: true },
            { prop: 'file_size', h_label: t('system.task.fileSize'), width: 120, align: 'right', sortable: 'custom', customRow: true },
            { prop: 'created_at', h_label: t('common.labels.createdAt'), width: 170, align: 'center', sortable: 'custom', customRow: true },
            { prop: 'finished_at', h_label: t('system.task.finishedAt'), width: 160, align: 'center', sortable: 'custom', customRow: true },
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
            if (event.status && !isActiveExportRecordStatus(event.status)) void refreshExportDetail()
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

watch(showExportDetailDrawer, (visible) => {
    if (!visible) detailRequestVersion++
})
onBeforeUnmount(() => {
    detailRequestVersion++
})
</script>

<style scoped lang="scss">
.export-records-panel {
    width: 100%;
}

.export-count-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
}

.export-count-sub {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.4;
}

/* 顶部 4 维指标看板 */
.export-metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.export-metric-card {
    width: 100%;
    font: inherit;
    color: inherit;
    text-align: left;
    position: relative;
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 16px 20px;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--xl-radius-md, 8px);
    cursor: pointer;
    user-select: none;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        border-color: var(--el-border-color);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px var(--xl-shadow-color, rgba(0, 0, 0, 0.05));
    }

    &:focus-visible {
        outline: 2px solid var(--el-color-primary);
        outline-offset: 3px;
    }

    &.is-active {
        border-color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
        box-shadow: 0 0 0 1px var(--el-color-primary);

        &.is-warning {
            border-color: var(--el-color-warning);
            background: var(--el-color-warning-light-9);
            box-shadow: 0 0 0 1px var(--el-color-warning);
        }
        &.is-danger {
            border-color: var(--el-color-danger);
            background: var(--el-color-danger-light-9);
            box-shadow: 0 0 0 1px var(--el-color-danger);
        }
        &.is-success {
            border-color: var(--el-color-success);
            background: var(--el-color-success-light-9);
            box-shadow: 0 0 0 1px var(--el-color-success);
        }
    }
}

.export-metric-card__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 8px;
    flex-shrink: 0;

    .is-primary & {
        background: var(--el-color-primary-light-8);
        color: var(--el-color-primary);
    }
    .is-warning & {
        background: var(--el-color-warning-light-8);
        color: var(--el-color-warning);
    }
    .is-danger & {
        background: var(--el-color-danger-light-8);
        color: var(--el-color-danger);
    }
    .is-success & {
        background: var(--el-color-success-light-8);
        color: var(--el-color-success);
    }
}

.export-metric-card__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
}

.export-metric-card__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
}

.export-metric-card__value-wrap {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.export-metric-card__value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
}

.export-metric-card__unit {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
}

.export-metric-card__badge {
    position: absolute;
    top: 8px;
    right: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    background: var(--el-color-primary);
    color: #fff;
}

/* 导出任务名称单元格 */
.export-name-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    .export-name-text {
        font-weight: 600;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .export-id-tag {
        font-family: monospace;
        font-size: 11px;
        color: var(--el-text-color-placeholder);
        background: var(--el-fill-color-light);
        padding: 1px 5px;
        border-radius: 4px;
        flex-shrink: 0;
    }
}

/* 导出状态与精致微型进度条单元格 */
.export-status-progress-cell {
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    max-width: 180px;

    .cell-status-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .cell-progress-num {
        font-size: 12px;
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        color: var(--el-text-color-secondary);

        &.is-running {
            color: var(--el-color-primary);
        }
        &.is-success {
            color: var(--el-color-success);
        }
        &.is-failed {
            color: var(--el-color-danger);
        }
    }

    .cell-progress-bar-wrap {
        width: 100%;

        :deep(.el-progress-bar__outer) {
            background-color: var(--el-fill-color);
            border-radius: 999px;
            overflow: hidden;
        }

        :deep(.el-progress-bar__inner) {
            border-radius: 999px;
            transition: width 0.3s ease;
        }
    }
}

/* 结果文件单元格 */
.export-file-cell {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
}

.export-file-info {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;

    .export-format-tag {
        font-weight: 600;
        font-size: 10px;
        padding: 0 4px;
        height: 18px;
        line-height: 16px;
        flex-shrink: 0;
    }

    .export-file-name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
        color: var(--el-text-color-primary);
    }
}

.export-file-meta {
    display: flex;
    align-items: center;
}

.export-file-empty {
    color: var(--el-text-color-placeholder);
    font-size: 13px;
}

.export-detail-expired {
    color: var(--el-color-warning);
}

/* ================= 导出记录详情抽屉 ================= */
.export-detail-drawer {
    :deep(.el-drawer__body) {
        padding: 20px 24px;
    }
}

/* 1. 顶部 Hero 看板卡片 */
.export-detail-hero {
    padding: 16px 18px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--xl-radius-md, 8px);
    margin-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    transition: all 0.2s ease;

    &.is-running {
        background: var(--el-color-primary-light-9);
        border-color: var(--el-color-primary-light-7);
    }

    &.is-failed {
        background: var(--el-color-danger-light-9);
        border-color: var(--el-color-danger-light-7);
    }

    &.is-success {
        background: var(--el-fill-color-light);
        border-color: var(--el-border-color-lighter);
    }
}

.hero-top-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
}

.hero-status-group {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
}

.hero-status-tag {
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.hero-desc-text {
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

.hero-progress-num {
    font-size: 18px;
    font-weight: 700;
    color: var(--el-color-primary);
    font-variant-numeric: tabular-nums;

    &.is-running {
        color: var(--el-color-primary);
    }
    &.is-success {
        color: var(--el-color-success);
    }
    &.is-failed {
        color: var(--el-color-danger);
    }
    &.is-pending {
        color: var(--el-text-color-secondary);
    }
}

.hero-progress-bar-wrap {
    width: 100%;

    :deep(.el-progress-bar__outer) {
        background-color: var(--el-fill-color);
        border-radius: 999px;
        overflow: hidden;
    }

    :deep(.el-progress-bar__inner) {
        border-radius: 999px;
        transition: width 0.3s ease;
    }
}

.hero-meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    padding-top: 2px;
}

.hero-meta-item {
    display: inline-flex;
    align-items: center;
    gap: 5px;
}

.hero-failed-notice {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--el-color-danger);
}

/* 2. 小节标题 */
.drawer-section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;

    .section-accent-line {
        width: 3px;
        height: 14px;
        border-radius: 2px;
        background-color: var(--el-color-primary);
    }

    .section-icon {
        font-size: 15px;
        color: var(--el-color-primary);
    }

    .section-title-text {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
    }
}

/* 3. 基本信息 Descriptions */
.detail-modern-descriptions {
    :deep(.el-descriptions__label) {
        width: 100px;
        background-color: var(--el-fill-color-light) !important;
        font-weight: 500;
        color: var(--el-text-color-secondary);
    }

    :deep(.el-descriptions__content) {
        color: var(--el-text-color-primary);
        word-break: break-all;
    }
}

.detail-strong-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.detail-id-box {
    display: flex;
    align-items: center;
    gap: 6px;
}

.detail-code-mono {
    font-family: monospace;
    font-size: 12px;
    color: var(--el-text-color-regular);
    background: var(--el-fill-color);
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid var(--el-border-color-lighter);
}

.detail-count-text {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

/* 4. 产物文件卡片 */
.export-artifact-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--xl-radius-md, 8px);
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--el-border-color);
        box-shadow: 0 2px 8px var(--xl-shadow-color, rgba(0, 0, 0, 0.04));
    }

    &.is-expired {
        border-color: var(--el-color-danger-light-7);
        background: var(--el-color-danger-light-9);
    }
}

.artifact-card__icon-wrap {
    width: 48px;
    height: 48px;
    border-radius: 8px;
    background: var(--el-color-primary-light-9);
    color: var(--el-color-primary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    .artifact-icon {
        margin-bottom: -2px;
    }

    .artifact-format {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.5px;
    }
}

.artifact-card__body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.artifact-card__name-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    .artifact-file-name {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

.artifact-card__meta-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--el-text-color-placeholder);

    .meta-divider {
        color: var(--el-border-color);
    }

    .meta-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }
}

.artifact-card__action {
    flex-shrink: 0;

    .artifact-ready-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-weight: 500;
    }
}

/* 未生成产物文件空状态 */
.export-artifact-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px 16px;
    border: 1px dashed var(--el-border-color);
    border-radius: var(--xl-radius-md, 8px);
    background: var(--el-fill-color-blank);

    .empty-icon {
        color: var(--el-text-color-placeholder);
    }

    .empty-text {
        font-size: 13px;
        color: var(--el-text-color-secondary);
    }
}

/* 5. 底部操作栏 */
.drawer-footer-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
}

@media (max-width: 960px) {
    .export-metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .export-metrics-grid {
        grid-template-columns: 1fr;
    }
}
</style>
