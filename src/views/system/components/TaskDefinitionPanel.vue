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
                <template #td="{ item, val, row }">
                    <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                        {{ item.tag[val as string | number]?.text || val }}
                    </el-tag>
                    <div v-else-if="item.prop === 'cron_spec'" class="cron-spec-cell">
                        <span class="cron-spec-value">{{ row.cron_spec || '-' }}</span>
                        <span v-if="row.cron_spec_description" class="cron-spec-description">{{ row.cron_spec_description }}</span>
                    </div>
                    <span v-else-if="item.prop === 'record_success_rate'">
                        {{ row.record_success_mode === 'sample' ? val : '-' }}
                    </span>
                    <span v-else-if="item.prop === 'record_success_interval_seconds'">
                        {{ row.record_success_mode === 'interval' ? val : '-' }}
                    </span>
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

        <el-drawer v-model="showOperationConfigDrawer" :title="t('system.task.operationConfigTitle')" size="560px" destroy-on-close>
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
                <template v-if="operationConfigTaskKind === 'cron'">
                    <el-form-item :label="t('system.task.cronConfigMode')">
                        <el-select v-model="cronConfigForm.mode">
                            <el-option v-for="item in cronModeOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>
                    <el-form-item v-if="cronConfigForm.mode === 'every_seconds'" :label="t('system.task.cronIntervalSeconds')">
                        <el-input-number v-model="cronConfigForm.secondInterval" :min="1" :max="59" :step="1" controls-position="right" />
                    </el-form-item>
                    <el-form-item v-else-if="cronConfigForm.mode === 'every_minutes'" :label="t('system.task.cronIntervalMinutes')">
                        <el-input-number v-model="cronConfigForm.minuteInterval" :min="1" :max="59" :step="1" controls-position="right" />
                    </el-form-item>
                    <el-form-item v-else-if="cronConfigForm.mode === 'hourly'" :label="t('system.task.cronMinuteOfHour')">
                        <el-input-number v-model="cronConfigForm.minute" :min="0" :max="59" :step="1" controls-position="right" />
                    </el-form-item>
                    <template v-else-if="cronConfigForm.mode === 'daily'">
                        <el-form-item :label="t('system.task.cronExecuteTime')">
                            <el-time-picker v-model="cronConfigForm.time" format="HH:mm" value-format="HH:mm" />
                        </el-form-item>
                    </template>
                    <template v-else-if="cronConfigForm.mode === 'weekly'">
                        <el-form-item :label="t('system.task.cronWeekday')">
                            <el-select v-model="cronConfigForm.weekday">
                                <el-option v-for="item in cronWeekdayOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                        <el-form-item :label="t('system.task.cronExecuteTime')">
                            <el-time-picker v-model="cronConfigForm.time" format="HH:mm" value-format="HH:mm" />
                        </el-form-item>
                    </template>
                    <template v-else-if="cronConfigForm.mode === 'monthly'">
                        <el-form-item :label="t('system.task.cronDayOfMonth')">
                            <el-input-number v-model="cronConfigForm.dayOfMonth" :min="1" :max="31" :step="1" controls-position="right" />
                        </el-form-item>
                        <el-form-item :label="t('system.task.cronExecuteTime')">
                            <el-time-picker v-model="cronConfigForm.time" format="HH:mm" value-format="HH:mm" />
                        </el-form-item>
                    </template>
                    <el-form-item v-else :label="t('system.task.cronAdvancedSpec')">
                        <el-input v-model.trim="cronConfigForm.advancedSpec" :placeholder="t('system.task.cronSpecPlaceholder')" clearable />
                    </el-form-item>
                    <el-form-item :label="t('system.task.cronGeneratedSpec')">
                        <el-input :model-value="generatedCronSpec" readonly />
                        <div class="form-help-text">{{ t('system.task.cronSpecHelp') }}</div>
                        <div v-if="operationConfigCronDescription" class="form-help-text is-strong">{{ operationConfigCronDescription }}</div>
                    </el-form-item>
                </template>
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
                        <el-option v-for="item in recordSuccessModeSelectOptions" :key="item.value" :label="item.label" :value="item.value" />
                    </el-select>
                </el-form-item>
                <el-form-item v-if="shouldShowRecordSuccessRate" :label="t('system.task.recordSuccessRate')">
                    <el-input-number v-model="recordPolicyForm.record_success_rate" :min="0" :max="100" :step="5" controls-position="right" />
                </el-form-item>
                <el-form-item v-if="shouldShowRecordSuccessInterval" :label="t('system.task.recordSuccessIntervalSeconds')">
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
import { computed, onMounted, onActivated, reactive, ref } from 'vue'
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

