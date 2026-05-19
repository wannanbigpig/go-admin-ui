<template>
    <div>
        <el-tabs v-model="activeTab" class="xl-container xl-tabs xl-m-bottom-10">
            <el-tab-pane :label="t('system.task.definitionTab')" name="definition" />
            <el-tab-pane :label="t('system.task.runTab')" name="run" />
            <el-tab-pane :label="t('system.task.cronTab')" name="cron" />
            <el-tab-pane :label="t('system.task.exportTab')" name="export" />
        </el-tabs>

        <div v-if="activeTab === 'definition'" class="xl-container xl-m-bottom-10">
            <el-form ref="taskQueryFormRef" class="xl-search-form" :model="taskQuery" @submit.prevent="handleTaskSearch" @keydown.enter.prevent="handleTaskSearch">
                <el-row id="taskSearchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item :label="t('system.task.code')" prop="code">
                            <el-input v-model.trim="taskQuery.code" :placeholder="t('system.task.codePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('system.task.name')" prop="name">
                            <el-input v-model.trim="taskQuery.name" :placeholder="t('system.task.namePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('system.task.kind')" prop="kind">
                            <el-select v-model="taskQuery.kind" clearable>
                                <el-option v-for="item in taskKindOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('common.labels.status')" prop="status">
                            <el-select v-model="taskQuery.status" clearable>
                                <el-option v-for="item in commonStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="taskLoading" :maxShow="4" :onSearch="handleTaskSearch" :modelRef="taskQueryFormRef" nodeName="#taskSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div v-if="activeTab === 'run'" class="xl-container xl-m-bottom-10">
            <el-form ref="runQueryFormRef" class="xl-search-form" :model="runQuery" @submit.prevent="handleRunSearch" @keydown.enter.prevent="handleRunSearch">
                <el-row id="runSearchForm" :gutter="20">
                    <el-col :span="5">
                        <el-form-item :label="t('system.task.code')" prop="task_code">
                            <el-input v-model.trim="runQuery.task_code" :placeholder="t('system.task.codePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item :label="t('system.task.kind')" prop="kind">
                            <el-select v-model="runQuery.kind" clearable>
                                <el-option v-for="item in taskKindOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item :label="t('common.labels.status')" prop="status">
                            <el-select v-model="runQuery.status" clearable>
                                <el-option v-for="item in taskRunStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item :label="t('system.task.timeRange')" prop="runDateRange">
                            <xl-date-range-picker v-model="runDateRange" />
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="runLoading" :maxShow="4" :onSearch="handleRunSearch" :modelRef="runQueryFormRef" nodeName="#runSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div v-if="activeTab === 'cron'" class="xl-container xl-m-bottom-10">
            <el-form ref="cronQueryFormRef" class="xl-search-form" :model="cronQuery" @submit.prevent="handleCronSearch" @keydown.enter.prevent="handleCronSearch">
                <el-row id="cronSearchForm" :gutter="20">
                    <el-col :span="5">
                        <el-form-item :label="t('system.task.code')" prop="task_code">
                            <el-input v-model.trim="cronQuery.task_code" :placeholder="t('system.task.codePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('common.labels.status')" prop="last_status">
                            <el-select v-model="cronQuery.last_status" clearable>
                                <el-option v-for="item in taskRunStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="cronLoading" :maxShow="2" :onSearch="handleCronSearch" :modelRef="cronQueryFormRef" nodeName="#cronSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div v-if="activeTab === 'export'" class="xl-container xl-m-bottom-10">
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
                    <xl-collapsible-search-btn :loading="exportLoading" :maxShow="4" :onSearch="handleExportSearch" :modelRef="exportQueryFormRef" nodeName="#exportSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <el-alert v-if="activeTab === 'export' && !exportEndpointReady" class="xl-m-bottom-10" type="info" :closable="false" :title="t('system.task.exportEndpointPending')" />

            <xl-table-list v-if="activeTab === 'definition'" :loading="taskLoading" :data="taskList" :tableTitle="taskTableTitle" :pagination="taskPagination">
                <template #td="{ item, val }">
                    <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                        {{ item.tag[val as string | number]?.text || val }}
                    </el-tag>
                    <span v-else>{{ val }}</span>
                </template>
                <template #operation>
                    <el-table-column width="120" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-button
                                type="primary"
                                link
                                :show-icon="false"
                                :text="t('system.task.triggerNow')"
                                :disabled="Number(scope.row.allow_manual) !== 1 || Number(scope.row.status) !== 1 || triggeringTaskCode === scope.row.code"
                                @click="handleTrigger(scope.row)"
                            />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>

            <xl-table-list v-if="activeTab === 'run'" :loading="runLoading" :data="runList" :tableTitle="runTableTitle" :pagination="runPagination">
                <template #td="{ item, val }">
                    <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                        {{ item.tag[val as string | number]?.text || val }}
                    </el-tag>
                    <span v-else>{{ val }}</span>
                </template>
                <template #operation>
                    <el-table-column width="210" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-buttons :buttons="runActionButtons" :scope="scope" :maxVisibleButtons="3" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>

            <xl-table-list v-if="activeTab === 'cron'" :loading="cronLoading" :data="cronList" :tableTitle="cronTableTitle" :pagination="cronPagination">
                <template #td="{ item, val }">
                    <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                        {{ item.tag[val as string | number]?.text || val }}
                    </el-tag>
                    <span v-else>{{ val }}</span>
                </template>
            </xl-table-list>

            <xl-table-list v-if="activeTab === 'export'" :loading="exportLoading" :data="exportList" :tableTitle="exportTableTitle" :pagination="exportPagination">
                <template #td="{ item, row }">
                    <el-tag v-if="item.prop === 'status'" :type="getExportStatusTagType(row.status)">
                        {{ getExportStatusLabel(row.status) }}
                    </el-tag>
                    <div v-else-if="item.prop === 'progress'" class="task-export-progress">
                        <el-progress v-if="getExportProgress(row) !== null" :percentage="getExportProgress(row) || 0" :status="getExportProgressStatus(row.status)" :stroke-width="8" />
                        <div v-if="getExportProgressDescription(row)" class="task-export-progress-text">{{ getExportProgressDescription(row) }}</div>
                        <span v-else-if="getExportProgress(row) === null">-</span>
                    </div>
                    <span v-else>{{ getExportCellValue(item.prop, row) }}</span>
                </template>
                <template #operation>
                    <el-table-column width="220" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-button type="primary" link :show-icon="false" :text="t('system.task.download')" :disabled="!canDownloadExportRecord(scope.row)" @click="handleExportDownload(scope.row)" />
                            <xl-action-button
                                v-if="canRetryExportRecord(scope.row)"
                                type="primary"
                                link
                                :show-icon="false"
                                :text="t('system.task.retry')"
                                :disabled="operatingRunId === scope.row.task_run_id"
                                @click="handleExportRetry(scope.row)"
                            />
                            <xl-action-button
                                v-if="canCancelExportRecord(scope.row)"
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

        <el-dialog v-model="showRunDetailDialog" :title="t('system.task.runDetailTitle')" width="860px" destroy-on-close>
            <el-descriptions v-if="currentRunDetail" :column="2" border>
                <el-descriptions-item :label="t('common.labels.id')">{{ currentRunDetail.id }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.code')">{{ currentRunDetail.task_code }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.kind')">{{ getDictOptionLabel(taskKindOptions, currentRunDetail.kind) }}</el-descriptions-item>
                <el-descriptions-item :label="t('common.labels.status')">{{ getDictOptionLabel(taskRunStatusOptions, currentRunDetail.status) }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.source')">{{ getDictOptionLabel(taskSourceOptions, currentRunDetail.source) }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.sourceId')">{{ currentRunDetail.source_id || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.attempt')">{{ currentRunDetail.attempt ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.maxRetry')">{{ currentRunDetail.max_retry ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.errorMessage')" :span="2">{{ currentRunDetail.error_message || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.startedAt')">{{ currentRunDetail.started_at || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.finishedAt')">{{ currentRunDetail.finished_at || '-' }}</el-descriptions-item>
            </el-descriptions>
            <el-divider />
            <div class="task-payload-block">
                <div class="task-payload-title">{{ t('system.task.payload') }}</div>
                <pre>{{ formatPayload(currentRunDetail?.payload) }}</pre>
            </div>
            <el-divider />
            <div class="task-events-block">
                <div class="task-payload-title">{{ t('system.task.events') }}</div>
                <el-skeleton v-if="runEventsLoading" animated :rows="4" />
                <el-empty v-else-if="runEvents.length === 0" :description="t('system.task.noEvents')" />
                <el-timeline v-else>
                    <el-timeline-item v-for="event in runEvents" :key="event.id" :timestamp="event.created_at" placement="top">
                        <div class="task-event-card">
                            <div class="task-event-header">
                                <el-tag size="small" type="primary">{{ event.event_type || '-' }}</el-tag>
                                <span>#{{ event.id }}</span>
                            </div>
                            <div class="task-event-message">{{ event.message || '-' }}</div>
                            <pre v-if="event.meta" class="task-event-meta">{{ formatEventMeta(event.meta) }}</pre>
                        </div>
                    </el-timeline-item>
                </el-timeline>
            </div>
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import { useI18n } from 'vue-i18n'
import { useListPage } from '@/composables/useListPage'
import { useDictOptions, getDictOptionLabel } from '@/composables/useDictOptions'
import { createTaskQuery, createTaskRunQuery, createCronTaskStateQuery } from '@/modules/system/model'
import { canDownloadExportRecord, createExportRecordQuery, getExportRecordProgress, getExportRecordProgressText, hasActiveExportRecords } from '@/modules/exportCenter/model'
import { SYSTEM_DICT_TYPES, commonStatusFallbackOptions, yesNoFallbackOptions, taskKindFallbackOptions, taskSourceFallbackOptions, taskRunStatusFallbackOptions } from '@/modules/system/dictOptions'
import {
    fetchTaskList,
    fetchTaskRunList,
    fetchTaskRunDetail,
    fetchCronTaskStateList,
    fetchTaskRunEvents,
    triggerTaskNow,
    retryTaskByRunId,
    cancelTaskByRunId,
    fetchSystemFileDetail,
    downloadSystemFileBlob,
} from '@/modules/system/service'
import { fetchExportRecordList } from '@/modules/exportCenter/service'
import { Logger } from '@/utils/logger'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import type { TableColumn } from '@/types/common'
import type { ExportRecord } from '@/types/exportCenter'
import type { TaskDefinition, TaskRun, CronTaskState, TaskRunEvent, TaskTriggerPayload } from '@/types/system'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'

type TaskTab = 'definition' | 'run' | 'cron' | 'export'

const DEFAULT_TASK_TAB: TaskTab = 'definition'
const TASK_TABS: TaskTab[] = ['definition', 'run', 'cron', 'export']

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const normalizeTaskTab = (value: unknown): TaskTab => {
    if (typeof value !== 'string') return DEFAULT_TASK_TAB
    return TASK_TABS.includes(value as TaskTab) ? (value as TaskTab) : DEFAULT_TASK_TAB
}

const activeTab = ref<TaskTab>(normalizeTaskTab(route.query.tab))
const { options: commonStatusOptions, tagMap: commonStatusTagMap, load: loadCommonStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.commonStatus, commonStatusFallbackOptions)
const { tagMap: yesNoTagMap, load: loadYesNoOptions } = useDictOptions(SYSTEM_DICT_TYPES.yesNo, yesNoFallbackOptions)
const { options: taskKindOptions, tagMap: taskKindTagMap, load: loadTaskKindOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskKind, taskKindFallbackOptions)
const { options: taskSourceOptions, tagMap: taskSourceTagMap, load: loadTaskSourceOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskSource, taskSourceFallbackOptions)
const { options: taskRunStatusOptions, tagMap: taskRunStatusTagMap, load: loadTaskRunStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskRunStatus, taskRunStatusFallbackOptions)

const exportStatusOptions = computed(() => [
    { value: 'pending', label: t('system.task.exportStatusOptions.pending') },
    { value: 'running', label: t('system.task.exportStatusOptions.running') },
    { value: 'retrying', label: t('system.task.exportStatusOptions.retrying') },
    { value: 'success', label: t('system.task.exportStatusOptions.success') },
    { value: 'failed', label: t('system.task.exportStatusOptions.failed') },
    { value: 'canceled', label: t('system.task.exportStatusOptions.canceled') },
])

const taskQueryFormRef = ref<FormInstance>()
const runQueryFormRef = ref<FormInstance>()
const cronQueryFormRef = ref<FormInstance>()
const exportQueryFormRef = ref<FormInstance>()
const taskQuery = reactive(createTaskQuery())
const runQuery = reactive(createTaskRunQuery())
const cronQuery = reactive(createCronTaskStateQuery())
const exportQuery = reactive(createExportRecordQuery())
const runDateRange = ref<[string, string] | []>([])

const {
    loading: taskLoading,
    items: taskList,
    pagination: taskPagination,
    getList: getTaskList,
    handleSearch: handleTaskSearch,
} = useListPage<TaskDefinition, typeof taskQuery>({
    query: taskQuery,
    queryFormRef: taskQueryFormRef,
    fetcher: async (params) => {
        try {
            return await fetchTaskList(params)
        } catch (error) {
            Logger.error('获取任务定义列表失败:', error)
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const {
    loading: runLoading,
    items: runList,
    pagination: runPagination,
    getList: getRunList,
    handleSearch: handleRunSearch,
} = useListPage<TaskRun, typeof runQuery>({
    query: runQuery,
    queryFormRef: runQueryFormRef,
    transformParams: (query) => {
        const params = { ...query }
        const selectedDateRange = runDateRange.value.length === 2 ? runDateRange.value : null
        applyDateRangeToQuery(params, selectedDateRange)
        return params
    },
    fetcher: async (params) => {
        try {
            return await fetchTaskRunList(params)
        } catch (error) {
            Logger.error('获取任务执行记录列表失败:', error)
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const {
    loading: cronLoading,
    items: cronList,
    pagination: cronPagination,
    getList: getCronList,
    handleSearch: handleCronSearch,
} = useListPage<CronTaskState, typeof cronQuery>({
    query: cronQuery,
    queryFormRef: cronQueryFormRef,
    fetcher: async (params) => {
        try {
            return await fetchCronTaskStateList(params)
        } catch (error) {
            Logger.error('获取定时任务状态失败:', error)
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const exportEndpointReady = ref(true)

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

const runPollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const detailPollTimer = ref<ReturnType<typeof setInterval> | null>(null)
const exportPollTimer = ref<ReturnType<typeof setInterval> | null>(null)

const triggeringTaskCode = ref('')
const operatingRunId = ref<number | string | null>(null)
const showRunDetailDialog = ref(false)
const currentRunDetail = ref<TaskRun | null>(null)
const runEvents = ref<TaskRunEvent[]>([])
const runEventsLoading = ref(false)

const formatPayload = (payload?: string) => {
    if (!payload) return '-'
    try {
        return JSON.stringify(JSON.parse(payload), null, 2)
    } catch {
        return payload
    }
}

const formatEventMeta = (meta: TaskRunEvent['meta']) => {
    if (!meta) return '-'
    if (typeof meta === 'string') {
        try {
            return JSON.stringify(JSON.parse(meta), null, 2)
        } catch {
            return meta
        }
    }
    return JSON.stringify(meta, null, 2)
}

const hasActiveRunStatus = (list: { status: string }[]) => {
    return list.some((item) => ['pending', 'running', 'retrying'].includes(item.status))
}

const shouldPollExportList = computed(() => activeTab.value === 'export' && exportEndpointReady.value && hasActiveExportRecords(exportList.value))

const startRunListPolling = () => {
    stopRunListPolling()
    runPollTimer.value = setInterval(() => {
        if (activeTab.value === 'run' && hasActiveRunStatus(runList.value)) {
            getRunList()
        }
    }, 5000)
}

const stopRunListPolling = () => {
    if (runPollTimer.value) {
        clearInterval(runPollTimer.value)
        runPollTimer.value = null
    }
}

const startExportListPolling = () => {
    stopExportListPolling()
    exportPollTimer.value = setInterval(() => {
        if (!shouldPollExportList.value || exportLoading.value) return
        void getExportList()
    }, 5000)
}

const stopExportListPolling = () => {
    if (exportPollTimer.value) {
        clearInterval(exportPollTimer.value)
        exportPollTimer.value = null
    }
}

const startDetailPolling = () => {
    stopDetailPolling()
    detailPollTimer.value = setInterval(async () => {
        if (!currentRunDetail.value || !showRunDetailDialog.value) return
        if (!['pending', 'running', 'retrying'].includes(currentRunDetail.value.status)) return
        try {
            const detail = await fetchTaskRunDetail(currentRunDetail.value.id)
            currentRunDetail.value = detail
            runEvents.value = await fetchTaskRunEvents(currentRunDetail.value.id)
        } catch (error) {
            Logger.error('轮询任务执行详情失败:', error)
        }
    }, 5000)
}

const stopDetailPolling = () => {
    if (detailPollTimer.value) {
        clearInterval(detailPollTimer.value)
        detailPollTimer.value = null
    }
}

const handleTrigger = async (row: TaskDefinition) => {
    try {
        if (Number(row.allow_manual) !== 1 || Number(row.status) !== 1) return
        const isHighRisk = Number(row.is_high_risk) === 1
        const payload: TaskTriggerPayload = { task_code: row.code }
        if (isHighRisk) {
            const { value } = await ElMessageBox.prompt(t('system.task.triggerHighRiskPrompt'), t(CONFIRM_DIALOG_TITLE), {
                type: 'error',
                inputPlaceholder: t('system.task.reasonPlaceholder'),
                inputValidator: (value: string) => value.trim().length > 0 || t('system.task.confirmRequired'),
            })
            payload.confirm = value.trim()
            payload.reason = value.trim()
        } else {
            await ElMessageBox.confirm(t('system.task.triggerConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        }
        triggeringTaskCode.value = row.code
        await triggerTaskNow(payload)
        ElMessage.success(t('common.result.operationSuccess'))
        await getRunList()
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        Logger.error('触发任务失败:', error)
    } finally {
        triggeringTaskCode.value = ''
    }
}

const handleRunDetail = async (row: TaskRun) => {
    try {
        runEvents.value = []
        currentRunDetail.value = await fetchTaskRunDetail(row.id)
        showRunDetailDialog.value = true
        runEventsLoading.value = true
        runEvents.value = await fetchTaskRunEvents(row.id)
        if (['pending', 'running', 'retrying'].includes(currentRunDetail.value.status)) {
            startDetailPolling()
        }
    } catch (error) {
        Logger.error('获取任务执行详情失败:', error)
    } finally {
        runEventsLoading.value = false
    }
}

const handleRetry = async (row: TaskRun) => {
    try {
        await ElMessageBox.confirm(t('system.task.retryConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        operatingRunId.value = row.id
        await retryTaskByRunId(row.id)
        ElMessage.success(t('common.result.operationSuccess'))
        await getRunList()
    } catch {
        // noop
    } finally {
        operatingRunId.value = null
    }
}

const handleCancel = async (row: TaskRun) => {
    try {
        const { value } = await ElMessageBox.prompt(t('system.task.cancelConfirm'), t(CONFIRM_DIALOG_TITLE), {
            type: 'warning',
            inputPlaceholder: t('system.task.cancelReasonPlaceholder'),
        })
        operatingRunId.value = row.id
        await cancelTaskByRunId(row.id, value || '')
        ElMessage.success(t('common.result.operationSuccess'))
        await getRunList()
    } catch {
        // noop
    } finally {
        operatingRunId.value = null
    }
}

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
const getExportProgressDescription = (row: ExportRecord) => {
    const progressText = getExportRecordProgressText(row)
    if (row.stage_name && progressText) {
        return `${row.stage_name} - ${progressText}`
    }
    return row.stage_name || progressText
}

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
            globalThis.open(row.download_url, '_blank', 'noopener')
        }
    } catch (error) {
        Logger.error('打开导出文件失败:', error)
    }
}

const canRetryExportRecord = (row: ExportRecord) => {
    return !!row.task_run_id && ['failed', 'canceled'].includes(row.status || '')
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

const runActionButtons = computed(() => [
    {
        permission: '',
        text: t('common.actions.detail'),
        showIcon: false,
        click: (row: TaskRun) => handleRunDetail(row),
    },
    {
        permission: '',
        text: t('system.task.retry'),
        showIcon: false,
        disabled: (row: TaskRun) => row.status !== 'failed' || operatingRunId.value === row.id,
        click: (row: TaskRun) => handleRetry(row),
    },
    {
        permission: '',
        text: t('system.task.cancel'),
        showIcon: false,
        disabled: (row: TaskRun) => !['pending', 'running', 'retrying'].includes(row.status) || operatingRunId.value === row.id,
        click: (row: TaskRun) => handleCancel(row),
    },
])

const taskTableTitle = computed(
    () =>
        [
            { prop: 'id', h_label: t('common.labels.id'), width: 80, align: 'center' },
            { prop: 'code', h_label: t('system.task.code'), minWidth: 180, overflow: true },
            { prop: 'name', h_label: t('system.task.name'), minWidth: 160, overflow: true },
            {
                prop: 'kind',
                h_label: t('system.task.kind'),
                width: 100,
                align: 'center',
                customRow: true,
                tag: taskKindTagMap.value,
            },
            { prop: 'queue', h_label: t('system.task.queue'), minWidth: 120, overflow: true },
            { prop: 'cron_spec', h_label: t('system.task.cronSpec'), minWidth: 160, overflow: true },
            {
                prop: 'status',
                h_label: t('common.labels.status'),
                width: 100,
                align: 'center',
                customRow: true,
                tag: commonStatusTagMap.value,
            },
            {
                prop: 'allow_manual',
                h_label: t('system.task.allowManual'),
                width: 110,
                align: 'center',
                customRow: true,
                tag: yesNoTagMap.value,
            },
            {
                prop: 'allow_retry',
                h_label: t('system.task.allowRetry'),
                width: 110,
                align: 'center',
                customRow: true,
                tag: yesNoTagMap.value,
            },
            {
                prop: 'is_high_risk',
                h_label: t('system.task.highRisk'),
                width: 100,
                align: 'center',
                customRow: true,
                tag: {
                    1: { type: 'danger', text: t('common.yes') },
                    0: { type: 'info', text: t('common.no') },
                },
            },
            { prop: 'updated_at', h_label: t('common.labels.updatedAt'), width: 160, align: 'center' },
        ] as TableColumn<TaskDefinition>[]
)

const runTableTitle = computed(
    () =>
        [
            { prop: 'id', h_label: t('common.labels.id'), width: 80, align: 'center' },
            { prop: 'task_code', h_label: t('system.task.code'), minWidth: 160, overflow: true },
            {
                prop: 'kind',
                h_label: t('system.task.kind'),
                width: 90,
                align: 'center',
                customRow: true,
                tag: taskKindTagMap.value,
            },
            {
                prop: 'status',
                h_label: t('common.labels.status'),
                width: 110,
                align: 'center',
                customRow: true,
                formatter: (row) => row.status || '-',
                tag: taskRunStatusTagMap.value,
            },
            {
                prop: 'source',
                h_label: t('system.task.source'),
                width: 100,
                align: 'center',
                customRow: true,
                tag: taskSourceTagMap.value,
            },
            { prop: 'attempt', h_label: t('system.task.attempt'), width: 80, align: 'center' },
            { prop: 'max_retry', h_label: t('system.task.maxRetry'), width: 90, align: 'center' },
            { prop: 'duration_ms', h_label: t('system.task.durationMs'), width: 110, align: 'center' },
            { prop: 'started_at', h_label: t('system.task.startedAt'), width: 160, align: 'center' },
            { prop: 'finished_at', h_label: t('system.task.finishedAt'), width: 160, align: 'center' },
            { prop: 'error_message', h_label: t('system.task.errorMessage'), minWidth: 180, overflow: true },
        ] as TableColumn<TaskRun>[]
)

const cronTableTitle = computed(
    () =>
        [
            { prop: 'id', h_label: t('common.labels.id'), width: 80, align: 'center' },
            { prop: 'task_code', h_label: t('system.task.code'), minWidth: 160, overflow: true },
            { prop: 'cron_spec', h_label: t('system.task.cronSpec'), minWidth: 180, overflow: true },
            {
                prop: 'last_status',
                h_label: t('system.task.lastStatus'),
                width: 120,
                align: 'center',
                customRow: true,
                tag: taskRunStatusTagMap.value,
            },
            { prop: 'next_run_at', h_label: t('system.task.nextRunAt'), width: 160, align: 'center' },
            { prop: 'last_started_at', h_label: t('system.task.startedAt'), width: 160, align: 'center' },
            { prop: 'last_finished_at', h_label: t('system.task.finishedAt'), width: 160, align: 'center' },
            { prop: 'last_error', h_label: t('system.task.lastError'), minWidth: 200, overflow: true },
        ] as TableColumn<CronTaskState>[]
)

const exportTableTitle = computed(
    () =>
        [
            { prop: 'id', h_label: t('common.labels.id'), width: 80, align: 'center' },
            { prop: 'export_name', h_label: t('system.task.exportName'), minWidth: 180, overflow: true, customRow: true },
            { prop: 'scene', h_label: t('system.task.exportScene'), minWidth: 140, overflow: true, customRow: true },
            { prop: 'status', h_label: t('system.task.exportStatus'), width: 110, align: 'center', customRow: true },
            { prop: 'queue', h_label: t('system.task.queue'), minWidth: 110, overflow: true, customRow: true },
            { prop: 'progress', h_label: t('system.task.exportProgress'), width: 190, align: 'center', customRow: true },
            { prop: 'file_name', h_label: t('system.task.fileName'), minWidth: 220, overflow: true, customRow: true },
            { prop: 'file_size', h_label: t('system.task.fileSize'), width: 110, align: 'right', customRow: true },
            { prop: 'format', h_label: t('system.task.fileFormat'), width: 100, align: 'center', customRow: true },
            { prop: 'finished_at', h_label: t('system.task.finishedAt'), width: 160, align: 'center', customRow: true },
            { prop: 'fail_reason', h_label: t('system.task.failureReason'), minWidth: 220, overflow: true, customRow: true },
        ] as TableColumn<ExportRecord>[]
)

const loadActiveTabData = async (tab: TaskTab) => {
    if (tab === 'definition') {
        await getTaskList()
        return
    }

    if (tab === 'run') {
        await getRunList()
        startRunListPolling()
        return
    }

    if (tab === 'cron') {
        await getCronList()
        return
    }

    await getExportList()
}

watch(
    () => route.query.tab,
    (value) => {
        const nextTab = normalizeTaskTab(value)
        if (nextTab !== activeTab.value) {
            activeTab.value = nextTab
        }
    }
)

watch(activeTab, async (tab) => {
    if (tab !== 'run') {
        stopRunListPolling()
    }
    if (tab !== 'export') {
        stopExportListPolling()
    }

    if (route.query.tab !== tab) {
        void router.replace({
            query: {
                ...route.query,
                tab,
            },
        })
    }

    await loadActiveTabData(tab)
})

watch(showRunDetailDialog, (val) => {
    if (!val) stopDetailPolling()
})

watch(
    shouldPollExportList,
    (value) => {
        if (value) {
            startExportListPolling()
            return
        }
        stopExportListPolling()
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    stopRunListPolling()
    stopDetailPolling()
    stopExportListPolling()
})

onMounted(async () => {
    await Promise.all([loadCommonStatusOptions(), loadYesNoOptions(), loadTaskKindOptions(), loadTaskSourceOptions(), loadTaskRunStatusOptions()])
    await loadActiveTabData(activeTab.value)

    if (route.query.tab !== activeTab.value) {
        void router.replace({
            query: {
                ...route.query,
                tab: activeTab.value,
            },
        })
    }
})
</script>

<style scoped lang="scss">
.el-form-item {
    width: 100% !important;
}

.task-export-progress {
    min-width: 120px;

    .task-export-progress-text {
        margin-top: 6px;
        font-size: 12px;
        line-height: 1.4;
        color: var(--el-text-color-secondary);
        text-align: center;
    }
}

.task-payload-block {
    .task-payload-title {
        font-size: 13px;
        margin-bottom: 8px;
        color: var(--el-text-color-secondary);
    }

    pre {
        background: var(--el-fill-color-light);
        padding: 12px;
        border-radius: 6px;
        max-height: 320px;
        overflow: auto;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
    }
}

.task-events-block {
    .task-payload-title {
        font-size: 13px;
        margin-bottom: 8px;
        color: var(--el-text-color-secondary);
    }

    .task-event-card {
        border: 1px solid var(--el-border-color-light);
        border-radius: 6px;
        padding: 10px 12px;
    }

    .task-event-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 8px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
    }

    .task-event-message {
        color: var(--el-text-color-primary);
        line-height: 1.6;
        word-break: break-word;
    }

    .task-event-meta {
        background: var(--el-fill-color-light);
        padding: 10px;
        border-radius: 6px;
        max-height: 220px;
        overflow: auto;
        margin: 8px 0 0;
        white-space: pre-wrap;
        word-break: break-word;
    }
}
</style>
