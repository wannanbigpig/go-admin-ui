<template>
    <div>
        <!-- 最小化悬浮球：页面常驻，默认最小化 -->
        <div v-if="minimized" class="floating-upload-badge" @click="minimized = false">
            <el-tooltip :content="t('system.file.uploadTasks') || '上传队列'" placement="top">
                <el-badge :value="activeTasksCount" :hidden="activeTasksCount === 0" type="primary">
                    <div class="badge-icon-wrapper" :class="{ 'is-uploading': uploading }">
                        <el-icon :size="24"><Upload /></el-icon>
                    </div>
                </el-badge>
            </el-tooltip>
        </div>

        <!-- 展开的大面板：没有彻底关闭按钮，仅可折叠最小化 -->
        <div v-else class="floating-upload-queue">
            <div class="queue-header">
                <span>{{ uploading ? t('system.file.uploading') : t('system.file.uploadTasks') }} ({{ finishedCount }}/{{ tasks.length }})</span>
                <div class="queue-actions">
                    <button v-if="tasks.length > 3" type="button" class="queue-toggle" @click="emit('toggle-expand')">
                        {{ expanded ? t('common.actions.collapse') || '收起' : t('common.actions.expand') || '展开' }}
                    </button>
                    <!-- 仅保留最小化折叠按钮，移除清空关闭按钮 -->
                    <el-icon class="close-icon" :title="t('common.actions.collapse') || '最小化'" @click="minimized = true"><Minus /></el-icon>
                </div>
            </div>
            <div v-if="tasks.length > 0" class="queue-overall">
                <el-progress :percentage="overallProgress" :stroke-width="8" :status="overallStatus" />
            </div>
            <div class="queue-body">
                <template v-if="tasks.length > 0">
                    <div v-for="task in visibleTasks" :key="task.id" class="mini-task" :class="{ 'is-error': task.status === 'error' }">
                        <div class="task-info-header">
                            <span class="task-name" :title="task.name">{{ task.name }}</span>
                            <span class="task-status-text" :class="task.status">{{ getTaskStatusInfo(task).label }}</span>
                        </div>

                        <!-- 上传失败展示重试 -->
                        <div v-if="task.status === 'error'" class="task-error-row">
                            <span class="task-error-msg" :title="task.error">{{ task.error || t('system.file.uploadTaskFailed') }}</span>
                            <button type="button" class="task-retry" @click="emit('retry', task)">{{ t('system.file.retry') }}</button>
                        </div>

                        <!-- 正常进度条展示 -->
                        <div v-else class="task-progress-row">
                            <el-progress :percentage="task.progress" :stroke-width="4" :status="getTaskStatusInfo(task).progressStatus" :show-text="false" />
                        </div>
                    </div>
                    <button v-if="!expanded && tasks.length > 3" type="button" class="queue-more" @click="emit('toggle-expand')">
                        {{ t('system.file.moreTasks', { count: tasks.length - 3 }) }}
                    </button>
                </template>
                <!-- 无任务时常驻显示空状态 -->
                <div v-else class="queue-empty">
                    <el-empty :description="t('common.noData') || '暂无上传任务'" :image-size="48" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Minus, Upload } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
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
    (e: 'retry', task: UploadTask): void
}>()

// 页面加载进件时默认呈“最小化”状态挂起在右下角，避免遮挡
const minimized = ref(true)

const visibleTasks = computed(() => (props.expanded ? props.tasks : props.tasks.slice(0, 3)))

// 计算处于排队中、传输中或错误的活跃任务数
const activeTasksCount = computed(() => {
    return props.tasks.filter((task) => ['pending', 'hashing', 'uploading', 'error'].includes(task.status)).length
})

