<template>
    <div class="todo-page">
        <el-alert v-if="failed || summaryFailed || groupsFailed" class="load-error" :title="groupsFailed ? t('todo.group.loadFailed') : t('todo.loadFailed')" type="error" :closable="false" show-icon>
            <template #default>
                <el-button link type="primary" @click="reloadPage">{{ t('todo.retry') }}</el-button>
            </template>
        </el-alert>

        <!-- 顶部 4 维指标看板 -->
        <div class="todo-metrics-grid xl-m-bottom-16">
            <div
                v-for="card in metricCards"
                :key="card.key"
                class="todo-metric-card"
                :class="[`is-${card.tone}`, { 'is-active': activeMetricKey === card.key }]"
                role="button"
                tabindex="0"
                @click="toggleMetricFilter(card.key)"
                @keydown.enter="toggleMetricFilter(card.key)"
            >
                <div class="todo-metric-card__icon">
                    <el-icon :size="20"><component :is="card.icon" /></el-icon>
                </div>
                <div class="todo-metric-card__content">
                    <span class="todo-metric-card__label">{{ card.label }}</span>
                    <div class="todo-metric-card__value-wrap">
                        <strong class="todo-metric-card__value">{{ card.value }}</strong>
                        <span class="todo-metric-card__unit">{{ t('todo.countUnit') }}</span>
                    </div>
                </div>
                <div v-if="activeMetricKey === card.key" class="todo-metric-card__badge">
                    {{ t('todo.filtering') }}
                </div>
            </div>
        </div>

        <div class="todo-group-bar xl-m-bottom-16">
            <div class="todo-group-bar__list">
                <el-button size="small" :type="queryWhere.group_id === '' ? 'primary' : 'default'" @click="selectGroup('')">{{ t('todo.group.all') }}</el-button>
                <el-button size="small" :type="queryWhere.group_id === 0 ? 'primary' : 'default'" @click="selectGroup(0)">{{ t('todo.group.ungrouped') }}</el-button>
                <el-button
                    v-for="group in groups"
                    :key="group.id"
                    size="small"
                    :type="queryWhere.group_id === group.id ? 'primary' : 'default'"
                    @click="selectGroup(group.id)"
                >{{ group.name }}</el-button>
            </div>
            <div class="todo-group-bar__actions">
                <el-button link type="primary" @click="createGroup">{{ t('todo.group.create') }}</el-button>
                <template v-if="selectedGroup">
                    <el-button link @click="renameGroup">{{ t('todo.group.rename') }}</el-button>
                    <el-button link type="danger" @click="deleteGroup">{{ t('todo.group.delete') }}</el-button>
                </template>
            </div>
        </div>

        <!-- 标准化 ProTable -->
        <xl-pro-table
            :search-model="queryWhere"
            :columns="columns"
            :search-schema="searchSchema"
            :loading="loading"
            :data="items"
            :pagination="pagination"
            row-key="id"
            @search="onSearch"
            @reset="handleReset"
            @sort-change="handleSortChange"
        >
            <template #actions>
                <el-button type="primary" @click="openCreate">
                    <el-icon class="el-icon--left"><i-ep-plus /></el-icon>
                    <span>{{ t('todo.add') }}</span>
                </el-button>
                <el-button @click="reminderDialogVisible = true">
                    <el-icon class="el-icon--left"><i-ep-bell /></el-icon>
                    <span>{{ t('todo.reminder.entry') }}</span>
                </el-button>
            </template>

            <template #td="{ item, val, row }">
                <!-- 待办标题（含紧迫度与超时标签） -->
                <div v-if="item.prop === 'title'" class="todo-title-cell">
                    <span class="todo-title-text" :title="row.title">{{ row.title }}</span>
                    <el-tag v-if="isTodoOverdue(row)" size="small" type="danger" effect="light">
                        {{ t('todo.overdue') }}
                    </el-tag>
                    <el-tag v-else-if="getDueHint(row)" size="small" type="warning" effect="light">
                        {{ getDueHint(row) }}
                    </el-tag>
                </div>

                <!-- 优先级标准 Tag -->
                <div v-else-if="item.prop === 'priority'" class="todo-priority-cell">
                    <el-tag v-if="isTodoPriority(row.priority)" size="small" :type="getPriorityTagType(row.priority)">
                        {{ t(`todo.priorities.${row.priority}`) }}
                    </el-tag>
                    <span v-else>-</span>
                </div>

                <!-- 状态标准 Tag（可快捷切换） -->
                <div v-else-if="item.prop === 'status'" class="todo-status-cell">
                    <el-dropdown
                        v-if="isTodoStatus(row.status) && (row.can_update_status ?? isManualTodo(row)) && row.status !== 'completed' && row.status !== 'canceled'"
                        trigger="click"
                        @command="(val: TodoStatus) => changeStatus(row, val)"
                    >
                        <el-tag size="small" class="xl-cursor-pointer" :type="getStatusTagType(row.status)">
                            {{ t(`todo.statuses.${row.status}`) }}
                            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                        </el-tag>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item
                                    v-for="st in statuses"
                                    :key="st"
                                    :command="st"
                                    :disabled="st === row.status"
                                >
                                    <el-tag size="small" :type="getStatusTagType(st)">
                                        {{ t(`todo.statuses.${st}`) }}
                                    </el-tag>
                                </el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                    <el-tag v-else-if="isTodoStatus(row.status)" size="small" :type="getStatusTagType(row.status)">
                        {{ t(`todo.statuses.${row.status}`) }}
                    </el-tag>
                    <span v-else>-</span>
                </div>

                <!-- 来源 -->
                <span v-else-if="item.prop === 'source'" class="todo-source-badge">
                    {{ isManualTodo(row) ? t('todo.manual') : row.source_type || t('todo.business') }}
                </span>

                <span v-else-if="item.prop === 'group_id'">{{ groupName(row.group_id) }}</span>

                <!-- 其他字段兜底 -->
                <span v-else>{{ val }}</span>
            </template>

            <template #operation>
                <el-table-column width="200" :label="t('common.labels.operation')" align="center" fixed="right">
                    <template #default="scope">
                        <xl-action-buttons :buttons="todoActionButtons" :scope="scope" :max-visible-buttons="3" />
                    </template>
                </el-table-column>
            </template>
            <template #empty>
                <div class="todo-empty-state">
                    <el-empty :image-size="90" :description="t('todo.empty')">
                        <template #default>
                            <el-button
                                v-if="queryWhere.keyword || queryWhere.status || queryWhere.group_id !== '' || (queryWhere.due_scope && queryWhere.due_scope !== 'all')"
                                type="primary"
                                plain
                                size="small"
                                @click="handleReset"
                            >
                                {{ t('common.actions.reset') }}
                            </el-button>
                        </template>
                    </el-empty>
                </div>
            </template>
        </xl-pro-table>

        <!-- 标准化表单抽屉 -->
        <xl-drawer
            v-model="drawerVisible"
            :title="editingId !== null ? t('todo.edit') : t('todo.add')"
            :formRef="formRef"
            :onConfirm="save"
            :isSubmitting="saving"
            :withReset="false"
            size="md"
        >
            <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
                <el-form-item :label="t('todo.title')" prop="title">
                    <el-input v-model.trim="form.title" maxlength="120" show-word-limit :placeholder="t('todo.title')" />
                </el-form-item>
                <el-form-item :label="t('todo.description')">
                    <el-input v-model="form.description" type="textarea" :rows="4" maxlength="1000" show-word-limit :placeholder="t('common.labels.description')" />
                </el-form-item>
                <el-form-item :label="t('todo.group.label')">
                    <el-select v-model="form.group_id">
                        <el-option :label="t('todo.group.ungrouped')" :value="0" />
                        <el-option v-for="group in groups" :key="group.id" :label="group.name" :value="group.id" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('todo.priority')" prop="priority">
                    <el-select v-model="form.priority">
                        <el-option v-for="priority in priorities" :key="priority" :label="t(`todo.priorities.${priority}`)" :value="priority">
                            <span class="priority-pill" :class="`priority-${priority}`">
                                <span class="priority-indicator"></span>
                                {{ t(`todo.priorities.${priority}`) }}
                            </span>
                        </el-option>
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('todo.dueAt')">
                    <el-date-picker v-model="form.due_at" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" clearable />
                </el-form-item>
            </el-form>
        </xl-drawer>

        <el-dialog v-model="moveDialogVisible" :title="t('todo.group.move')" width="420px">
            <el-select v-model="moveGroupID" class="move-group-select">
                <el-option :label="t('todo.group.ungrouped')" :value="0" />
                <el-option v-for="group in groups" :key="group.id" :label="group.name" :value="group.id" />
            </el-select>
            <template #footer>
                <el-button @click="moveDialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
                <el-button type="primary" :loading="moving" @click="saveMoveGroup">{{ t('common.actions.confirm') }}</el-button>
            </template>
        </el-dialog>

        <!-- 待办提醒偏好弹窗 -->
        <TodoReminderPreferenceDialog v-model="reminderDialogVisible" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { ArrowDown, Calendar, Clock, Timer, Warning } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import xlProTable from '@/components/proTable/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButtons, { type ActionButtonConfig } from '@/components/actionButtons/index.vue'
