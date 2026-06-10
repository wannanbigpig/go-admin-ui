<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
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
                    <xl-collapsible-search-btn :loading="taskLoading" :maxShow="4" :onSearch="handleTaskSearch" :onReset="handleTaskReset" :modelRef="taskQueryFormRef" nodeName="#taskSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <xl-table-list :loading="taskLoading" :data="taskList" :tableTitle="taskTableTitle" :pagination="taskPagination">
                <template #td="{ item, val }">
                    <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                        {{ item.tag[val as string | number]?.text || val }}
                    </el-tag>
                    <span v-else>{{ val }}</span>
                </template>
                <template #operation>
                    <el-table-column width="260" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-button
                                v-permission="'task:trigger'"
                                code="task:trigger"
                                type="primary"
                                link
                                :show-icon="false"
                                :text="t('system.task.triggerNow')"
                                :disabled="Number(scope.row.allow_manual) !== 1 || Number(scope.row.status) !== 1 || triggeringTaskCode === scope.row.code"
                                @click="handleTrigger(scope.row)"
                            />
                            <xl-action-button
                                v-permission="'task:update'"
                                code="task:update"
                                type="primary"
                                link
                                :show-icon="false"
                                :text="t('system.task.operationConfig')"
                                @click="handleOpenOperationConfig(scope.row)"
                            />
                            <xl-action-button v-permission="'task:update'" code="task:update" type="primary" link :show-icon="false" :text="t('system.task.recordPolicy')" @click="handleOpenRecordPolicy(scope.row)" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>

        <el-drawer v-model="showOperationConfigDrawer" :title="t('system.task.operationConfigTitle')" size="520px" destroy-on-close>
            <el-alert class="xl-m-bottom-10" :title="t('system.task.operationConfigNotice')" type="warning" show-icon />
            <el-form label-position="top" :model="operationConfigForm">
                <el-form-item :label="t('system.task.code')">
                    <el-input v-model="operationConfigForm.task_code" disabled />
                </el-form-item>
                <el-form-item :label="t('common.labels.status')">
                    <el-switch v-model="operationConfigForm.status" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item :label="t('system.task.allowManual')">
                    <el-switch v-model="operationConfigForm.allow_manual" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item :label="t('system.task.allowRetry')">
                    <el-switch v-model="operationConfigForm.allow_retry" :active-value="1" :inactive-value="0" />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="task-drawer-footer">
                    <el-button @click="showOperationConfigDrawer = false">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" :loading="savingOperationConfig" @click="handleSaveOperationConfig">{{ t('system.task.saveOperationConfig') }}</el-button>
                </div>
            </template>
        </el-drawer>

        <el-drawer v-model="showRecordPolicyDrawer" :title="t('system.task.recordPolicyTitle')" size="520px" destroy-on-close>
            <el-alert class="xl-m-bottom-10" :title="recordPolicyNotice" type="info" show-icon />
            <el-form label-position="top" :model="recordPolicyForm">
                <el-form-item :label="t('system.task.code')">
                    <el-input v-model="recordPolicyForm.task_code" disabled />
                </el-form-item>
                <el-form-item :label="t('system.task.recordSuccessMode')">
                    <el-select v-model="recordPolicyForm.record_success_mode">
                        <el-option v-for="item in recordSuccessModeOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('system.task.recordSuccessRate')">
                    <el-input-number v-model="recordPolicyForm.record_success_rate" :min="0" :max="100" :step="5" controls-position="right" />
                </el-form-item>
                <el-form-item :label="t('system.task.recordSuccessIntervalSeconds')">
                    <el-input-number v-model="recordPolicyForm.record_success_interval_seconds" :min="0" :step="60" controls-position="right" />
                </el-form-item>
                <el-form-item :label="t('system.task.recordDetailOnManual')">
                    <el-switch v-model="recordPolicyForm.record_detail_on_manual" :active-value="1" :inactive-value="0" />
                </el-form-item>
                <el-form-item :label="t('system.task.recordDetailOnFailure')">
                    <el-switch v-model="recordPolicyForm.record_detail_on_failure" :active-value="1" :inactive-value="0" disabled />
                </el-form-item>
            </el-form>
            <template #footer>
                <div class="task-drawer-footer">
                    <el-button @click="showRecordPolicyDrawer = false">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" :loading="savingRecordPolicy" @click="handleSaveRecordPolicy">{{ t('system.task.saveRecordPolicy') }}</el-button>
                </div>
            </template>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { useListPage } from '@/composables/useListPage'
import { useDictOptions } from '@/composables/useDictOptions'
import { createTaskOperationConfigPayload, createTaskQuery, createTaskRecordPolicyPayload } from '@/modules/system/model'
import { SYSTEM_DICT_TYPES, commonStatusFallbackOptions, yesNoFallbackOptions, taskKindFallbackOptions, taskRecordSuccessModeFallbackOptions } from '@/modules/system/dictOptions'
import { fetchTaskList, modifyTaskOperationConfig, modifyTaskRecordPolicy, triggerTaskNow } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { TableColumn } from '@/types/common'
import type { TaskDefinition, TaskOperationConfigPayload, TaskRecordPolicyPayload, TaskTriggerPayload } from '@/types/system'
import { CONFIRM_DIALOG_TITLE } from '@/constants/messages'