type CronConfigMode = 'every_seconds' | 'every_minutes' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'advanced'

const { options: commonStatusOptions, tagMap: commonStatusTagMap, load: loadCommonStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.commonStatus, commonStatusFallbackOptions)
const { tagMap: yesNoTagMap, load: loadYesNoOptions } = useDictOptions(SYSTEM_DICT_TYPES.yesNo, yesNoFallbackOptions)
const { options: taskKindOptions, tagMap: taskKindTagMap, load: loadTaskKindOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskKind, taskKindFallbackOptions)
const { tagMap: recordSuccessModeTagMap, load: loadRecordSuccessModeOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskRecordSuccessMode, taskRecordSuccessModeFallbackOptions)

const taskQueryFormRef = ref<FormInstance>()
const taskQuery = reactive(createTaskQuery())
const triggeringTaskCode = ref('')
const showOperationConfigDrawer = ref(false)
const showRecordPolicyDrawer = ref(false)
const savingOperationConfig = ref(false)
const savingRecordPolicy = ref(false)
const currentOperationTask = ref<TaskDefinition | null>(null)
const currentPolicyTask = ref<TaskDefinition | null>(null)
const operationConfigForm = reactive<TaskOperationConfigPayload>(createTaskOperationConfigPayload())
const recordPolicyForm = reactive<TaskRecordPolicyPayload>(createTaskRecordPolicyPayload())
const cronConfigForm = reactive({
    mode: 'daily' as CronConfigMode,
    secondInterval: 5,
    minuteInterval: 5,
    minute: 0,
    time: '04:00',
    weekday: 1,
    dayOfMonth: 1,
    advancedSpec: '',
})

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
const normalizeRecordSuccessMode = (mode: unknown): TaskRecordPolicyPayload['record_success_mode'] => {
    switch (String(mode || '').trim()) {
        case 'sample':
        case 'interval':
        case 'none':
            return String(mode).trim() as TaskRecordPolicyPayload['record_success_mode']
        default:
            return 'all'
    }
}
const recordSuccessModeSelectOptions = computed(() =>
    taskRecordSuccessModeFallbackOptions.map((item) => ({
        ...item,
        label: recordSuccessModeTagMap.value[String(item.value)]?.text || item.label,
    }))
)
const shouldShowRecordSuccessRate = computed(() => normalizeRecordSuccessMode(recordPolicyForm.record_success_mode) === 'sample')
const shouldShowRecordSuccessInterval = computed(() => normalizeRecordSuccessMode(recordPolicyForm.record_success_mode) === 'interval')

const operationConfigTaskKind = computed(() => currentOperationTask.value?.kind || '')
const cronModeOptions = computed(() => [
    { label: t('system.task.cronModeEverySeconds'), value: 'every_seconds' },
    { label: t('system.task.cronModeEveryMinutes'), value: 'every_minutes' },
    { label: t('system.task.cronModeHourly'), value: 'hourly' },
    { label: t('system.task.cronModeDaily'), value: 'daily' },
    { label: t('system.task.cronModeWeekly'), value: 'weekly' },
    { label: t('system.task.cronModeMonthly'), value: 'monthly' },
    { label: t('system.task.cronModeAdvanced'), value: 'advanced' },
])
const cronWeekdayOptions = computed(() => [
    { label: t('system.task.weekdayMonday'), value: 1 },
    { label: t('system.task.weekdayTuesday'), value: 2 },
    { label: t('system.task.weekdayWednesday'), value: 3 },
    { label: t('system.task.weekdayThursday'), value: 4 },
    { label: t('system.task.weekdayFriday'), value: 5 },
    { label: t('system.task.weekdaySaturday'), value: 6 },
    { label: t('system.task.weekdaySunday'), value: 0 },
])
const generatedCronSpec = computed(() => buildCronSpec())
const operationConfigCronDescription = computed(() => {
    if (operationConfigTaskKind.value !== 'cron') return ''
    if (generatedCronSpec.value === currentOperationTask.value?.cron_spec) return currentOperationTask.value?.cron_spec_description || ''
    return describeCronSpecLocally(generatedCronSpec.value)
})

const handleOpenOperationConfig = (row: TaskDefinition) => {
    currentOperationTask.value = row
    Object.assign(operationConfigForm, createTaskOperationConfigPayload(row))
    if (row.kind === 'cron') {
        Object.assign(cronConfigForm, parseCronSpecToConfig(row.cron_spec || ''))
    }
    showOperationConfigDrawer.value = true
}