import { useListPage } from '@/composables/useListPage'
import {
    fetchTodoListWithSummary,
    fetchTodoGroups,
    isManualTodo,
    isTodoOverdue,
    isTodoPriority,
    isTodoStatus,
    submitTodoCreate,
    submitTodoDelete,
    submitTodoGroupCreate,
    submitTodoGroupDelete,
    submitTodoGroupMove,
    submitTodoGroupRename,
    submitTodoStatus,
    submitTodoUpdate,
} from '@/modules/todo/service'
import { normalizeInternalActionUrl } from '@/utils/notificationAction'
import { Logger } from '@/utils/logger'
import TodoReminderPreferenceDialog from './components/TodoReminderPreferenceDialog.vue'
import type { TodoDueScope, TodoGroup, TodoItem, TodoPriority, TodoStatus, TodoSummary, TodoWritePayload } from '@/types/todo'
import type { ProTableColumns, ProTableSearchSchema } from '@/components/proTable/types'

const { t } = useI18n()
const router = useRouter()
const priorities: TodoPriority[] = ['low', 'normal', 'high', 'urgent']
const statuses: TodoStatus[] = ['pending', 'processing', 'completed', 'canceled']
const dueScopes: TodoDueScope[] = ['all', 'overdue', 'today', 'upcoming', 'no_due']

