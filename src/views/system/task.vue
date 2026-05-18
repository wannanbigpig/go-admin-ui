<template>
    <div>
        <el-tabs v-model="activeTab" class="xl-container xl-tabs xl-m-bottom-10">
            <el-tab-pane :label="t('system.task.definitionTab')" name="definition" />
            <el-tab-pane :label="t('system.task.runTab')" name="run" />
            <el-tab-pane :label="t('system.task.cronTab')" name="cron" />
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

        <div class="xl-container">
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
        </div>

        <el-dialog v-model="showRunDetailDialog" :title="t('system.task.runDetailTitle')" width="860px" destroy-on-close>
            <el-descriptions :column="2" border v-if="currentRunDetail">
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import { useI18n } from 'vue-i18n'
import { useListPage } from '@/composables/useListPage'
import { useDictOptions, getDictOptionLabel } from '@/composables/useDictOptions'
import { createTaskQuery, createTaskRunQuery, createCronTaskStateQuery } from '@/modules/system/model'
import { SYSTEM_DICT_TYPES, commonStatusFallbackOptions, yesNoFallbackOptions, taskKindFallbackOptions, taskSourceFallbackOptions, taskRunStatusFallbackOptions } from '@/modules/system/dictOptions'
import { fetchTaskList, fetchTaskRunList, fetchTaskRunDetail, fetchCronTaskStateList, fetchTaskRunEvents, triggerTaskNow, retryTaskByRunId, cancelTaskByRunId } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import type { TableColumn } from '@/types/common'
import type { TaskDefinition, TaskRun, CronTaskState, TaskRunEvent, TaskTriggerPayload } from '@/types/system'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'

const { t } = useI18n()

const activeTab = ref<'definition' | 'run' | 'cron'>('definition')
const { options: commonStatusOptions, tagMap: commonStatusTagMap, load: loadCommonStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.commonStatus, commonStatusFallbackOptions)
const { tagMap: yesNoTagMap, load: loadYesNoOptions } = useDictOptions(SYSTEM_DICT_TYPES.yesNo, yesNoFallbackOptions)
const { options: taskKindOptions, tagMap: taskKindTagMap, load: loadTaskKindOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskKind, taskKindFallbackOptions)
const { options: taskSourceOptions, tagMap: taskSourceTagMap, load: loadTaskSourceOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskSource, taskSourceFallbackOptions)
const { options: taskRunStatusOptions, tagMap: taskRunStatusTagMap, load: loadTaskRunStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskRunStatus, taskRunStatusFallbackOptions)

const taskQueryFormRef = ref<FormInstance>()
const runQueryFormRef = ref<FormInstance>()
const cronQueryFormRef = ref<FormInstance>()
const taskQuery = reactive(createTaskQuery())
const runQuery = reactive(createTaskRunQuery())
const cronQuery = reactive(createCronTaskStateQuery())
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

watch(activeTab, async (tab) => {
    if (tab === 'definition') {
        await getTaskList()
    } else if (tab === 'run') {
        await getRunList()
    } else {
        await getCronList()
    }
})

onMounted(async () => {
    await Promise.all([loadCommonStatusOptions(), loadYesNoOptions(), loadTaskKindOptions(), loadTaskSourceOptions(), loadTaskRunStatusOptions(), getTaskList()])
})
</script>

<style scoped lang="scss">
.el-form-item {
    width: 100% !important;
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
