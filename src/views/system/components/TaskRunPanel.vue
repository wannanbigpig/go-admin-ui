<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
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
                    <xl-collapsible-search-btn :loading="runLoading" :maxShow="4" :onSearch="handleRunSearch" :onReset="handleRunReset" :modelRef="runQueryFormRef" nodeName="#runSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <xl-table-list :loading="runLoading" :data="runList" :tableTitle="runTableTitle" :pagination="runPagination">
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import { useListPage } from '@/composables/useListPage'
import { useIntervalPolling } from '@/composables/useIntervalPolling'
import { useDictOptions, getDictOptionLabel } from '@/composables/useDictOptions'
import { createTaskRunQuery } from '@/modules/system/model'
import { SYSTEM_DICT_TYPES, taskKindFallbackOptions, taskSourceFallbackOptions, taskRunStatusFallbackOptions } from '@/modules/system/dictOptions'
import { fetchTaskRunList, fetchTaskRunDetail, fetchTaskRunEvents, retryTaskByRunId, cancelTaskByRunId } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import type { TableColumn } from '@/types/common'
import type { TaskRun, TaskRunEvent } from '@/types/system'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'

const props = defineProps<{ active: boolean }>()

const { t } = useI18n()
const { options: taskKindOptions, tagMap: taskKindTagMap, load: loadTaskKindOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskKind, taskKindFallbackOptions)
const { options: taskSourceOptions, tagMap: taskSourceTagMap, load: loadTaskSourceOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskSource, taskSourceFallbackOptions)
const { options: taskRunStatusOptions, tagMap: taskRunStatusTagMap, load: loadTaskRunStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskRunStatus, taskRunStatusFallbackOptions)

const runQueryFormRef = ref<FormInstance>()
const runQuery = reactive(createTaskRunQuery())
const runDateRange = ref<[string, string] | []>([])
const operatingRunId = ref<number | string | null>(null)

const showRunDetailDialog = ref(false)
const currentRunDetail = ref<TaskRun | null>(null)
const runEvents = ref<TaskRunEvent[]>([])
const runEventsLoading = ref(false)

const {
    loading: runLoading,
    items: runList,
    pagination: runPagination,
    getList: getRunList,
    handleSearch: handleRunSearch,
    handleReset: rawHandleRunReset,
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

const handleRunReset = async () => {
    runDateRange.value = []
    await rawHandleRunReset()
}

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

const runListPolling = useIntervalPolling(
    async ({ signal }) => {
        await getRunList()
        if (signal.aborted) return
    },
    {
        interval: 5000,
        when: () => props.active && hasActiveRunStatus(runList.value),
        pauseWhenHidden: true,
    }
)

const detailPolling = useIntervalPolling(
    async ({ signal }) => {
        if (!currentRunDetail.value || !showRunDetailDialog.value) return
        if (!['pending', 'running', 'retrying'].includes(currentRunDetail.value.status)) return
        try {
            const [detail, events] = await Promise.all([fetchTaskRunDetail(currentRunDetail.value.id), fetchTaskRunEvents(currentRunDetail.value.id)])
            if (signal.aborted) return
            currentRunDetail.value = detail
            runEvents.value = events
        } catch (error) {
            if (signal.aborted) return
            Logger.error('轮询任务执行详情失败:', error)
        }
    },
    {
        interval: 5000,
        when: () => !!currentRunDetail.value && showRunDetailDialog.value,
        pauseWhenHidden: true,
    }
)

const handleRunDetail = async (row: TaskRun) => {
    try {
        runEvents.value = []
        currentRunDetail.value = await fetchTaskRunDetail(row.id)
        showRunDetailDialog.value = true
        runEventsLoading.value = true
        runEvents.value = await fetchTaskRunEvents(row.id)
        if (['pending', 'running', 'retrying'].includes(currentRunDetail.value.status)) {
            detailPolling.start()
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

watch(showRunDetailDialog, (val) => {
    if (!val) detailPolling.stop()
})

watch(
    () => props.active,
    (val) => {
        if (val) {
            runListPolling.resume()
        } else {
            runListPolling.pause()
        }
    }
)

defineExpose({
    refresh: getRunList,
})

onMounted(async () => {
    await Promise.all([loadTaskKindOptions(), loadTaskSourceOptions(), loadTaskRunStatusOptions()])
    await getRunList()
    if (props.active) runListPolling.start()
})
</script>

<style scoped lang="scss">
:deep(.el-form-item) {
    width: 100%;
}

.task-payload-block {
    .task-payload-title {
        font-size: var(--xl-font-md);
        margin-bottom: var(--xl-space-2);
        color: var(--el-text-color-secondary);
    }

    pre {
        background: var(--el-fill-color-light);
        padding: var(--xl-space-3);
        border-radius: var(--xl-radius-md);
        max-height: 320px;
        overflow: auto;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
    }
}

.task-events-block {
    .task-payload-title {
        font-size: var(--xl-font-md);
        margin-bottom: var(--xl-space-2);
        color: var(--el-text-color-secondary);
    }

    .task-event-card {
        border: 1px solid var(--el-border-color-light);
        border-radius: var(--xl-radius-md);
        padding: 10px var(--xl-space-3);
    }

    .task-event-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--xl-space-3);
        margin-bottom: var(--xl-space-2);
        color: var(--el-text-color-secondary);
        font-size: var(--xl-font-sm);
    }

    .task-event-message {
        color: var(--el-text-color-primary);
        line-height: 1.6;
        word-break: break-word;
    }

    .task-event-meta {
        background: var(--el-fill-color-light);
        padding: 10px;
        border-radius: var(--xl-radius-md);
        max-height: 220px;
        overflow: auto;
        margin: var(--xl-space-2) 0 0;
        white-space: pre-wrap;
        word-break: break-word;
    }
}
</style>