const failed = ref(false)
const summaryFailed = ref(false)
const groupsFailed = ref(false)
const groups = ref<TodoGroup[]>([])
const saving = ref(false)
const summary = ref<TodoSummary>({ total: 0, pending: 0, processing: 0, completed: 0, canceled: 0, overdue: 0, due_today: 0 })
const drawerVisible = ref(false)
const reminderDialogVisible = ref(false)
const editingId = ref<number | string | null>(null)
const formRef = ref<FormInstance>()
const form = reactive<TodoWritePayload>({ title: '', description: '', priority: 'normal', due_at: '', group_id: 0 })
const moveDialogVisible = ref(false)
const moving = ref(false)
const movingTodoID = ref<number | string | null>(null)
const moveGroupID = ref(0)

const activeMetricKey = ref<string>('')
const selectedGroup = computed(() => groups.value.find((group) => group.id === queryWhere.group_id))
const groupName = (id?: number) => groups.value.find((group) => group.id === id)?.name || t('todo.group.ungrouped')

const rules = computed<FormRules>(() => ({
    title: [{ required: true, message: t('todo.validation.title'), trigger: 'blur' }],
    priority: [{ required: true, message: t('todo.validation.priority'), trigger: 'change' }],
}))

const metricCards = computed(() => [
    {
        key: 'pending',
        label: t('todo.summary.pending'),
        value: failed.value || summaryFailed.value ? '-' : summary.value.pending,
        icon: Clock,
        tone: 'primary',
    },
    {
        key: 'processing',
        label: t('todo.summary.processing'),
        value: failed.value || summaryFailed.value ? '-' : summary.value.processing,
        icon: Timer,
        tone: 'warning',
    },
    {
        key: 'overdue',
        label: t('todo.summary.overdue'),
        value: failed.value || summaryFailed.value ? '-' : summary.value.overdue,
        icon: Warning,
        tone: 'danger',
    },
    {
        key: 'dueToday',
        label: t('todo.summary.dueToday'),
        value: failed.value || summaryFailed.value ? '-' : summary.value.due_today,
        icon: Calendar,
        tone: 'success',
    },
])