// 整体上传进度：按字节加权聚合各文件的真实进度（onUploadProgress），比"完成数/总数"更平滑。
const overallProgress = computed(() => {
    if (props.tasks.length === 0) return 0
    const taskRatio = (task: UploadTask) => (task.status === 'success' || task.status === 'reuse' ? 100 : Math.max(0, Math.min(100, task.progress)))
    const totalBytes = props.tasks.reduce((sum, task) => sum + (task.size || 0), 0)
    if (totalBytes <= 0) {
        const sum = props.tasks.reduce((acc, task) => acc + taskRatio(task), 0)
        return Math.round(sum / props.tasks.length)
    }
    const uploaded = props.tasks.reduce((sum, task) => sum + (task.size || 0) * taskRatio(task), 0)
    return Math.round(uploaded / totalBytes)
})

const overallStatus = computed<'success' | 'exception' | undefined>(() => {
    if (props.tasks.some((task) => task.status === 'error')) return 'exception'
    if (props.tasks.every((task) => task.status === 'success' || task.status === 'reuse')) return 'success'
    return undefined
})

// 获取每个上传任务的各状态渲染信息
const getTaskStatusInfo = (task: UploadTask) => {
    switch (task.status) {
        case 'hashing':
            return {
                label: t('system.file.uploadTaskStatuses.hashing') || '校验中...',
                progressStatus: 'warning' as const,
            }
        case 'pending':
            return {
                label: t('system.file.uploadTaskStatuses.pending') || '排队中...',
                progressStatus: 'warning' as const,
            }
        case 'uploading':
            return {
                label: `${task.progress}%`,
                progressStatus: undefined,
            }
        case 'success':
        case 'reuse':
            return {
                label: t('system.file.uploadTaskStatuses.success') || '已完成',
                progressStatus: 'success' as const,
            }
        case 'error':
            return {
                label: t('system.file.uploadTaskStatuses.error') || '上传失败',
                progressStatus: 'exception' as const,
            }
        default:
            return {
                label: '',
                progressStatus: undefined,
            }
    }
}

// 当有新任务追加时，自动展开大面板
watch(
    () => props.tasks.length,
    (newVal, oldVal) => {
        if (newVal > oldVal) {
            minimized.value = false
        }
    }
)
</script>

<style scoped lang="scss">
/* 最小化悬浮球样式 */
.floating-upload-badge {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 2000;
    cursor: pointer;
    transition: transform 0.2s var(--xl-ease-standard);

    &:hover {
        transform: scale(1.08);
    }
}

.badge-icon-wrapper {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--el-color-primary);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb), 0.35);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: background 0.3s;

    &:hover {
        background: var(--el-color-primary-light-3);
    }

    &.is-uploading {
        animation: pulse-glow 2s infinite ease-in-out;

        .el-icon {
            animation: bounce-up-down 1.6s infinite ease-in-out;
        }
    }
}

@keyframes pulse-glow {
    0% {
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
    50% {
        box-shadow: 0 4px 22px rgba(var(--el-color-primary-rgb), 0.6);
    }
    100% {
        box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
    }
}

@keyframes bounce-up-down {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-4px);
    }
}

/* 大面板样式 */
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
        transition: color 0.2s;

        &:hover {
            color: var(--el-color-primary);
        }
    }
}

.queue-overall {
    padding: var(--xl-space-2) var(--xl-space-4) 0;
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
}

.task-info-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--xl-space-2);
    margin-bottom: var(--xl-space-1);
}

.task-name {
    flex: 1;
    font-size: var(--xl-font-sm);
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.task-status-text {
    font-size: var(--xl-font-xs);
    color: var(--el-text-color-secondary);
    flex-shrink: 0;

    &.hashing,
    &.pending {
        color: var(--el-color-warning);
    }

    &.uploading {
        color: var(--el-color-primary);
        font-weight: 600;
    }

    &.success,
    &.reuse {
        color: var(--el-color-success);
    }

    &.error {
        color: var(--el-color-danger);
    }
}

.task-error-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--xl-space-2);
    margin-top: 4px;
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

.queue-empty {
    padding: var(--xl-space-4) 0;
    display: flex;
    justify-content: center;
    align-items: center;
}
</style>
