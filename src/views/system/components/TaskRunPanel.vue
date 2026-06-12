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
                    <el-col :span="3">
                        <el-form-item :label="t('system.task.source')" prop="source">
                            <el-select v-model="runQuery.source" clearable>
                                <el-option v-for="item in taskSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('system.task.sourceId')" prop="source_id">
                            <el-input v-model.trim="runQuery.source_id" :placeholder="t('system.task.sourceIdPlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('system.task.detailRecordMode')" prop="detail_record_mode">
                            <el-select v-model="runQuery.detail_record_mode" clearable>
                                <el-option v-for="item in detailRecordModeOptions" :key="item.value" :label="item.label" :value="item.value" />
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
            <el-alert class="xl-m-bottom-10" :title="t('system.task.detailSamplingTip')" type="info" show-icon />
            <xl-table-list :loading="runLoading" :data="runList" :tableTitle="runTableTitle" :pagination="runPagination">
                <template #td="{ item, val }">
                    <template v-if="item.tag">
                        <el-tag v-if="val && val !== '-' && item.tag[val as string | number]" :type="item.tag[val as string | number]?.type || 'info'">
                            {{ item.tag[val as string | number]?.text || val }}
                        </el-tag>
                    </template>
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

        <el-drawer v-model="showRunDetailDrawer" :title="t('system.task.runDetailTitle')" size="min(960px, 92vw)" destroy-on-close>
            <!-- 基本信息 -->
            <div class="section-title xl-m-bottom-10">
                <div class="section-title-line"></div>
                <div>{{ t('system.task.baseInfo') }}</div>
            </div>
            <el-descriptions v-if="currentRunDetail" :column="2" border class="custom-descriptions xl-m-bottom-20">
                <el-descriptions-item :label="t('common.labels.id')">{{ currentRunDetail.id }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.code')">{{ currentRunDetail.task_code }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.kind')">
                    <el-tag size="small" :type="taskKindTagMap[currentRunDetail.kind]?.type || 'info'" effect="light">
                        {{ taskKindTagMap[currentRunDetail.kind]?.text || currentRunDetail.kind }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('common.labels.status')">
                    <el-tag size="small" :type="taskRunStatusTagMap[currentRunDetail.status]?.type || 'info'" effect="light">
                        {{ taskRunStatusTagMap[currentRunDetail.status]?.text || currentRunDetail.status }}
                    </el-tag>
                </el-descriptions-item>
            </el-descriptions>

            <!-- 触发信息 -->
            <div class="section-title xl-m-bottom-10">
                <div class="section-title-line"></div>
                <div>{{ t('system.task.triggerInfo') }}</div>
            </div>
            <el-descriptions v-if="currentRunDetail" :column="2" border class="custom-descriptions xl-m-bottom-20">
                <el-descriptions-item :label="t('system.task.source')">
                    <el-tag size="small" :type="taskSourceTagMap[currentRunDetail.source]?.type || 'info'" effect="light">
                        {{ taskSourceTagMap[currentRunDetail.source]?.text || currentRunDetail.source }}
                    </el-tag>
                </el-descriptions-item>
                <el-descriptions-item :label="t('system.task.operator')">{{ formatTaskRunOperator(currentRunDetail) }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.sourceId')" :span="2">
                    <span class="detail-nowrap">{{ currentRunDetail.source_id || '-' }}</span>
                </el-descriptions-item>
            </el-descriptions>

            <!-- 执行信息 -->
            <div class="section-title xl-m-bottom-10">
                <div class="section-title-line"></div>
                <div>{{ t('system.task.executionInfo') }}</div>
            </div>
            <el-descriptions v-if="currentRunDetail" :column="2" border class="custom-descriptions xl-m-bottom-20">
                <el-descriptions-item :label="t('system.task.startedAt')">{{ currentRunDetail.started_at || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.finishedAt')">{{ currentRunDetail.finished_at || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.detailRecordMode')" :span="2">
                    <el-tag v-if="currentRunDetail.detail_record_mode" size="small" :type="detailRecordModeTagMap[currentRunDetail.detail_record_mode]?.type || 'info'" effect="light">
                        {{ detailRecordModeTagMap[currentRunDetail.detail_record_mode]?.text || currentRunDetail.detail_record_mode }}
                    </el-tag>
                    <span v-else>-</span>
                </el-descriptions-item>
            </el-descriptions>

            <!-- 重试信息 -->
            <div class="section-title xl-m-bottom-10">
                <div class="section-title-line"></div>
                <div>{{ t('system.task.retryInfo') }}</div>
            </div>
            <el-descriptions v-if="currentRunDetail" :column="2" border class="custom-descriptions xl-m-bottom-20">
                <el-descriptions-item :label="t('system.task.maxRetry')">{{ currentRunDetail.max_retry ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.attempt')">{{ currentRunDetail.attempt ?? '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.retryCount')">{{ currentRunDetail.retry_count ?? 0 }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.latestRetryRunId')">{{ currentRunDetail.latest_retry_run_id || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.latestRetryStatus')">
                    <el-tag v-if="currentRunDetail.latest_retry_status" size="small" :type="taskRunStatusTagMap[currentRunDetail.latest_retry_status]?.type || 'info'" effect="light">
                        {{ taskRunStatusTagMap[currentRunDetail.latest_retry_status]?.text || currentRunDetail.latest_retry_status }}
                    </el-tag>
                    <span v-else>-</span>
                </el-descriptions-item>
                <el-descriptions-item :label="t('system.task.retryOfRunId')">{{ currentRunDetail.retry_of_run_id || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.retryRootRunId')">{{ currentRunDetail.retry_root_run_id || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.retrySeq')" :span="2">{{ currentRunDetail.retry_seq || '-' }}</el-descriptions-item>
                <el-descriptions-item :label="t('system.task.canRetry')" :span="2">
                    <el-tag size="small" :type="currentRunDetail.can_retry ? 'success' : 'info'" effect="light">
                        {{ currentRunDetail.can_retry ? t('common.yes') : t('common.no') }}
                    </el-tag>
                    <span v-if="!currentRunDetail.can_retry && currentRunDetail.retry_block_reason" class="retry-reason detail-nowrap">（{{ currentRunDetail.retry_block_reason }}）</span>
                </el-descriptions-item>
            </el-descriptions>

            <!-- 错误信息 -->
            <template v-if="currentRunDetail && currentRunDetail.error_message">
                <div class="section-title xl-m-bottom-10 text-danger">
                    <div class="section-title-line" style="background-color: var(--el-color-danger)"></div>
                    <div>{{ t('system.task.errorInfo') }}</div>
                </div>
                <div class="custom-pre-container xl-m-bottom-20" style="border-color: var(--el-color-danger-light-7); background-color: var(--el-color-danger-light-9)">
                    <pre class="custom-pre" style="color: var(--el-color-danger)">{{ currentRunDetail.error_message }}</pre>
                </div>
            </template>

            <div class="task-payload-block xl-m-bottom-20">
                <div class="section-title xl-m-bottom-10">
                    <div class="section-title-line"></div>
                    <div>{{ t('system.task.payload') }}</div>
                </div>
                <div class="custom-pre-container">
                    <pre class="custom-pre">{{ formatPayload(currentRunDetail?.payload) }}</pre>
                </div>
            </div>

            <div class="task-events-block">
                <div class="section-title xl-m-bottom-10">
                    <div class="section-title-line"></div>
                    <div>{{ t('system.task.events') }}</div>
                </div>
                <el-skeleton v-if="runEventsLoading" animated :rows="4" />
                <el-empty v-else-if="runEvents.length === 0" :description="t('system.task.noEvents')" :image-size="80" />
                <el-timeline v-else class="custom-timeline">
                    <el-timeline-item v-for="(event, index) in runEvents" :key="event.id" :timestamp="event.created_at" placement="top" :type="index === 0 ? 'primary' : 'info'">
                        <div class="task-event-card">
                            <div class="task-event-header">
                                <div class="task-event-type">
                                    <el-tag size="small" :type="index === 0 ? 'primary' : 'info'" effect="light">{{ event.event_type || '-' }}</el-tag>
                                </div>
                                <span class="task-event-id">#{{ event.id }}</span>
                            </div>
                            <div class="task-event-message">{{ event.message || '-' }}</div>
                            <div v-if="event.meta" class="task-event-meta custom-pre-container">
                                <pre class="custom-pre">{{ formatEventMeta(event.meta) }}</pre>
                            </div>
                        </div>
                    </el-timeline-item>
                </el-timeline>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onActivated, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import { useListPage } from '@/composables/useListPage'
import { useIntervalPolling } from '@/composables/useIntervalPolling'
import { useDictOptions } from '@/composables/useDictOptions'
import { createTaskRunQuery } from '@/modules/system/model'
import { SYSTEM_DICT_TYPES, taskKindFallbackOptions, taskSourceFallbackOptions, taskRunStatusFallbackOptions, taskDetailRecordModeFallbackOptions } from '@/modules/system/dictOptions'
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
const { options: detailRecordModeOptions, tagMap: detailRecordModeTagMap, load: loadDetailRecordModeOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskDetailRecordMode, taskDetailRecordModeFallbackOptions)

const runQueryFormRef = ref<FormInstance>()
const runQuery = reactive(createTaskRunQuery())
const runDateRange = ref<[string, string] | []>([])
const operatingRunId = ref<number | string | null>(null)

const showRunDetailDrawer = ref(false)
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

const canRetryTaskRun = (row: TaskRun) => {
    return row.can_retry === true && ['failed', 'timeout', 'interrupted'].includes(row.status || '')
}

const formatTaskRunOperator = (row: TaskRun) => {
    if (row.source !== 'manual') {
        return t('system.task.systemOperator')
    }
    if (row.trigger_account) {
        return row.trigger_account
    }
    return row.trigger_user_id ? `ID: ${row.trigger_user_id}` : '-'
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
        if (!currentRunDetail.value || !showRunDetailDrawer.value) return
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
        when: () => !!currentRunDetail.value && showRunDetailDrawer.value,
        pauseWhenHidden: true,
    }
)

const handleRunDetail = async (row: TaskRun) => {
    try {
        runEvents.value = []
        currentRunDetail.value = await fetchTaskRunDetail(row.id)
        showRunDetailDrawer.value = true
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
    if (!canRetryTaskRun(row)) return
    try {
        await ElMessageBox.confirm(t('system.task.retryConfirm'), t(CONFIRM_DIALOG_TITLE), { type: 'warning' })
        operatingRunId.value = row.id
        await retryTaskByRunId(row.id)
        ElMessage.success(t('common.result.operationSuccess'))
        await getRunList()
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        ElMessage.error(t('common.result.operationFailed'))
        Logger.error('重试任务失败:', error)
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
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        ElMessage.error(t('common.result.operationFailed'))
        Logger.error('取消任务失败:', error)
    } finally {
        operatingRunId.value = null
    }
}

const runActionButtons = computed(() => [
    {
        permission: 'task:detail',
        text: t('common.actions.detail'),
        showIcon: false,
        click: (row: TaskRun) => handleRunDetail(row),
    },
    {
        permission: 'task:retry',
        text: t('system.task.retry'),
        showIcon: false,
        visible: (row: TaskRun) => canRetryTaskRun(row),
        disabled: (row: TaskRun) => operatingRunId.value === row.id,
        click: (row: TaskRun) => handleRetry(row),
    },
    {
        permission: 'task:cancel',
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
            { prop: 'trigger_account', h_label: t('system.task.operator'), width: 120, align: 'center', formatter: formatTaskRunOperator },
            {
                prop: 'detail_record_mode',
                h_label: t('system.task.detailRecordMode'),
                width: 120,
                align: 'center',
                customRow: true,
                tag: detailRecordModeTagMap.value,
            },
            { prop: 'attempt', h_label: t('system.task.attempt'), width: 80, align: 'center' },
            { prop: 'max_retry', h_label: t('system.task.maxRetry'), width: 90, align: 'center' },
            { prop: 'retry_seq', h_label: t('system.task.retrySeq'), width: 90, align: 'center', formatter: (row) => row.retry_seq || '-' },
            { prop: 'retry_of_run_id', h_label: t('system.task.retryOfRunId'), width: 120, align: 'center', formatter: (row) => row.retry_of_run_id || '-' },
            { prop: 'duration_ms', h_label: t('system.task.durationMs'), width: 110, align: 'center' },
            { prop: 'started_at', h_label: t('system.task.startedAt'), width: 160, align: 'center' },
            { prop: 'finished_at', h_label: t('system.task.finishedAt'), width: 160, align: 'center' },
            { prop: 'error_message', h_label: t('system.task.errorMessage'), minWidth: 180, overflow: true },
        ] as TableColumn<TaskRun>[]
)

watch(showRunDetailDrawer, (val) => {
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
    await Promise.all([loadTaskKindOptions(), loadTaskSourceOptions(), loadTaskRunStatusOptions(), loadDetailRecordModeOptions()])
    await getRunList()
    if (props.active) runListPolling.start()
})

onActivated(() => {
    void getRunList()
})
</script>

<style scoped lang="scss">
:deep(.el-form-item) {
    width: 100%;
}

.section-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    display: flex;
    align-items: center;

    .section-title-line {
        width: 4px;
        height: 16px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
        margin-right: 8px;
    }
}

.custom-descriptions {
    :deep(.el-descriptions__label) {
        background-color: var(--el-fill-color-light);
        color: var(--el-text-color-secondary);
        width: 130px;
    }

    :deep(.el-descriptions__content) {
        color: var(--el-text-color-primary);
        font-weight: 500;
        vertical-align: middle;
    }

    .detail-nowrap {
        display: inline-block;
        max-width: 100%;
        white-space: nowrap;
        overflow-x: auto;
        overflow-y: hidden;
        vertical-align: middle;
    }

    .text-danger {
        color: var(--el-color-danger);
    }

    .retry-reason {
        color: var(--el-text-color-secondary);
        font-size: 13px;
        margin-left: 4px;
        font-weight: 400;
    }
}

.custom-pre-container {
    background: var(--el-fill-color-light);
    border-radius: var(--xl-radius-md);
    border: 1px solid var(--el-border-color-lighter);

    .custom-pre {
        padding: var(--xl-space-3);
        max-height: 320px;
        overflow: auto;
        margin: 0;
        white-space: pre-wrap;
        word-break: break-word;
        font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
        font-size: 13px;
        color: var(--el-text-color-regular);
        line-height: 1.5;

        &::-webkit-scrollbar {
            width: 6px;
            height: 6px;
        }

        &::-webkit-scrollbar-thumb {
            background-color: var(--el-border-color-darker);
            border-radius: 3px;
        }
    }
}

.task-events-block {
    .custom-timeline {
        padding-left: 2px;
        padding-top: 10px;
    }

    .task-event-card {
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 6px;
        padding: 12px 16px;
        background-color: var(--el-bg-color-overlay);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        transition: all 0.3s;

        &:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            border-color: var(--el-border-color-light);
        }
    }

    .task-event-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .task-event-type {
            display: flex;
            align-items: center;
        }

        .task-event-id {
            color: var(--el-text-color-placeholder);
            font-size: 13px;
            font-family: monospace;
        }
    }

    .task-event-message {
        color: var(--el-text-color-primary);
        line-height: 1.6;
        word-break: break-word;
        font-size: 14px;
    }

    .task-event-meta {
        margin-top: 12px;

        .custom-pre {
            max-height: 220px;
            background-color: transparent;
            border: none;
            padding: 8px 12px;
        }
    }
}
</style>