const toggleMetricFilter = async (key: string) => {
    if (activeMetricKey.value === key) {
        activeMetricKey.value = ''
        queryWhere.status = ''
        queryWhere.due_scope = 'all'
    } else {
        activeMetricKey.value = key
        if (key === 'pending' || key === 'processing') {
            queryWhere.status = key
            queryWhere.due_scope = 'all'
        } else if (key === 'overdue') {
            queryWhere.status = ''
            queryWhere.due_scope = 'overdue'
        } else if (key === 'dueToday') {
            queryWhere.status = ''
            queryWhere.due_scope = 'today'
        }
    }
    await handleSearch()
}

const getPriorityTagType = (priority: TodoPriority): '' | 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (priority) {
        case 'urgent': return 'danger'
        case 'high': return 'warning'
        case 'normal': return 'primary'
        case 'low': return 'info'
        default: return 'info'
    }
}

const getStatusTagType = (status: TodoStatus): '' | 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
        case 'pending': return 'info'
        case 'processing': return 'warning'
        case 'completed': return 'success'
        case 'canceled': return 'info'
        default: return 'info'
    }
}

const defaultQuery = {
    keyword: '',
    status: '' as TodoStatus | '',
    due_scope: 'all' as TodoDueScope,
    group_id: '' as number | '',
}

const queryWhere = reactive({
    ...defaultQuery,
    page: 1,
    per_page: 10,
})

const {
    loading,
    items,
    pagination,
    getList,
    handleSearch,
    handleSortChange,
    handleReset: resetList,
} = useListPage<TodoItem, typeof queryWhere>({
    query: queryWhere,
    sortFields: ['due_at'],
    defaultQuery,
    fetcher: async (params) => {
        const queryParams = {
            ...params,
            keyword: params.keyword.trim() || undefined,
            status: params.status || undefined,
            due_scope: params.due_scope === 'all' || !params.due_scope ? undefined : params.due_scope,
            group_id: params.group_id === '' ? undefined : params.group_id,
        }
        return fetchTodoListWithSummary(queryParams)
    },
    onSuccess: (result) => {
        const currentSummary = (result as { summary?: TodoSummary | null }).summary
        summaryFailed.value = !currentSummary
        if (currentSummary) summary.value = currentSummary
        failed.value = false
    },
    onError: () => {
        failed.value = true
    },
})