const handleSaveOperationConfig = async () => {
    try {
        if (operationConfigTaskKind.value === 'cron') {
            operationConfigForm.cron_spec = generatedCronSpec.value
        }
        if (operationConfigTaskKind.value === 'cron' && !String(operationConfigForm.cron_spec || '').trim()) {
            ElMessage.warning(t('system.task.cronSpecRequired'))
            return
        }
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

const normalizeCronNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
    const number = Number(value)
    if (!Number.isFinite(number)) return fallback
    return Math.min(max, Math.max(min, Math.trunc(number)))
}

const parseCronTime = (value: string) => {
    const [hourRaw = '0', minuteRaw = '0'] = String(value || '').split(':')
    return {
        hour: normalizeCronNumber(Number(hourRaw), 0, 23, 0),
        minute: normalizeCronNumber(Number(minuteRaw), 0, 59, 0),
    }
}

const buildCronSpec = () => {
    switch (cronConfigForm.mode) {
        case 'every_seconds':
            return `0/${normalizeCronNumber(cronConfigForm.secondInterval, 1, 59, 5)} * * * * *`
        case 'every_minutes': {
            const interval = normalizeCronNumber(cronConfigForm.minuteInterval, 1, 59, 5)
            return interval === 1 ? '0 * * * * *' : `0 0/${interval} * * * *`
        }
        case 'hourly':
            return `0 ${normalizeCronNumber(cronConfigForm.minute, 0, 59, 0)} * * * *`
        case 'daily': {
            const time = parseCronTime(cronConfigForm.time)
            return `0 ${time.minute} ${time.hour} * * *`
        }
        case 'weekly': {
            const time = parseCronTime(cronConfigForm.time)
            return `0 ${time.minute} ${time.hour} * * ${normalizeCronNumber(cronConfigForm.weekday, 0, 6, 1)}`
        }
        case 'monthly': {
            const time = parseCronTime(cronConfigForm.time)
            return `0 ${time.minute} ${time.hour} ${normalizeCronNumber(cronConfigForm.dayOfMonth, 1, 31, 1)} * *`
        }
        default:
            return String(cronConfigForm.advancedSpec || '').trim()
    }
}

const parseEveryStep = (value?: string) => {
    if (value === '*') return 1
    const parts = String(value || '').split('/')
    if (parts.length !== 2) return null
    if (parts[0] !== '0' && parts[0] !== '*') return null
    const number = Number(parts[1])
    return Number.isFinite(number) && number > 0 ? Math.trunc(number) : null
}

const formatCronTime = (hour?: string, minute?: string) => {
    const normalizedHour = String(normalizeCronNumber(Number(hour), 0, 23, 0)).padStart(2, '0')
    const normalizedMinute = String(normalizeCronNumber(Number(minute), 0, 59, 0)).padStart(2, '0')
    return `${normalizedHour}:${normalizedMinute}`
}

const isCronNumber = (value?: string) => /^\d+$/.test(String(value || ''))

const parseCronSpecToConfig = (spec: string) => {
    const fallback = {
        mode: 'advanced' as CronConfigMode,
        secondInterval: 5,
        minuteInterval: 5,
        minute: 0,
        time: '04:00',
        weekday: 1,
        dayOfMonth: 1,
        advancedSpec: spec,
    }
    const fields = String(spec || '')
        .trim()
        .split(/\s+/)
    if (fields.length !== 6) return fallback
    const [second, minute, hour, dayOfMonth, month, weekday] = fields
    if (month !== '*') return fallback
    const secondStep = parseEveryStep(second)
    if (secondStep && minute === '*' && hour === '*' && dayOfMonth === '*' && weekday === '*') {
        return { ...fallback, mode: 'every_seconds' as CronConfigMode, secondInterval: secondStep, advancedSpec: spec }
    }
    const minuteStep = parseEveryStep(minute)
    if (second === '0' && minuteStep && hour === '*' && dayOfMonth === '*' && weekday === '*') {
        return { ...fallback, mode: 'every_minutes' as CronConfigMode, minuteInterval: minuteStep, advancedSpec: spec }
    }
    if (second === '0' && isCronNumber(minute) && hour === '*' && dayOfMonth === '*' && weekday === '*') {
        return { ...fallback, mode: 'hourly' as CronConfigMode, minute: normalizeCronNumber(Number(minute), 0, 59, 0), advancedSpec: spec }
    }
    if (second === '0' && isCronNumber(minute) && isCronNumber(hour) && dayOfMonth === '*' && weekday === '*') {
        return { ...fallback, mode: 'daily' as CronConfigMode, time: formatCronTime(hour, minute), advancedSpec: spec }
    }
    if (second === '0' && isCronNumber(minute) && isCronNumber(hour) && dayOfMonth === '*' && isCronNumber(weekday)) {
        return { ...fallback, mode: 'weekly' as CronConfigMode, time: formatCronTime(hour, minute), weekday: normalizeCronNumber(Number(weekday), 0, 6, 1), advancedSpec: spec }
    }
    if (second === '0' && isCronNumber(minute) && isCronNumber(hour) && isCronNumber(dayOfMonth) && weekday === '*') {
        return { ...fallback, mode: 'monthly' as CronConfigMode, time: formatCronTime(hour, minute), dayOfMonth: normalizeCronNumber(Number(dayOfMonth), 1, 31, 1), advancedSpec: spec }
    }
    return fallback
}

const describeCronSpecLocally = (spec: string) => {
    const parsed = parseCronSpecToConfig(spec)
    switch (parsed.mode) {
        case 'every_seconds':
            return t('system.task.cronDescriptionEverySeconds', { count: parsed.secondInterval })
        case 'every_minutes':
            if (parsed.minuteInterval === 1) return t('system.task.cronDescriptionEveryMinute')
            return t('system.task.cronDescriptionEveryMinutes', { count: parsed.minuteInterval })
        case 'hourly':
            return t('system.task.cronDescriptionHourly', { minute: parsed.minute })
        case 'daily':
            return t('system.task.cronDescriptionDaily', { time: parsed.time })
        case 'weekly':
            return t('system.task.cronDescriptionWeekly', { weekday: cronWeekdayOptions.value.find((item) => item.value === parsed.weekday)?.label || parsed.weekday, time: parsed.time })
        case 'monthly':
            return t('system.task.cronDescriptionMonthly', { day: parsed.dayOfMonth, time: parsed.time })
        default:
            return spec ? t('system.task.cronDescriptionCustom') : ''
    }
}

const handleOpenRecordPolicy = (row: TaskDefinition) => {
    currentPolicyTask.value = row
    Object.assign(recordPolicyForm, createTaskRecordPolicyPayload(row))
    recordPolicyForm.record_success_mode = normalizeRecordSuccessMode(recordPolicyForm.record_success_mode)
    recordPolicyForm.record_detail_on_failure = 1
    showRecordPolicyDrawer.value = true
}

const handleSaveRecordPolicy = async () => {
    try {
        savingRecordPolicy.value = true
        const payload = normalizeRecordPolicyPayload()
        Object.assign(recordPolicyForm, payload)
        await modifyTaskRecordPolicy(payload)
        ElMessage.success(t('common.result.operationSuccess'))
        showRecordPolicyDrawer.value = false
        await getTaskList()
    } catch (error) {
        Logger.error('更新任务记录策略失败:', error)
    } finally {
        savingRecordPolicy.value = false
    }
}

const normalizeRecordPolicyNumber = (value: number | undefined, min: number, max: number, fallback: number) => {
    const number = Number(value)
    if (!Number.isFinite(number)) return fallback
    return Math.min(max, Math.max(min, Math.trunc(number)))
}

const normalizeRecordPolicyPayload = (): TaskRecordPolicyPayload => {
    const payload: TaskRecordPolicyPayload = {
        ...recordPolicyForm,
        record_success_mode: normalizeRecordSuccessMode(recordPolicyForm.record_success_mode),
        record_detail_on_failure: 1,
    }
    switch (payload.record_success_mode) {
        case 'sample':
            payload.record_success_rate = normalizeRecordPolicyNumber(payload.record_success_rate, 0, 100, 100)
            payload.record_success_interval_seconds = 0
            break
        case 'interval':
            payload.record_success_rate = 0
            payload.record_success_interval_seconds = normalizeRecordPolicyNumber(payload.record_success_interval_seconds, 0, Number.MAX_SAFE_INTEGER, 0)
            break
        case 'none':
            payload.record_success_rate = 0
            payload.record_success_interval_seconds = 0
            break
        default:
            payload.record_success_rate = 100
            payload.record_success_interval_seconds = 0
            break
    }
    return payload
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
            { prop: 'cron_spec', h_label: t('system.task.cronSpec'), minWidth: 180, customRow: true },
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

onActivated(() => {
    void getTaskList()
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

.cron-spec-cell {
    display: flex;
    flex-direction: column;
    gap: 2px;
    line-height: 1.35;
}

.cron-spec-value {
    font-family: var(--xl-font-family-mono, monospace);
}

.cron-spec-description,
.form-help-text {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.form-help-text {
    margin-top: 6px;
    line-height: 1.4;
}

.form-help-text.is-strong {
    color: var(--el-color-primary);
}
</style>