const { t } = useI18n()

const { options: commonStatusOptions, tagMap: commonStatusTagMap, load: loadCommonStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.commonStatus, commonStatusFallbackOptions)
const { tagMap: yesNoTagMap, load: loadYesNoOptions } = useDictOptions(SYSTEM_DICT_TYPES.yesNo, yesNoFallbackOptions)
const { options: taskKindOptions, tagMap: taskKindTagMap, load: loadTaskKindOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskKind, taskKindFallbackOptions)
const { options: recordSuccessModeOptions, tagMap: recordSuccessModeTagMap, load: loadRecordSuccessModeOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskRecordSuccessMode, taskRecordSuccessModeFallbackOptions)

const taskQueryFormRef = ref<FormInstance>()
const taskQuery = reactive(createTaskQuery())
const triggeringTaskCode = ref('')
const showOperationConfigDrawer = ref(false)
const showRecordPolicyDrawer = ref(false)
const savingOperationConfig = ref(false)
const savingRecordPolicy = ref(false)
const currentPolicyTask = ref<TaskDefinition | null>(null)
const operationConfigForm = reactive<TaskOperationConfigPayload>(createTaskOperationConfigPayload())
const recordPolicyForm = reactive<TaskRecordPolicyPayload>(createTaskRecordPolicyPayload())

const {
    loading: taskLoading,
    items: taskList,
    pagination: taskPagination,
    getList: getTaskList,
    handleSearch: handleTaskSearch,
    handleReset: handleTaskReset,
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

const emit = defineEmits<{
    (e: 'triggered'): void
}>()

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
        emit('triggered')
    } catch (error) {
        if (error === 'cancel' || error === 'close') return
        Logger.error('触发任务失败:', error)
    } finally {
        triggeringTaskCode.value = ''
    }
}

const recordPolicyNotice = computed(() => {
    if (!currentPolicyTask.value) return t('system.task.recordPolicyNotice')
    if (Number(currentPolicyTask.value.is_high_risk) === 1) return t('system.task.recordPolicyHighRiskNotice')
    if (currentPolicyTask.value.code.startsWith('export:')) return t('system.task.recordPolicyExportNotice')
    if (Number(currentPolicyTask.value.allow_manual) === 1) return t('system.task.recordPolicyManualNotice')
    return t('system.task.recordPolicyNotice')
})

const handleOpenOperationConfig = (row: TaskDefinition) => {
    Object.assign(operationConfigForm, createTaskOperationConfigPayload(row))
    showOperationConfigDrawer.value = true
}

const handleSaveOperationConfig = async () => {
    try {
        savingOperationConfig.value = true
        await modifyTaskOperationConfig({ ...operationConfigForm })
        ElMessage.success(t('common.result.operationSuccess'))
        showOperationConfigDrawer.value = false
        await getTaskList()
    } catch (error) {
        Logger.error('更新任务运营配置失败:', error)
    } finally {
        savingOperationConfig.value = false
    }
}

const handleOpenRecordPolicy = (row: TaskDefinition) => {
    currentPolicyTask.value = row
    Object.assign(recordPolicyForm, createTaskRecordPolicyPayload(row))
    recordPolicyForm.record_detail_on_failure = 1
    showRecordPolicyDrawer.value = true
}

const handleSaveRecordPolicy = async () => {
    try {
        savingRecordPolicy.value = true
        recordPolicyForm.record_detail_on_failure = 1
        await modifyTaskRecordPolicy({ ...recordPolicyForm })
        ElMessage.success(t('common.result.operationSuccess'))
        showRecordPolicyDrawer.value = false
        await getTaskList()
    } catch (error) {
        Logger.error('更新任务记录策略失败:', error)
    } finally {
        savingRecordPolicy.value = false
    }
}

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
            {
                prop: 'record_success_mode',
                h_label: t('system.task.recordSuccessMode'),
                width: 130,
                align: 'center',
                customRow: true,
                tag: recordSuccessModeTagMap.value,
            },
            { prop: 'record_success_rate', h_label: t('system.task.recordSuccessRate'), width: 120, align: 'center' },
            { prop: 'record_success_interval_seconds', h_label: t('system.task.recordSuccessIntervalSecondsShort'), width: 130, align: 'center' },
            { prop: 'updated_at', h_label: t('common.labels.updatedAt'), width: 160, align: 'center' },
        ] as TableColumn<TaskDefinition>[]
)

onMounted(async () => {
    await Promise.all([loadCommonStatusOptions(), loadYesNoOptions(), loadTaskKindOptions(), loadRecordSuccessModeOptions()])
    await getTaskList()
})
</script>

<style scoped lang="scss">
:deep(.el-form-item) {
    width: 100%;
}

.task-drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--xl-space-2);
}
</style>