const getDueHint = (row: TodoItem) => {
    if (row.status === 'completed' || row.status === 'canceled') return ''
    if (!row.due_at) return ''
    const dueTime = new Date(row.due_at).getTime()
    if (Number.isNaN(dueTime)) return ''
    const diffDays = Math.ceil((dueTime - Date.now()) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return t('todo.summary.dueToday')
    if (diffDays === 1) return t('todo.dueTomorrow')
    if (diffDays > 1 && diffDays <= 3) return t('todo.dueInDays', { days: diffDays })
    return ''
}

const columns = computed<ProTableColumns<TodoItem>>(() => [
    { prop: 'title', label: t('todo.title'), h_label: t('todo.title'), minWidth: 260, customRow: true },
    { prop: 'priority', label: t('todo.priority'), h_label: t('todo.priority'), width: 110, align: 'center', customRow: true },
    { prop: 'status', label: t('todo.status'), h_label: t('todo.status'), width: 140, align: 'center', customRow: true },
    { prop: 'source', label: t('todo.source'), h_label: t('todo.source'), width: 110, align: 'center', customRow: true },
    { prop: 'group_id', label: t('todo.group.label'), h_label: t('todo.group.label'), minWidth: 120, customRow: true },
    { prop: 'due_at', sortable: 'custom', label: t('todo.dueAt'), h_label: t('todo.dueAt'), width: 180, align: 'center' },
])

const searchSchema = computed<ProTableSearchSchema>(() => [
    {
        prop: 'keyword',
        label: t('todo.keyword'),
        type: 'input',
        placeholder: t('todo.keywordPlaceholder'),
        span: 6,
    },
    {
        prop: 'status',
        label: t('todo.status'),
        type: 'select',
        placeholder: t('todo.status'),
        options: [
            { label: t('todo.summary.all'), value: '' },
            ...statuses.map((st) => ({
                label: t(`todo.statuses.${st}`),
                value: st,
            })),
        ],
        span: 6,
    },
    {
        prop: 'due_scope',
        label: t('todo.dueScope'),
        type: 'select',
        placeholder: t('todo.dueScope'),
        options: dueScopes.map((scope) => ({
            label: t(`todo.dueScopes.${scope}`),
            value: scope,
        })),
        span: 6,
    },
])

const onSearch = async (model: Record<string, unknown>) => {
    Object.assign(queryWhere, model)
    if (queryWhere.due_scope === 'overdue') {
        activeMetricKey.value = 'overdue'
    } else if (queryWhere.due_scope === 'today') {
        activeMetricKey.value = 'dueToday'
    } else if (queryWhere.status === 'pending') {
        activeMetricKey.value = 'pending'
    } else if (queryWhere.status === 'processing') {
        activeMetricKey.value = 'processing'
    } else {
        activeMetricKey.value = ''
    }
    await handleSearch()
}

const handleReset = async () => {
    activeMetricKey.value = ''
    await resetList()
}

const loadGroups = async () => {
    try {
        groups.value = await fetchTodoGroups()
        groupsFailed.value = false
    } catch (error) {
        groupsFailed.value = true
        Logger.error('获取待办分组失败:', error)
    }
}

const reloadPage = async () => {
    await Promise.all([getList(), loadGroups()])
}

const selectGroup = async (id: number | '') => {
    queryWhere.group_id = id
    await handleSearch()
}

const validateGroupName = (value: string) => {
    const length = Array.from(value.trim()).length
    return length >= 1 && length <= 40 ? true : t('todo.group.invalidName')
}

const createGroup = async () => {
    const result = await ElMessageBox.prompt(t('todo.group.namePrompt'), t('todo.group.create'), {
        inputValidator: validateGroupName,
    }).catch(() => null)
    if (!result) return
    const created = await submitTodoGroupCreate(result.value)
    groups.value = [...groups.value, created]
    await selectGroup(created.id)
}

const renameGroup = async () => {
    const group = selectedGroup.value
    if (!group) return
    const result = await ElMessageBox.prompt(t('todo.group.namePrompt'), t('todo.group.rename'), {
        inputValue: group.name,
        inputValidator: validateGroupName,
    }).catch(() => null)
    if (!result) return
    const updated = await submitTodoGroupRename(group.id, result.value)
    groups.value = groups.value.map((item) => item.id === updated.id ? updated : item)
    ElMessage.success(t('todo.group.saved'))
}

const deleteGroup = async () => {
    const group = selectedGroup.value
    if (!group) return
    const confirmed = await ElMessageBox.confirm(t('todo.group.deleteConfirm'), group.name, { type: 'warning' }).then(() => true).catch(() => false)
    if (!confirmed) return
    await submitTodoGroupDelete(group.id)
    groups.value = groups.value.filter((item) => item.id !== group.id)
    await selectGroup('')
}

const resetForm = () => {
    Object.assign(form, { title: '', description: '', priority: 'normal', due_at: '', group_id: typeof queryWhere.group_id === 'number' ? queryWhere.group_id : 0 })
}

const openCreate = () => {
    editingId.value = null
    resetForm()
    drawerVisible.value = true
}

const openEdit = (item: TodoItem) => {
    if (!isManualTodo(item)) return
    editingId.value = item.id
    Object.assign(form, {
        title: item.title,
        description: item.description || '',
        priority: item.priority,
        due_at: item.due_at || '',
        group_id: item.group_id || 0,
    })
    drawerVisible.value = true
}

const save = async () => {
    if (!(await formRef.value?.validate().catch(() => false))) return
    saving.value = true
    try {
        if (editingId.value !== null) {
            await submitTodoUpdate({ ...form, id: editingId.value })
        } else {
            await submitTodoCreate({ ...form })
        }
        ElMessage.success(t('todo.saveSuccess'))
        drawerVisible.value = false
        await getList()
    } finally {
        saving.value = false
    }
}

const changeStatus = async (item: TodoItem, status: TodoStatus) => {
    if (!(item.can_update_status ?? isManualTodo(item))) return
    if (status === item.status) return
    await submitTodoStatus(item.id, status)
    ElMessage.success(t('todo.statusSuccess'))
    await getList()
}

const openMoveGroup = (item: TodoItem) => {
    movingTodoID.value = item.id
    moveGroupID.value = item.group_id || 0
    moveDialogVisible.value = true
}

const saveMoveGroup = async () => {
    if (movingTodoID.value === null || moving.value) return
    moving.value = true
    try {
        await submitTodoGroupMove(movingTodoID.value, moveGroupID.value)
        moveDialogVisible.value = false
        ElMessage.success(t('todo.group.saved'))
        await getList()
    } finally {
        moving.value = false
    }
}

const remove = async (item: TodoItem) => {
    if (!isManualTodo(item)) return
    try {
        await ElMessageBox.confirm(t('todo.deleteConfirm'), t('common.confirm.title'), { type: 'warning' })
    } catch {
        return
    }
    await submitTodoDelete(item.id)
    ElMessage.success(t('todo.deleteSuccess'))
    await getList()
}

const todoActionTarget = (item: TodoItem) => normalizeInternalActionUrl(item.action_url)
const openAction = (item: TodoItem) => {
    const target = todoActionTarget(item)
    if (target) router.push(target)
}

const todoActionButtons = computed<ActionButtonConfig<TodoItem>[]>(() => [
    {
        permission: null,
        text: t('todo.group.move'),
        showIcon: false,
        click: openMoveGroup,
    },
    {
        permission: null,
        text: t('todo.action'),
        showIcon: false,
        visible: (row) => Boolean(todoActionTarget(row)),
        click: openAction,
    },
    {
        permission: null,
        text: t('common.actions.edit'),
        showIcon: false,
        visible: (row) => row.can_edit ?? isManualTodo(row),
        click: openEdit,
    },
    {
        permission: null,
        text: t('common.actions.delete'),
        showIcon: false,
        type: 'danger',
        visible: (row) => row.can_delete ?? isManualTodo(row),
        click: remove,
    },
])

onMounted(reloadPage)
</script>

<style scoped lang="scss">
.todo-page {
    width: 100%;
}

.load-error {
    margin-bottom: var(--xl-space-3);
}

.todo-group-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--xl-space-3);
    padding: 10px 12px;
    background: var(--el-bg-color-overlay);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--xl-radius-md, 8px);
}

