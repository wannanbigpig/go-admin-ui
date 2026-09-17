<template>
    <el-card shadow="never" class="recent-activity-card">
        <template #header>
            <div class="activity-card-header">
                <div>
                    <div class="activity-card-title">{{ t('home.dashboard.activityTitle') }}</div>
                    <div class="activity-card-subtitle">{{ t('home.dashboard.activity.subtitle') }}</div>
                </div>
                <el-button v-if="canViewList" data-testid="activity-view-all" link type="primary" @click="emit('view-all')">
                    {{ t('home.dashboard.activity.viewAll') }}
                    <i-ep-arrow-right />
                </el-button>
            </div>
        </template>

        <div v-if="loading" class="activity-loading" aria-live="polite" aria-busy="true">
            <el-skeleton v-for="index in 4" :key="index" animated class="activity-skeleton">
                <template #template>
                    <div class="activity-skeleton-row">
                        <el-skeleton-item variant="circle" class="activity-skeleton-dot" />
                        <div class="activity-skeleton-content">
                            <el-skeleton-item variant="text" style="width: 42%" />
                            <el-skeleton-item variant="text" style="width: 68%" />
                        </div>
                    </div>
                </template>
            </el-skeleton>
        </div>

        <div v-else-if="error" class="activity-error" role="status">
            <el-alert :title="t('home.dashboard.activity.loadFailed')" type="error" :closable="false" show-icon />
            <el-button link type="primary" @click="emit('retry')">{{ t('home.dashboard.activity.retry') }}</el-button>
        </div>

        <ol v-else-if="activityViews.length" class="activity-list" aria-live="polite">
            <li v-for="item in activityViews" :key="item.key" class="activity-list-item">
                <component
                    :is="canOpenActivity(item) ? 'button' : 'div'"
                    class="activity-entry"
                    :class="{ 'is-clickable': canOpenActivity(item), 'is-failed': item.statusType === 'danger' }"
                    :type="canOpenActivity(item) ? 'button' : undefined"
                    :tabindex="canOpenActivity(item) ? 0 : undefined"
                    :aria-label="canOpenActivity(item) ? t('home.dashboard.activity.openDetail', { title: item.title }) : undefined"
                    @click="openActivity(item)"
                    @keydown.enter.prevent="openActivity(item)"
                    @keydown.space.prevent="openActivity(item)"
                >
                    <span class="activity-status-dot" :class="`is-${item.statusType}`" aria-hidden="true"></span>
                    <span class="activity-main">
                        <span class="activity-title-row">
                            <span class="activity-title">{{ item.title }}</span>
                            <el-tag size="small" effect="light" :type="item.statusType">{{ item.statusLabel }}</el-tag>
                            <el-tag v-if="item.isHighRisk" size="small" effect="plain" type="danger">{{ t('home.dashboard.activity.highRisk') }}</el-tag>
                            <el-tag v-if="item.hasChangeDiff" size="small" effect="plain" type="warning">{{ t('home.dashboard.activity.dataChange') }}</el-tag>
                        </span>
                    </span>
                    <time class="activity-time" :datetime="item.created_at || item.time" :title="item.fullTime">
                        {{ item.relativeTime }}
                    </time>
                    <i-ep-arrow-right v-if="canOpenActivity(item)" class="activity-arrow" aria-hidden="true" />
                </component>
            </li>
        </ol>

        <el-empty v-else :description="t('home.dashboard.activity.empty')">
            <template #image>
                <el-icon size="60" color="var(--el-text-color-placeholder)">
                    <i-lucide-inbox />
                </el-icon>
            </template>
        </el-empty>
    </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { buildDashboardActivityViews, type DashboardActivityView } from '@/modules/dashboard/activity'
import type { DashboardActivityItem } from '@/modules/dashboard/service'

const props = defineProps<{
    items: DashboardActivityItem[]
    loading: boolean
    error?: boolean
    canViewList: boolean
    canViewDetail: boolean
}>()

const emit = defineEmits<{
    view: [item: DashboardActivityItem]
    'view-all': []
    retry: []
}>()

const { t, locale } = useI18n()
const activityViews = computed(() => buildDashboardActivityViews(props.items, locale.value, t))
const canOpenActivity = (item: DashboardActivityView) => {
    const detailId = Number(item.requestLogId)
    return props.canViewList || (props.canViewDetail && Number.isInteger(detailId) && detailId > 0)
}

const openActivity = (item: DashboardActivityView) => {
    if (!canOpenActivity(item)) return
    emit('view', item)
}
</script>

<style scoped lang="scss">
.recent-activity-card {
    :deep(.el-card__body) {
        padding: 0;
    }
}

.activity-card-header,
.activity-title-row,
.activity-entry,
.activity-skeleton-row,
.activity-error {
    display: flex;
    align-items: center;
}

.activity-card-header {
    justify-content: space-between;
    gap: var(--xl-space-3);
}

.activity-card-title {
    color: var(--el-text-color-primary);
    font-weight: 600;
}

.activity-card-subtitle {
    margin-top: 3px;
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
}

.activity-list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.activity-list-item + .activity-list-item {
    border-top: 1px solid var(--el-border-color-lighter);
}

.activity-entry {
    width: 100%;
    min-height: 76px;
    gap: var(--xl-space-3);
    padding: var(--xl-space-3) 18px;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;

    &.is-clickable {
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover,
        &:focus-visible {
            outline: none;
            background: var(--el-fill-color-light);
        }

        &:focus-visible {
            box-shadow: inset 0 0 0 2px var(--el-color-primary-light-5);
        }
    }
}

.activity-status-dot {
    flex: 0 0 auto;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--el-color-info);

    &.is-success {
        background: var(--el-color-success);
    }

    &.is-danger {
        background: var(--el-color-danger);
        box-shadow: 0 0 0 4px var(--el-color-danger-light-9);
    }
}

.activity-main {
    min-width: 0;
    flex: 1;
}

.activity-title-row {
    flex-wrap: wrap;
    gap: var(--xl-space-2);
}

.activity-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.5;
}

.activity-time {
    flex: 0 0 auto;
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
    white-space: nowrap;
}

.activity-arrow {
    flex: 0 0 auto;
    color: var(--el-text-color-placeholder);
}

.activity-loading {
    padding: var(--xl-space-2) 18px;
}

.activity-skeleton {
    padding: var(--xl-space-2) 0;
}

.activity-skeleton-row {
    gap: var(--xl-space-3);
}

.activity-skeleton-dot {
    width: 10px;
    height: 10px;
}

.activity-skeleton-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: var(--xl-space-2);
}

.activity-error {
    justify-content: space-between;
    gap: var(--xl-space-3);
    padding: var(--xl-space-4) 18px;
}

@media (max-width: 767px) {
    .activity-card-header {
        align-items: flex-start;
    }

    .activity-entry {
        align-items: flex-start;
        flex-wrap: wrap;
        padding: var(--xl-space-3);
    }

    .activity-main {
        width: calc(100% - 28px);
    }

    .activity-time {
        margin-left: 22px;
    }

    .activity-arrow {
        margin-left: auto;
    }
}
</style>
