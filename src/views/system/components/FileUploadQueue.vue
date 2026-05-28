<template>
    <div v-if="tasks.length && (!uploadFinished || hasErrorTasks)" class="floating-upload-queue">
        <div class="queue-header">
            <span>{{ uploading ? t('system.file.uploading') : t('system.file.uploadTasks') }} ({{ finishedCount }}/{{ tasks.length }})</span>
            <div class="queue-actions">
                <button v-if="tasks.length > 3" type="button" class="queue-toggle" @click="emit('toggle-expand')">
                    {{ expanded ? t('common.actions.collapse') || '收起' : t('common.actions.expand') || '展开' }}
                </button>
                <el-icon class="close-icon" @click="emit('clear')"><Close /></el-icon>
            </div>
        </div>
        <div class="queue-body">
            <div v-for="task in visibleTasks" :key="task.id" class="mini-task" :class="{ 'is-error': task.status === 'error' }">
                <span class="task-name" :title="task.name">{{ task.name }}</span>
                <div v-if="task.status === 'error'" class="task-error-row">
                    <span class="task-error-msg" :title="task.error">{{ task.error || t('system.file.uploadTaskFailed') }}</span>
                    <button type="button" class="task-retry" @click="emit('retry', task)">{{ t('system.file.retry') }}</button>
                </div>
                <el-progress v-else :percentage="task.progress" :stroke-width="4" />
            </div>
            <button v-if="!expanded && tasks.length > 3" type="button" class="queue-more" @click="emit('toggle-expand')">
                {{ t('system.file.moreTasks', { count: tasks.length - 3 }) }}
            </button>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Close } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { UploadTask } from '@/composables/useFileUpload'

const { t } = useI18n()

interface Props {
    tasks: UploadTask[]
    uploading: boolean
    finishedCount: number
    uploadFinished: boolean
    expanded: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
    (e: 'toggle-expand'): void
    (e: 'clear'): void
    (e: 'retry', task: UploadTask): void
}>()

const visibleTasks = computed(() => (props.expanded ? props.tasks : props.tasks.slice(0, 3)))
const hasErrorTasks = computed(() => props.tasks.some((task) => task.status === 'error'))
</script>

<style scoped lang="scss">
.floating-upload-queue {
    position: fixed;
    right: var(--xl-space-5);
    bottom: var(--xl-space-5);
    width: 320px;
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    box-shadow: var(--el-box-shadow-dark);
    z-index: 2000;
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
}

.queue-header {
    padding: var(--xl-space-3) var(--xl-space-4);
    background: var(--el-fill-color-light);
    border-bottom: 1px solid var(--el-border-color-lighter);
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: var(--xl-font-md);
    font-weight: 600;
}

.queue-actions {
    display: flex;
    align-items: center;
    gap: var(--xl-space-2);

    .queue-toggle {
        background: none;
        border: none;
        color: var(--el-color-primary);
        font-size: var(--xl-font-sm);
        cursor: pointer;
        padding: 0;

        &:hover {
            text-decoration: underline;
        }
    }

    .close-icon {
        cursor: pointer;
        font-size: 14px;
        color: var(--el-text-color-secondary);

        &:hover {
            color: var(--el-color-danger);
        }
    }
}

.queue-body {
    padding: var(--xl-space-2) var(--xl-space-4);
    max-height: 400px;
    overflow-y: auto;
}

.mini-task {
    padding: var(--xl-space-2) 0;
    border-bottom: 1px solid var(--el-border-color-extra-light);

    &:last-child {
        border-bottom: none;
    }

    .task-name {
        display: block;
        font-size: var(--xl-font-sm);
        color: var(--el-text-color-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: var(--xl-space-1);
    }

    &.is-error .task-name {
        color: var(--el-color-danger);
    }
}

.task-error-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--xl-space-2);
}

.task-error-msg {
    font-size: var(--xl-font-xs);
    color: var(--el-color-danger);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.task-retry {
    background: none;
    border: none;
    color: var(--el-color-primary);
    font-size: var(--xl-font-xs);
    cursor: pointer;
    padding: 0;
    flex-shrink: 0;

    &:hover {
        text-decoration: underline;
    }
}

.queue-more {
    display: block;
    width: 100%;
    padding: var(--xl-space-2) 0;
    background: none;
    border: none;
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
    cursor: pointer;
    text-align: center;

    &:hover {
        color: var(--el-color-primary);
    }
}
</style>
