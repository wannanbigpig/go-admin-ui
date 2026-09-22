<template>
    <el-card shadow="never" class="todo-card">
        <template #header>
            <div class="todo-card__header">
                <div>
                    <strong>{{ t('todo.title') }}</strong>
                    <span v-if="summary" class="todo-card__count">{{ t('home.dashboard.pendingCount', { count: summary.pending + summary.processing }) }}</span>
                </div>
                <el-button link type="primary" @click="router.push('/todo/list')">{{ t('todo.viewAll') }}</el-button>
            </div>
        </template>

        <div v-loading="loading" class="todo-card__body">
            <div v-if="failed && !loading" class="todo-card__error" role="status">
                <el-alert :title="t('todo.loadFailed')" type="error" :closable="false" show-icon />
                <el-button link type="primary" @click="load">{{ t('todo.retry') }}</el-button>
            </div>
            <button v-for="item in failed ? [] : todos" :key="item.id" type="button" class="todo-card__item" @click="openTodo(item)">
                <span class="todo-card__marker" :class="`is-${item.priority}`"></span>
                <span class="todo-card__content">
                    <span class="todo-card__title">{{ item.title }}</span>
                    <span class="todo-card__meta">
                        <el-tag v-if="isTodoOverdue(item)" size="small" type="danger">{{ t('todo.overdue') }}</el-tag>
                        <span>{{ item.due_at || '-' }}</span>
                    </span>
                </span>
                <el-tag size="small" :type="item.status === 'processing' ? 'primary' : 'warning'">{{ t(`todo.statuses.${item.status}`) }}</el-tag>
            </button>
            <el-empty v-if="!loading && !failed && todos.length === 0" :description="t('todo.empty')" :image-size="64" />
        </div>
    </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { fetchTodoList, fetchTodoSummary, isTodoOverdue, sortActiveTodos } from '@/modules/todo/service'
import { Logger } from '@/utils/logger'
import { normalizeInternalActionUrl } from '@/utils/notificationAction'
import type { TodoItem, TodoSummary } from '@/types/todo'

const { t } = useI18n()
const router = useRouter()
const loading = ref(false)
const failed = ref(false)
const todos = ref<TodoItem[]>([])
const summary = ref<TodoSummary | null>(null)

const load = async () => {
    loading.value = true
    failed.value = false
    try {
        const [pending, processing, summaryResult] = await Promise.all([
            fetchTodoList({ page: 1, per_page: 5, status: 'pending' }),
            fetchTodoList({ page: 1, per_page: 5, status: 'processing' }),
            fetchTodoSummary(),
        ])
        const unique = new Map([...pending.list, ...processing.list].map((item) => [item.id, item]))
        todos.value = sortActiveTodos([...unique.values()]).slice(0, 5)
        summary.value = summaryResult
    } catch (error) {
        Logger.error('获取首页待办失败:', error)
        todos.value = []
        failed.value = true
    } finally {
        loading.value = false
    }
}

const openTodo = (item: TodoItem) => {
    const target = normalizeInternalActionUrl(item.action_url)
    if (target) {
        router.push(target)
        return
    }
    router.push('/todo/list')
}

onMounted(load)
</script>

<style scoped lang="scss">
.todo-card {
    height: 100%;

    :deep(.el-card__header) {
        padding: var(--xl-space-3) var(--xl-space-4);
    }

    :deep(.el-card__body) {
        padding: var(--xl-space-3) var(--xl-space-4);
    }
}

.todo-card__header,
.todo-card__header > div,
.todo-card__item,
.todo-card__meta {
    display: flex;
    align-items: center;
}

.todo-card__header {
    justify-content: space-between;
}

.todo-card__count {
    margin-left: var(--xl-space-2);
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
}

.todo-card__body {
    min-height: 246px;
}

.todo-card__error {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--xl-space-2);
}

.todo-card__item {
    width: 100%;
    gap: var(--xl-space-2);
    min-height: 49px;
    padding: var(--xl-space-2) 0;
    border: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: transparent;
    color: inherit;
    text-align: left;
    cursor: pointer;
}

.todo-card__marker {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--el-color-info);

    &.is-high { background: var(--el-color-warning); }
    &.is-urgent { background: var(--el-color-danger); }
    &.is-low { background: var(--el-color-success); }
}

.todo-card__content {
    min-width: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--xl-space-1);
}

.todo-card__title {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.todo-card__meta {
    gap: var(--xl-space-2);
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-xs);
}
</style>
