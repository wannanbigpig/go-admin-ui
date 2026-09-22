<template>
    <div class="todo-page">
        <el-card shadow="never">
            <template #header>
                <div class="page-header">
                    <div>
                        <h2>{{ t('todo.title') }}</h2>
                        <p>{{ t('todo.subtitle') }}</p>
                    </div>
                    <div class="page-actions">
                        <el-button @click="reminderDialogVisible = true">{{ t('todo.reminder.entry') }}</el-button>
                        <el-button type="primary" @click="openCreate">{{ t('todo.add') }}</el-button>
                    </div>
                </div>
            </template>

            <div class="summary-grid">
                <div v-for="item in summaryItems" :key="item.key" class="summary-item">
                    <span>{{ item.label }}</span>
                    <strong>{{ item.value }}</strong>
                </div>
            </div>

            <el-alert v-if="failed" class="load-error" :title="t('todo.loadFailed')" type="error" :closable="false" show-icon>
                <template #default><el-button link type="primary" @click="load">{{ t('todo.retry') }}</el-button></template>
            </el-alert>

            <el-form :inline="true" :model="query" class="filter-form" @submit.prevent="search">
                <el-form-item :label="t('todo.keyword')">
                    <el-input v-model.trim="query.keyword" clearable :placeholder="t('todo.keywordPlaceholder')" @keyup.enter="search" />
                </el-form-item>
                <el-form-item :label="t('todo.status')">
                    <el-select v-model="query.status" clearable>
                        <el-option v-for="status in statuses" :key="status" :label="t(`todo.statuses.${status}`)" :value="status" />
                    </el-select>
                </el-form-item>
                <el-form-item :label="t('todo.dueScope')">
                    <el-select v-model="query.due_scope">
                        <el-option v-for="scope in dueScopes" :key="scope" :label="t(`todo.dueScopes.${scope}`)" :value="scope" />
                    </el-select>
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" :loading="loading" @click="search">{{ t('common.actions.search') }}</el-button>
                    <el-button @click="reset">{{ t('common.actions.reset') }}</el-button>
                </el-form-item>
            </el-form>

            <el-table v-loading="loading" :data="items" row-key="id">
                <el-table-column prop="title" :label="t('todo.title')" min-width="220">
                    <template #default="{ row }">
                        <div class="todo-title-cell">
                            <span>{{ row.title }}</span>
                            <el-tag v-if="isTodoOverdue(row)" size="small" type="danger">{{ t('todo.overdue') }}</el-tag>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column prop="priority" :label="t('todo.priority')" width="100" align="center">
                    <template #default="{ row }"><el-tag :type="priorityTag(row.priority)">{{ t(`todo.priorities.${row.priority}`) }}</el-tag></template>
                </el-table-column>
                <el-table-column prop="status" :label="t('todo.status')" width="150" align="center">
                    <template #default="{ row }">
                        <el-select :model-value="row.status" size="small" :disabled="!(row.can_update_status ?? isManualTodo(row)) || row.status === 'completed' || row.status === 'canceled'" @change="changeStatus(row, $event)">
                            <el-option v-for="status in statuses" :key="status" :label="t(`todo.statuses.${status}`)" :value="status" />
                        </el-select>
                    </template>
                </el-table-column>
                <el-table-column prop="source" :label="t('todo.source')" width="120" align="center">
                    <template #default="{ row }">{{ isManualTodo(row) ? t('todo.manual') : row.source_type || t('todo.business') }}</template>
                </el-table-column>
                <el-table-column prop="due_at" :label="t('todo.dueAt')" width="180" />
                <el-table-column :label="t('common.labels.operation')" width="210" fixed="right" align="center">
                    <template #default="{ row }">
                        <el-button v-if="todoActionTarget(row)" link type="primary" @click="openAction(row)">{{ t('todo.action') }}</el-button>
                        <el-button v-if="row.can_edit ?? isManualTodo(row)" link type="primary" @click="openEdit(row)">{{ t('common.actions.edit') }}</el-button>
                        <el-button v-if="row.can_delete ?? isManualTodo(row)" link type="danger" @click="remove(row)">{{ t('common.actions.delete') }}</el-button>
                    </template>
                </el-table-column>
            </el-table>

            <div class="pagination-wrap">
                <el-pagination v-model:current-page="query.page" v-model:page-size="query.per_page" background layout="total, sizes, prev, pager, next" :total="total" @change="load" />
            </div>
        </el-card>

        <el-dialog v-model="dialogVisible" :title="editingId ? t('todo.edit') : t('todo.add')" width="560px" destroy-on-close>
            <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
                <el-form-item :label="t('todo.title')" prop="title"><el-input v-model.trim="form.title" maxlength="120" show-word-limit /></el-form-item>
                <el-form-item :label="t('todo.description')"><el-input v-model="form.description" type="textarea" :rows="4" maxlength="1000" show-word-limit /></el-form-item>
                <el-form-item :label="t('todo.priority')" prop="priority">
                    <el-select v-model="form.priority"><el-option v-for="priority in priorities" :key="priority" :label="t(`todo.priorities.${priority}`)" :value="priority" /></el-select>
                </el-form-item>
                <el-form-item :label="t('todo.dueAt')"><el-date-picker v-model="form.due_at" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" clearable /></el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">{{ t('common.actions.cancel') }}</el-button>
                <el-button type="primary" :loading="saving" @click="save">{{ t('common.actions.confirm') }}</el-button>
            </template>
        </el-dialog>

        <TodoReminderPreferenceDialog v-model="reminderDialogVisible" />
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { fetchTodoList, fetchTodoSummary, isManualTodo, isTodoOverdue, submitTodoCreate, submitTodoDelete, submitTodoStatus, submitTodoUpdate } from '@/modules/todo/service'
import { normalizeInternalActionUrl } from '@/utils/notificationAction'
import { Logger } from '@/utils/logger'
import TodoReminderPreferenceDialog from './components/TodoReminderPreferenceDialog.vue'
import type { TodoDueScope, TodoItem, TodoPriority, TodoStatus, TodoSummary, TodoWritePayload } from '@/types/todo'