.todo-group-bar__list {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    overflow-x: auto;
    white-space: nowrap;

    > .el-button + .el-button {
        margin-left: 0;
    }
}

.todo-group-bar__actions {
    display: flex;
    flex-shrink: 0;
    white-space: nowrap;
}

.move-group-select {
    width: 100%;
}

/* 顶部 4 维指标看板 */
.todo-metrics-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
}

.todo-metric-card {
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

.todo-metric-card__icon {
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

.todo-metric-card__content {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
    flex: 1;
}

.todo-metric-card__label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
}

.todo-metric-card__value-wrap {
    display: flex;
    align-items: baseline;
    gap: 4px;
}

.todo-metric-card__value {
    font-size: 22px;
    font-weight: 700;
    line-height: 1.2;
    color: var(--el-text-color-primary);
    font-variant-numeric: tabular-nums;
}

.todo-metric-card__unit {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
}

.todo-metric-card__badge {
    position: absolute;
    top: 8px;
    right: 10px;
    padding: 1px 6px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    background: var(--el-color-primary);
    color: var(--el-color-white);
}

/* 待办标题单元格 */
.todo-title-cell {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;

    .todo-title-text {
        font-weight: 600;
        color: var(--el-text-color-primary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
}

/* 优先级与状态单元格 */
.todo-priority-cell,
.todo-status-cell {
    display: flex;
    justify-content: center;
    align-items: center;
}

.todo-source-badge {
    color: var(--el-text-color-secondary);
    font-size: 12px;
}

.todo-empty-state {
    padding: 28px 0;
    display: flex;
    justify-content: center;
    align-items: center;
}

@media (max-width: 960px) {
    .todo-metrics-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (max-width: 600px) {
    .todo-group-bar {
        align-items: stretch;
        flex-direction: column;
    }

    .todo-metrics-grid {
        grid-template-columns: 1fr;
    }
}
</style>