const { t } = useI18n()
const router = useRouter()
const priorities: TodoPriority[] = ['low', 'normal', 'high', 'urgent']
const statuses: TodoStatus[] = ['pending', 'processing', 'completed', 'canceled']
const dueScopes: TodoDueScope[] = ['all', 'overdue', 'today', 'upcoming', 'no_due']
const loading = ref(false)
const failed = ref(false)
const saving = ref(false)
const items = ref<TodoItem[]>([])
const total = ref(0)
const summary = ref<TodoSummary>({ pending: 0, processing: 0, overdue: 0, due_today: 0 })
const query = reactive({ page: 1, per_page: 10, keyword: '', status: '' as TodoStatus | '', due_scope: 'all' as TodoDueScope })
const dialogVisible = ref(false)
const reminderDialogVisible = ref(false)
const editingId = ref<number | string | null>(null)
const formRef = ref<FormInstance>()
const form = reactive<TodoWritePayload>({ title: '', description: '', priority: 'normal', due_at: '' })
const rules = computed<FormRules>(() => ({
    title: [{ required: true, message: t('todo.validation.title'), trigger: 'blur' }],
    priority: [{ required: true, message: t('todo.validation.priority'), trigger: 'change' }],
}))
const summaryItems = computed(() => [
    { key: 'pending', label: t('todo.summary.pending'), value: failed.value ? '-' : summary.value.pending },
    { key: 'processing', label: t('todo.summary.processing'), value: failed.value ? '-' : summary.value.processing },
    { key: 'overdue', label: t('todo.summary.overdue'), value: failed.value ? '-' : summary.value.overdue },
    { key: 'dueToday', label: t('todo.summary.dueToday'), value: failed.value ? '-' : summary.value.due_today },
])

const load = async () => {
    loading.value = true
    try {
        const [list, summaryResult] = await Promise.all([
            fetchTodoList({ ...query, status: query.status || undefined, due_scope: query.due_scope === 'all' ? undefined : query.due_scope }),
            fetchTodoSummary(),
        ])
        items.value = list.list
        total.value = list.total
        summary.value = summaryResult
        failed.value = false
    } catch (error) {
        Logger.error('获取待办失败:', error)
        items.value = []
        total.value = 0
        failed.value = true
    } finally {
        loading.value = false
    }
}
const search = () => { query.page = 1; return load() }
const reset = () => { Object.assign(query, { page: 1, per_page: 10, keyword: '', status: '', due_scope: 'all' }); return load() }
const resetForm = () => Object.assign(form, { title: '', description: '', priority: 'normal', due_at: '' })
const openCreate = () => { editingId.value = null; resetForm(); dialogVisible.value = true }
const openEdit = (item: TodoItem) => {
    if (!isManualTodo(item)) return
    editingId.value = item.id
    Object.assign(form, { title: item.title, description: item.description || '', priority: item.priority, due_at: item.due_at || '' })
    dialogVisible.value = true
}
const save = async () => {
    if (!(await formRef.value?.validate().catch(() => false))) return
    saving.value = true
    try {
        if (editingId.value !== null) await submitTodoUpdate({ ...form, id: editingId.value })
        else await submitTodoCreate({ ...form })
        ElMessage.success(t('todo.saveSuccess'))
        dialogVisible.value = false
        await load()
    } finally { saving.value = false }
}
const changeStatus = async (item: TodoItem, status: TodoStatus) => {
    if (!(item.can_update_status ?? isManualTodo(item))) return
    if (status === item.status) return
    await submitTodoStatus(item.id, status)
    ElMessage.success(t('todo.statusSuccess'))
    await load()
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
    await load()
}
const todoActionTarget = (item: TodoItem) => normalizeInternalActionUrl(item.action_url)
const openAction = (item: TodoItem) => {
    const target = todoActionTarget(item)
    if (target) router.push(target)
}
const priorityTag = (priority: TodoPriority) => ({ low: 'success', normal: 'info', high: 'warning', urgent: 'danger' }[priority] as 'success' | 'info' | 'warning' | 'danger')

onMounted(load)
</script>

<style scoped lang="scss">
.page-header { display: flex; justify-content: space-between; align-items: center; }
.page-actions { display: flex; gap: var(--xl-space-2); }
.page-header h2 { margin: 0 0 var(--xl-space-1); }
.page-header p { margin: 0; color: var(--el-text-color-secondary); }
.summary-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--xl-space-3); margin-bottom: var(--xl-space-5); }
.summary-item { padding: var(--xl-space-4); border-radius: var(--xl-radius-sm); background: var(--el-fill-color-light); display: flex; justify-content: space-between; align-items: center; }
.summary-item strong { font-size: 24px; }
.load-error { margin-bottom: var(--xl-space-4); }
.filter-form :deep(.el-select), .filter-form :deep(.el-input) { width: 200px; }
.todo-title-cell { display: flex; align-items: center; gap: var(--xl-space-2); }
.pagination-wrap { display: flex; justify-content: flex-end; margin-top: var(--xl-space-5); }
@media (max-width: 768px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .page-header { align-items: flex-start; gap: var(--xl-space-3); } .page-actions { flex-wrap: wrap; justify-content: flex-end; } }
</style>
