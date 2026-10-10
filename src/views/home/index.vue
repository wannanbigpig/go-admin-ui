<template>
    <div class="dashboard-page">
        <el-row :gutter="16" class="dashboard-row">
            <el-col :span="24">
                <el-card shadow="never" class="welcome-card">
                    <div class="welcome-content">
                        <div>
                            <p class="eyebrow">{{ t('home.dashboard.today') }}</p>
                            <h1>{{ t('home.dashboard.greeting', { name: username }) }}</h1>
                            <p class="welcome-desc">{{ t('home.dashboard.summary') }}</p>
                            <div class="login-meta">
                                <el-tag type="info" effect="plain">{{ t('home.loginTime') }}: {{ loginTime }}</el-tag>
                                <el-tag type="info" effect="plain">{{ t('home.lastLoginIp') }}: {{ lastLoginIP }}</el-tag>
                            </div>
                            <el-alert v-if="personalFailed && !personalLoading" class="welcome-state" type="error" :title="t('home.dashboard.personalLoadFailed')" :closable="false" show-icon>
                                <template #default>
                                    <el-button link type="primary" :loading="personalLoading" @click="refreshDashboard">{{ t('home.dashboard.retry') }}</el-button>
                                </template>
                            </el-alert>
                        </div>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16" class="dashboard-row personal-work-row">
            <el-col :xs="24" :lg="12" class="workbench-column">
                <recent-activity-panel
                    :items="activities"
                    :loading="personalLoading"
                    :error="personalFailed"
                    :can-view-list="true"
                    :can-view-detail="true"
                    @view="openActivity"
                    @view-all="openActivityList"
                    @retry="refreshDashboard"
                />
            </el-col>
            <el-col :xs="24" :md="12" :lg="6" class="workbench-column">
                <todo-card />
            </el-col>
            <el-col :xs="24" :md="12" :lg="6" class="workbench-column">
                <el-card shadow="never" class="shortcut-card">
                    <template #header>
                        <div class="card-header">
                            <div>
                                <div class="card-title">{{ t('home.dashboard.shortcuts') }}</div>
                                <div class="card-subtitle">{{ t('home.dashboard.shortcutSubtitle') }}</div>
                            </div>
                        </div>
                    </template>
                    <div class="shortcut-grid">
                        <button v-for="item in shortcuts" :key="item.key" type="button" class="shortcut-btn" @click="goShortcut(item.path)">
                            <span class="shortcut-icon">
                                <i-ep-user v-if="item.key === 'users'" />
                                <i-ep-lock v-else-if="item.key === 'roles'" />
                                <i-ep-menu v-else-if="item.key === 'menus'" />
                                <i-ep-document v-else-if="item.key === 'logs'" />
                                <i-ep-list v-else-if="item.key === 'todo'" />
                                <i-ep-setting v-else-if="item.key === 'config'" />
                                <i-ep-tickets v-else-if="item.key === 'tasks'" />
                                <i-ep-user-filled v-else-if="item.key === 'profile'" />
                            </span>
                            <span>{{ item.label }}</span>
                            <i-ep-arrow-right class="shortcut-arrow" />
                        </button>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <div v-if="hasPermission('dashboard:overview') || hasPermission('dashboard:statistics')" class="section-heading">
            <div>
                <h2>{{ t('home.dashboard.globalTitle') }}</h2>
                <p>{{ t('home.dashboard.globalSubtitle') }}</p>
            </div>
        </div>

        <el-row v-if="hasPermission('dashboard:overview')" :gutter="16" class="dashboard-row">
            <el-col v-if="overviewFailed" :span="24">
                <el-alert type="error" :title="t('home.dashboard.overviewLoadFailed')" :closable="false" show-icon>
                    <template #default>
                        <el-button link type="primary" :loading="dashboardLoading" @click="refreshDashboard">{{ t('home.dashboard.retry') }}</el-button>
                    </template>
                </el-alert>
            </el-col>
            <template v-else-if="dashboardLoading && !dashboardOverview">
                <el-col v-for="item in metricSkeletons" :key="item" :xs="24" :sm="12" :lg="6">
                    <el-card shadow="never" class="metric-card">
                        <el-skeleton :rows="2" animated />
                    </el-card>
                </el-col>
            </template>
            <template v-else>
                <el-col v-for="item in metricCards" :key="item.key" :xs="24" :sm="12" :lg="6">
                    <el-card shadow="never" class="metric-card">
                        <div class="metric-main">
                            <div class="metric-icon" :class="item.tone">
                                <i-ep-user-filled v-if="item.key === 'users'" />
                                <i-ep-data-analysis v-else-if="item.key === 'requests'" />
                                <i-ep-warning-filled v-else-if="item.key === 'errors'" />
                                <i-ep-circle-check-filled v-else-if="item.key === 'tasks'" />
                            </div>
                            <el-statistic :title="item.title" :value="item.value" :suffix="item.suffix" />
                        </div>
                        <div class="metric-footer">
                            <span>{{ item.compare }}</span>
                            <el-tag :type="item.tagType" size="small">{{ item.change }}</el-tag>
                        </div>
                    </el-card>
                </el-col>
            </template>
            <el-col v-if="!dashboardLoading && !overviewFailed && metricCards.length === 0" :span="24">
                <el-card shadow="never" class="empty-state-card">
                    <el-empty :description="t('home.dashboard.noMetrics')" :image-size="72" />
                </el-card>
            </el-col>
        </el-row>

        <el-row v-if="hasPermission('dashboard:statistics') && statisticsFailed" :gutter="16" class="dashboard-row">
            <el-col :span="24">
                <el-alert type="error" :title="t('home.dashboard.statisticsLoadFailed')" :closable="false" show-icon>
                    <template #default>
                        <el-button link type="primary" :loading="dashboardLoading" @click="refreshDashboard">{{ t('home.dashboard.retry') }}</el-button>
                    </template>
                </el-alert>
            </el-col>
        </el-row>

        <template v-if="hasPermission('dashboard:statistics') && !statisticsFailed">
            <el-row :gutter="16" class="dashboard-row statistics-primary-row">
                <el-col :xs="24" :lg="16">
                    <el-card shadow="never" class="stat-card stat-card--primary">
                        <template #header>
                            <div class="chart-card-header">
                                <div class="chart-card-title">
                                    <span>{{ t('home.dashboard.trend.title') }}</span>
                                    <span class="card-header-extra">{{ t('home.dashboard.trend.subtitle') }}</span>
                                </div>
                                <div class="chart-toolbar">
                                    <el-button-group>
                                        <el-button data-testid="dashboard-range-7d" size="small" :type="statisticsRangePreset === '7d' ? 'primary' : 'default'" @click="selectStatisticsRange('7d')">
                                            {{ t('home.dashboard.range.sevenDays') }}
                                        </el-button>
                                        <el-button data-testid="dashboard-range-30d" size="small" :type="statisticsRangePreset === '30d' ? 'primary' : 'default'" @click="selectStatisticsRange('30d')">
                                            {{ t('home.dashboard.range.thirtyDays') }}
                                        </el-button>
                                        <el-button data-testid="dashboard-range-custom" size="small" :type="statisticsRangePreset === 'custom' ? 'primary' : 'default'" @click="selectStatisticsRange('custom')">
                                            {{ t('home.dashboard.range.custom') }}
                                        </el-button>
                                    </el-button-group>
                                    <el-date-picker
                                        v-if="statisticsRangePreset === 'custom'"
                                        v-model="customStatisticsRange"
                                        data-testid="dashboard-custom-range"
                                        class="chart-toolbar__date"
                                        type="daterange"
                                        size="small"
                                        unlink-panels
                                        value-format="YYYY-MM-DD"
                                        :clearable="false"
                                        :disabled-date="disableFutureStatisticsDate"
                                        :start-placeholder="t('common.date.start')"
                                        :end-placeholder="t('common.date.end')"
                                        @change="handleCustomStatisticsRangeChange"
                                    />
                                    <el-button
                                        data-testid="dashboard-statistics-refresh"
                                        size="small"
                                        circle
                                        :loading="statisticsRefreshing"
                                        :disabled="!statisticsQuery"
                                        :title="t('home.dashboard.refresh')"
                                        :aria-label="t('home.dashboard.refresh')"
                                        @click="refreshStatistics"
                                    >
                                        <i-ep-refresh-right />
                                    </el-button>
                                </div>
                            </div>
                        </template>
                        <el-skeleton v-if="(dashboardLoading || statisticsRefreshing) && !dashboardStatistics" :rows="6" animated />
                        <div v-else-if="statisticsTrendDays.length" ref="trendChartRef" class="chart chart--large"></div>
                        <el-empty v-else :description="t('home.dashboard.trend.empty')" :image-size="72" />
                    </el-card>
                </el-col>
                <el-col :xs="24" :lg="8" class="responsive-column">
                    <el-card shadow="never" class="stat-card stat-card--primary">
                        <template #header>
                            <div class="card-header">
                                <span>{{ t('home.dashboard.responseTime.title') }}</span>
                                <span v-if="responseTimeAvgText" class="card-header-extra">{{ responseTimeAvgText }}</span>
                            </div>
                        </template>
                        <el-skeleton v-if="(dashboardLoading || statisticsRefreshing) && !dashboardStatistics" :rows="6" animated />
                        <div v-else-if="hasResponseTime" ref="responseTimeChartRef" class="chart chart--large"></div>
                        <el-empty v-else :description="t('home.dashboard.responseTime.empty')" :image-size="72" />
                    </el-card>
                </el-col>
            </el-row>

            <el-row :gutter="16" class="dashboard-row">
                <el-col :xs="24" :md="12">
                    <el-card shadow="never" class="stat-card">
                        <template #header>
                            <span>{{ t('home.dashboard.errorCodes.title') }}</span>
                        </template>
                        <el-skeleton v-if="(dashboardLoading || statisticsRefreshing) && !dashboardStatistics" :rows="5" animated />
                        <div v-else-if="hasErrorCodes" ref="errorCodesChartRef" class="chart"></div>
                        <el-empty v-else :description="t('home.dashboard.errorCodes.empty')" :image-size="72" />
                    </el-card>
                </el-col>
                <el-col :xs="24" :md="12" class="responsive-column">
                    <el-card shadow="never" class="stat-card">
                        <template #header>
                            <span>{{ t('home.dashboard.storage.title') }}</span>
                        </template>
                        <el-skeleton v-if="dashboardLoading && !dashboardStatistics" :rows="5" animated />
                        <div v-else-if="hasStorage" class="storage-block">
                            <div class="storage-summary">
                                <div class="storage-summary-row">
                                    <span class="storage-summary-label">{{ t('home.dashboard.storage.totalCount') }}</span>
                                    <span class="storage-summary-value">{{ storageStats!.total_count }}</span>
                                </div>
                                <div class="storage-summary-row">
                                    <span class="storage-summary-label">{{ t('home.dashboard.storage.totalSize') }}</span>
                                    <span class="storage-summary-value">{{ formatFileSize(storageStats!.total_size_bytes) }}</span>
                                </div>
                            </div>
                            <div class="storage-bytype">
                                <div class="storage-bytype-title">{{ t('home.dashboard.storage.byType') }}</div>
                                <div v-for="item in storageByType" :key="item.file_type" class="storage-bytype-row">
                                    <div class="storage-bytype-label">
                                        <el-tag size="small" type="info">{{ item.label }}</el-tag>
                                        <span class="storage-bytype-count">{{ item.count }}</span>
                                    </div>
                                    <el-progress class="storage-bytype-bar" :percentage="item.percentage" :stroke-width="8" :show-text="false" />
                                    <span class="storage-bytype-size">{{ formatFileSize(item.size_bytes) }}</span>
                                </div>
                            </div>
                        </div>
                        <el-empty v-else :description="t('home.dashboard.storage.empty')" :image-size="72" />
                    </el-card>
                </el-col>
            </el-row>
        </template>

        <el-row v-if="hasPermission('dashboard:monitor')" :gutter="16" class="dashboard-row">
            <el-col :span="24">
                <el-card shadow="never" class="monitor-card">
                    <template #header>
                        <div class="card-header">
                            <span>{{ t('home.dashboard.serverMonitor') }}</span>
                            <div class="monitor-header-actions">
                                <el-tag v-if="dashboardMonitor" type="info" size="small">{{ formatUptime(dashboardMonitor.host?.uptime || 0) }}</el-tag>
                                <el-button
                                    data-testid="dashboard-monitor-refresh"
                                    text
                                    circle
                                    size="small"
                                    :loading="monitorLoading"
                                    :aria-label="t('home.dashboard.refresh')"
                                    :title="t('home.dashboard.refresh')"
                                    @click="fetchMonitor"
                                >
                                    <i-ep-refresh v-if="!monitorLoading" />
                                </el-button>
                            </div>
                        </div>
                    </template>
                    <el-skeleton v-if="monitorLoading && !dashboardMonitor" :rows="4" animated />
                    <el-alert v-else-if="monitorFailed" type="error" :title="t('home.dashboard.monitorLoadFailed')" :closable="false" show-icon>
                        <template #default>
                            <el-button link type="primary" :loading="monitorLoading" @click="fetchMonitor">{{ t('home.dashboard.retry') }}</el-button>
                        </template>
                    </el-alert>
                    <el-row v-else-if="dashboardMonitor" :gutter="16">
                        <el-col :xs="12" :md="6">
                            <div class="monitor-stat">
                                <div class="monitor-stat-label">{{ t('system.monitor.cpu') }}</div>
                                <el-progress
                                    type="dashboard"
                                    :percentage="Math.round(dashboardMonitor.host?.cpu?.usage_percent || 0)"
                                    :color="getProgressColor(dashboardMonitor.host?.cpu?.usage_percent || 0)"
                                    :size="100"
                                />
                                <div class="monitor-stat-info">{{ t('system.monitor.cpuCores', { cores: dashboardMonitor.host?.cpu?.cores || 0 }) }}</div>
                            </div>
                        </el-col>
                        <el-col :xs="12" :md="6">
                            <div class="monitor-stat">
                                <div class="monitor-stat-label">{{ t('system.monitor.memory') }}</div>
                                <el-progress
                                    type="dashboard"
                                    :percentage="Math.round(dashboardMonitor.host?.memory?.usage_percent || 0)"
                                    :color="getProgressColor(dashboardMonitor.host?.memory?.usage_percent || 0)"
                                    :size="100"
                                />
                                <div class="monitor-stat-info">{{ formatBytes(dashboardMonitor.host?.memory?.used || 0) }} / {{ formatBytes(dashboardMonitor.host?.memory?.total || 0) }}</div>
                            </div>
                        </el-col>
                        <el-col :xs="12" :md="6">
                            <div class="monitor-stat">
                                <div class="monitor-stat-label">{{ t('system.monitor.disk') }}</div>
                                <el-progress
                                    type="dashboard"
                                    :percentage="Math.round(dashboardMonitor.host?.disk?.usage_percent || 0)"
                                    :color="getProgressColor(dashboardMonitor.host?.disk?.usage_percent || 0)"
                                    :size="100"
                                />
                                <div class="monitor-stat-info">{{ formatBytes(dashboardMonitor.host?.disk?.used || 0) }} / {{ formatBytes(dashboardMonitor.host?.disk?.total || 0) }}</div>
                            </div>
                        </el-col>
                        <el-col :xs="12" :md="6">
                            <div class="monitor-stat">
                                <div class="monitor-stat-label">{{ t('system.monitor.load') }}</div>
                                <div class="monitor-load-grid">
                                    <div class="monitor-load-item">
                                        <div class="monitor-load-value">{{ (dashboardMonitor.host?.load?.load1 || 0).toFixed(2) }}</div>
                                        <div class="monitor-load-label">1 min</div>
                                    </div>
                                    <div class="monitor-load-item">
                                        <div class="monitor-load-value">{{ (dashboardMonitor.host?.load?.load5 || 0).toFixed(2) }}</div>
                                        <div class="monitor-load-label">5 min</div>
                                    </div>
                                    <div class="monitor-load-item">
                                        <div class="monitor-load-value">{{ (dashboardMonitor.host?.load?.load15 || 0).toFixed(2) }}</div>
                                        <div class="monitor-load-label">15 min</div>
                                    </div>
                                </div>
                            </div>
                        </el-col>
                    </el-row>
                    <el-empty v-else :description="t('home.dashboard.monitorEmpty')" :image-size="72" />
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { fetchDashboardOverview, fetchDashboardPersonal, fetchDashboardStatistics, type DashboardActivityItem, type DashboardOverview, type DashboardPersonal, type DashboardStatistics } from '@/modules/dashboard/service'
import { getDashboardMonitor, type DashboardMonitor, type DashboardStatisticsQuery } from '@/api/dashboard'
import RecentActivityPanel from '@/views/home/components/RecentActivityPanel.vue'
import TodoCard from '@/views/home/components/TodoCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useSettingStore } from '@/stores/setting'
import { hasPermission } from '@/utils/auth'
import { formatFileSize } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import { useIntervalPolling } from '@/composables/useIntervalPolling'
import type { DashboardChart } from '@/modules/dashboard/echarts'

type InitDashboardChart = (el: HTMLElement) => DashboardChart
let initChart: InitDashboardChart | null = null

const { t } = useI18n()
const router = useRouter()
const settingStore = useSettingStore()
let isMounted = false

const username = ref('')
const loginTime = ref('')
const lastLoginIP = ref('')
const dashboardLoading = ref(false)
const statisticsRefreshing = ref(false)
const personalLoading = ref(false)
const personalFailed = ref(false)
const overviewFailed = ref(false)
const statisticsFailed = ref(false)
const monitorLoading = ref(false)
const monitorFailed = ref(false)
const dashboardPersonal = ref<DashboardPersonal | null>(null)
const dashboardOverview = ref<DashboardOverview | null>(null)
const dashboardStatistics = ref<DashboardStatistics | null>(null)
const dashboardMonitor = ref<DashboardMonitor | null>(null)
const trendChartRef = ref<HTMLDivElement>()
const responseTimeChartRef = ref<HTMLDivElement>()
const errorCodesChartRef = ref<HTMLDivElement>()
let trendChart: DashboardChart | null = null
let responseTimeChart: DashboardChart | null = null
let errorCodesChart: DashboardChart | null = null
const metricSkeletons = [1, 2, 3, 4]

type StatisticsRangePreset = '7d' | '30d' | 'custom'

const MAX_STATISTICS_RANGE_DAYS = 90
const statisticsRangePreset = ref<StatisticsRangePreset>('7d')
const customStatisticsRange = ref<[string, string] | null>(null)

const formatStatisticsDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

const createPresetStatisticsQuery = (days: number): DashboardStatisticsQuery => {
    const end = new Date()
    const start = new Date(end.getFullYear(), end.getMonth(), end.getDate() - (days - 1))
    return { start_date: formatStatisticsDate(start), end_date: formatStatisticsDate(end) }
}

const statisticsRangeDays = (range: [string, string]) => {
    const start = Date.parse(`${range[0]}T00:00:00Z`)
    const end = Date.parse(`${range[1]}T00:00:00Z`)
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0
    return Math.floor((end - start) / 86400000) + 1
}

const statisticsQuery = computed<DashboardStatisticsQuery | null>(() => {
    if (statisticsRangePreset.value === '7d') return createPresetStatisticsQuery(7)
    if (statisticsRangePreset.value === '30d') return createPresetStatisticsQuery(30)
    const range = customStatisticsRange.value
    if (!range || statisticsRangeDays(range) < 1 || statisticsRangeDays(range) > MAX_STATISTICS_RANGE_DAYS) return null
    return { start_date: range[0], end_date: range[1] }
})

const metricMeta = computed<Record<string, { tone: string; title: string }>>(() => ({
    users: { tone: 'is-blue', title: t('home.dashboard.metrics.users') },
    requests: { tone: 'is-green', title: t('home.dashboard.metrics.requests') },
    errors: { tone: 'is-orange', title: t('home.dashboard.metrics.errors') },
    tasks: { tone: 'is-blue', title: t('home.dashboard.metrics.tasks') },
}))

const metricCards = computed(() => {
    return (dashboardOverview.value?.metrics || [])
        .filter((item) => metricMeta.value[item.key])
        .map((item) => ({
            ...item,
            title: metricMeta.value[item.key].title,
            tone: metricMeta.value[item.key].tone,
            tagType: item.type || 'info',
        }))
})

const shortcuts = computed(() =>
    [
        { key: 'users', label: t('home.dashboard.shortcut.users'), path: '/permission/admin-user-list', permissions: ['adminUser:list'] },
        { key: 'roles', label: t('home.dashboard.shortcut.roles'), path: '/permission/role-list', permissions: ['role:list'] },
        { key: 'menus', label: t('home.dashboard.shortcut.menus'), path: '/permission/menu-list', permissions: ['menu:list'] },
        { key: 'logs', label: t('home.dashboard.shortcut.logs'), path: '/my-request-log' },
        { key: 'config', label: t('home.dashboard.shortcut.config'), path: '/system/config', permissions: ['sysConfig:list', 'storage:config', 'sms:config', 'requestLog:maskConfig'] },
        { key: 'tasks', label: t('home.dashboard.shortcut.tasks'), path: '/task/center', permissions: ['task:list'] },
        { key: 'profile', label: t('home.dashboard.shortcut.profile'), path: '/profile' },
    ].filter((item) => !item.permissions || item.permissions.some((permission) => hasPermission(permission)))
)

const activities = computed(() => (dashboardPersonal.value?.activities || []).slice(0, 5))
const trendSeriesNames = computed(() => ({
    requests: t('home.dashboard.trend.series.requests'),
    errors: t('home.dashboard.trend.series.errors'),
    logins: t('home.dashboard.trend.series.logins'),
}))

const statisticsTrendDays = computed(() => dashboardStatistics.value?.trend.days || [])
const responseTimeStats = computed(() => dashboardStatistics.value?.response_time)
const errorCodeStats = computed(() => {
    // 1. 优先从 statistics.errors.status_codes 获取
    const fromErrors = dashboardStatistics.value?.errors.status_codes
    if (fromErrors && fromErrors.length > 0) return fromErrors

    // 2. 兜底从 overview.error_codes 获取
    return dashboardOverview.value?.error_codes || []
})
const storageStats = computed(() => dashboardStatistics.value?.storage)

const hasResponseTime = computed(() => {
    const stats = responseTimeStats.value
    return !!stats && Array.isArray(stats.buckets) && stats.buckets.some((b) => b.count > 0)
})
const hasErrorCodes = computed(() => errorCodeStats.value.some((item) => item.count > 0))
const hasStorage = computed(() => {
    const s = storageStats.value
    return !!s && (Number(s.total_count) > 0 || Number(s.total_size_bytes) > 0)
})
const responseTimeAvgText = computed(() => {
    const avg = responseTimeStats.value?.avg_ms
    if (avg === undefined || avg === null) return ''
    return `${t('home.dashboard.responseTime.avg')}: ${Number(avg).toFixed(0)} ms`
})

const localizeBucketLabel = (label: string) => {
    const key = `home.dashboard.responseTime.buckets.${label}`
    const translated = t(key)
    return translated === key ? label : translated
}

const storageTypeLabel = (fileType: string) => {
    const key = `home.dashboard.storage.typeNames.${fileType}`
    const translated = t(key)
    return translated === key ? fileType || t('home.dashboard.storage.typeNames.other') : translated
}

const storageByType = computed(() => {
    const s = storageStats.value
    if (!s) return []
    const total = Number(s.total_size_bytes) || 0
    return (s.by_type || []).map((item) => ({
        ...item,
        label: storageTypeLabel(item.file_type),
        percentage: total > 0 ? Math.min(100, Math.round((Number(item.size_bytes) / total) * 100)) : 0,
    }))
})

// 服务器监控相关
const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatUptime = (seconds: number): string => {
    if (seconds === 0) return '-'
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    const parts = []
    if (days > 0) parts.push(t('system.monitor.uptimeDays', { days }))
    if (hours > 0) parts.push(t('system.monitor.uptimeHours', { hours }))
    if (minutes > 0) parts.push(t('system.monitor.uptimeMinutes', { minutes }))
    return parts.join(' ') || t('system.monitor.uptimeJustStarted')
}

const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return '#f56c6c'
    if (percentage >= 70) return '#e6a23c'
    return '#67c23a'
}

const fetchMonitor = async () => {
    if (!isMounted || !hasPermission('dashboard:monitor') || monitorLoading.value) return
    monitorLoading.value = true
    try {
        const res = await getDashboardMonitor()
        if (isMounted) {
            dashboardMonitor.value = res
            monitorFailed.value = false
        }
    } catch (error) {
        if (isMounted) monitorFailed.value = true
        Logger.warn('获取服务器监控数据失败', error)
    } finally {
        if (isMounted) monitorLoading.value = false
    }
}

const monitorPolling = useIntervalPolling(
    async () => {
        await fetchMonitor()
    },
    {
        interval: 15000,
        pauseWhenHidden: true,
        when: () => isMounted && hasPermission('dashboard:monitor') && !monitorLoading.value,
    }
)

const toDisplayText = (value: unknown, fallback: string) => {
    return typeof value === 'string' && value.trim() ? value : fallback
}

const resolveLoginTime = (value: unknown) => {
    const fallback = loginTime.value || t('home.unknown')
    return toDisplayText(value, fallback)
}

const syncUserInfo = () => {
    const authStore = useAuthStore()
    const userInfo = authStore.userInfo || {}

    username.value = toDisplayText(userInfo.nickname, toDisplayText(userInfo.username, t('home.unknownUser')))
    loginTime.value = resolveLoginTime(dashboardPersonal.value?.user_login?.last_login || userInfo.last_login)
    lastLoginIP.value = toDisplayText(dashboardPersonal.value?.user_login?.last_ip || userInfo.last_ip, t('home.unknown'))
}

const refreshDashboard = async () => {
    dashboardLoading.value = true
    personalLoading.value = true
    overviewFailed.value = false
    statisticsFailed.value = false
    try {
        const canViewOverview = hasPermission('dashboard:overview')
        const canViewStatistics = hasPermission('dashboard:statistics')

        const personalPromise = fetchDashboardPersonal()
        const overviewPromise = canViewOverview ? fetchDashboardOverview() : Promise.resolve(null)
        const statisticsPromise = canViewStatistics && statisticsQuery.value ? fetchDashboardStatistics(statisticsQuery.value) : Promise.resolve(dashboardStatistics.value)

        const [personalResult, overviewResult, statisticsResult] = await Promise.allSettled([personalPromise, overviewPromise, statisticsPromise])

        if (personalResult.status === 'fulfilled') {
            dashboardPersonal.value = personalResult.value
            personalFailed.value = false
        } else {
            dashboardPersonal.value = null
            personalFailed.value = true
            Logger.warn('获取个人仪表盘数据失败', personalResult.reason)
        }

        if (canViewOverview && overviewResult.status === 'fulfilled') {
            dashboardOverview.value = overviewResult.value
            overviewFailed.value = false
        } else {
            dashboardOverview.value = null
            if (canViewOverview && overviewResult.status === 'rejected') {
                overviewFailed.value = true
                Logger.warn('获取仪表盘概览失败', overviewResult.reason)
            }
        }

        if (canViewStatistics && statisticsResult.status === 'fulfilled') {
            dashboardStatistics.value = statisticsResult.value
            statisticsFailed.value = false
        } else {
            dashboardStatistics.value = null
            if (canViewStatistics && statisticsResult.status === 'rejected') {
                statisticsFailed.value = true
                Logger.warn('获取仪表盘统计失败', statisticsResult.reason)
            }
        }
    } catch (error) {
        dashboardPersonal.value = null
        personalFailed.value = true
        dashboardOverview.value = null
        dashboardStatistics.value = null
        overviewFailed.value = hasPermission('dashboard:overview')
        statisticsFailed.value = hasPermission('dashboard:statistics')
        Logger.warn('获取仪表盘数据失败', error)
    } finally {
        dashboardLoading.value = false
        personalLoading.value = false
    }
    syncUserInfo()
    if (!isMounted) return
    await rebuildCharts()
}

const refreshStatistics = async () => {
    const query = statisticsQuery.value
    if (!isMounted || !hasPermission('dashboard:statistics') || !query || statisticsRefreshing.value) return

    statisticsRefreshing.value = true
    statisticsFailed.value = false
    try {
        dashboardStatistics.value = await fetchDashboardStatistics(query)
    } catch (error) {
        statisticsFailed.value = true
        Logger.warn('获取仪表盘统计失败', error)
    } finally {
        statisticsRefreshing.value = false
    }
    if (isMounted) await rebuildCharts()
}

const selectStatisticsRange = async (preset: StatisticsRangePreset) => {
    statisticsRangePreset.value = preset
    if (preset !== 'custom') await refreshStatistics()
}

const handleCustomStatisticsRangeChange = async (range: [string, string] | null) => {
    customStatisticsRange.value = range
    if (!range) return
    const days = statisticsRangeDays(range)
    if (days < 1 || days > MAX_STATISTICS_RANGE_DAYS) {
        ElMessage.warning(t('home.dashboard.range.maxDays', { count: MAX_STATISTICS_RANGE_DAYS }))
        return
    }
    await refreshStatistics()
}

const disableFutureStatisticsDate = (date: Date) => {
    const today = new Date()
    return date.getTime() > new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime()
}

const rebuildCharts = async () => {
    trendChart?.dispose()
    trendChart = null
    responseTimeChart?.dispose()
    responseTimeChart = null
    errorCodesChart?.dispose()
    errorCodesChart = null
    await nextTick()
    if (!isMounted) return
    initTrendChart()
    initResponseTimeChart()
    initErrorCodesChart()
}

const goShortcut = (path: string) => {
    router.push(path)
}

const openActivityList = () => {
    router.push('/my-request-log')
}

const openActivity = (item: DashboardActivityItem) => {
    const detailId = Number(item.request_log_id || item.key)
    if (Number.isInteger(detailId) && detailId > 0) {
        router.push({ path: '/my-request-log', query: { detail: String(detailId) } })
        return
    }

    const query = item.request_id?.trim() ? { request_id: item.request_id.trim() } : undefined
    router.push({ path: '/my-request-log', query })
}

const gridWithAxisLabelBounds = {
    outerBoundsMode: 'same' as const,
    outerBoundsContain: 'axisLabel' as const,
}

const chartTheme = () => {
    const styles = typeof window === 'undefined' ? null : window.getComputedStyle(document.documentElement)
    const color = (name: string, fallback: string) => styles?.getPropertyValue(name).trim() || fallback
    return {
        primary: color('--el-color-primary', '#409eff'),
        success: color('--el-color-success', '#67c23a'),
        danger: color('--el-color-danger', '#f56c6c'),
        warning: color('--el-color-warning', '#e6a23c'),
        text: color('--el-text-color-regular', '#606266'),
        muted: color('--el-text-color-secondary', '#909399'),
        split: color('--el-border-color-lighter', '#ebeef5'),
        surface: color('--el-bg-color-overlay', '#ffffff'),
    }
}

const chartTooltip = () => {
    const theme = chartTheme()
    return {
        confine: true,
        backgroundColor: theme.surface,
        borderColor: theme.split,
        textStyle: { color: theme.text },
        extraCssText: 'box-shadow: var(--el-box-shadow-light); border-radius: 8px;',
    }
}

let resizeObserver: ResizeObserver | null = null

const initResizeObserver = () => {
    if (typeof ResizeObserver === 'undefined') return
    resizeObserver = new ResizeObserver((entries) => {
        window.requestAnimationFrame(() => {
            for (const entry of entries) {
                if (entry.target === trendChartRef.value) {
                    trendChart?.resize()
                } else if (entry.target === responseTimeChartRef.value) {
                    responseTimeChart?.resize()
                } else if (entry.target === errorCodesChartRef.value) {
                    errorCodesChart?.resize()
                }
            }
        })
    })
}

const observeElement = (el: HTMLElement | undefined) => {
    if (el && resizeObserver) {
        resizeObserver.observe(el)
    }
}

const initTrendChart = () => {
    if (!initChart || !trendChartRef.value || statisticsTrendDays.value.length === 0) return
    trendChart = initChart(trendChartRef.value)
    const seriesNames = trendSeriesNames.value
    const theme = chartTheme()
    trendChart.setOption({
        color: [theme.primary, theme.danger, theme.success],
        tooltip: { trigger: 'axis', ...chartTooltip() },
        legend: {
            data: [seriesNames.requests, seriesNames.errors, seriesNames.logins],
            top: 0,
            textStyle: { color: theme.text },
        },
        grid: { top: 40, left: '3%', right: '4%', bottom: '3%', ...gridWithAxisLabelBounds },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: statisticsTrendDays.value.map((day) => day.date),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: theme.muted },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisLabel: { color: theme.muted },
            splitLine: { lineStyle: { color: theme.split, type: 'dashed' } },
        },
        series: [
            {
                name: seriesNames.requests,
                type: 'line',
                smooth: true,
                showSymbol: false,
                lineStyle: { width: 3 },
                areaStyle: { opacity: 0.08 },
                emphasis: { focus: 'series' },
                data: statisticsTrendDays.value.map((day) => day.request_count),
            },
            { name: seriesNames.errors, type: 'line', smooth: true, showSymbol: false, lineStyle: { width: 2 }, emphasis: { focus: 'series' }, data: statisticsTrendDays.value.map((day) => day.error_count) },
            { name: seriesNames.logins, type: 'line', smooth: true, showSymbol: false, lineStyle: { width: 2 }, emphasis: { focus: 'series' }, data: statisticsTrendDays.value.map((day) => day.login_count) },
        ],
    })
    observeElement(trendChartRef.value)
}

const initResponseTimeChart = () => {
    if (!initChart || !responseTimeChartRef.value || !hasResponseTime.value) return
    const stats = responseTimeStats.value
    if (!stats) return
    responseTimeChart = initChart(responseTimeChartRef.value)
    const labels = stats.buckets.map((b) => localizeBucketLabel(b.label))
    const counts = stats.buckets.map((b) => b.count)
    const theme = chartTheme()
    responseTimeChart.setOption({
        color: [theme.primary],
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, ...chartTooltip() },
        grid: { left: '3%', right: '4%', bottom: '3%', ...gridWithAxisLabelBounds },
        xAxis: {
            type: 'category',
            data: labels,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: theme.muted, interval: 0, rotate: labels.length > 4 ? 20 : 0 },
        },
        yAxis: {
            type: 'value',
            name: t('home.dashboard.responseTime.count'),
            nameTextStyle: { color: theme.muted },
            axisLabel: { color: theme.muted },
            splitLine: { lineStyle: { color: theme.split, type: 'dashed' } },
        },
        series: [
            {
                name: t('home.dashboard.responseTime.count'),
                type: 'bar',
                barMaxWidth: 38,
                itemStyle: { borderRadius: [4, 4, 0, 0] },
                data: counts,
            },
        ],
    })
    observeElement(responseTimeChartRef.value)
}

const initErrorCodesChart = () => {
    if (!initChart || !errorCodesChartRef.value || !hasErrorCodes.value) return
    errorCodesChart = initChart(errorCodesChartRef.value)
    const data = errorCodeStats.value.map((item) => ({
        name: `${item.status_code}`,
        value: item.count,
    }))
    const theme = chartTheme()
    errorCodesChart.setOption({
        color: [theme.primary, theme.warning, theme.danger, theme.success],
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', ...chartTooltip() },
        legend: { type: 'scroll', orient: 'horizontal', bottom: 0, textStyle: { color: theme.text } },
        series: [
            {
                name: t('home.dashboard.errorCodes.title'),
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: true,
                itemStyle: { borderColor: theme.surface, borderWidth: 2, borderRadius: 4 },
                label: { show: true, color: theme.text, formatter: '{b}\n{c}' },
                data,
            },
        ],
    })
    observeElement(errorCodesChartRef.value)
}

const ensureEcharts = async () => {
    if (initChart) return
    const module = await import('@/modules/dashboard/echarts')
    initChart = module.initDashboardChart
}

onMounted(async () => {
    isMounted = true
    initResizeObserver()
    await ensureEcharts()
    if (!isMounted) return
    const canViewMonitor = hasPermission('dashboard:monitor')
    await Promise.all([refreshDashboard(), canViewMonitor ? fetchMonitor() : Promise.resolve()])
    if (!isMounted) return
    if (canViewMonitor) {
        monitorPolling.start()
    }
})

onUnmounted(() => {
    isMounted = false
    resizeObserver?.disconnect()
    resizeObserver = null
    trendChart?.dispose()
    responseTimeChart?.dispose()
    errorCodesChart?.dispose()
    monitorPolling.stop()
})

watch(
    () => settingStore.locale,
    async () => {
        if (isMounted) {
            await refreshDashboard()
        }
    }
)

watch(
    () => settingStore.theme,
    async () => {
        if (isMounted) await rebuildCharts()
    }
)
</script>

<style scoped lang="scss">
.dashboard-page {
    color: var(--el-text-color-primary);
}

.dashboard-row {
    margin-bottom: var(--xl-space-4);
}

@media (max-width: 1199px) {
    .responsive-column {
        margin-top: var(--xl-space-4);
    }
}

.personal-work-row {
    row-gap: var(--xl-space-4);
}

.workbench-column {
    display: flex;

    > :deep(.el-card) {
        width: 100%;
    }
}

.card-header,
.welcome-content,
.metric-main,
.metric-footer,
.health-title {
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.monitor-header-actions {
    display: flex;
    align-items: center;
    gap: var(--xl-space-2);
}

.welcome-card {
    height: 100%;
    overflow: hidden;
    background: linear-gradient(135deg, var(--el-bg-color) 50%, var(--el-color-primary-light-9));
}

.welcome-content {
    gap: 18px;

    > div:first-child {
        min-width: 0;
        flex: 1;
    }
}

.eyebrow {
    margin: 0 0 var(--xl-space-2);
    color: var(--el-color-primary);
    font-size: var(--xl-font-md);
    font-weight: 600;
}

h1 {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: 24px;
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: 0;
}

.welcome-desc {
    margin: 10px 0 var(--xl-space-4);
    color: var(--el-text-color-secondary);
    font-size: 14px;
    line-height: 1.7;
}

.login-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--xl-space-2);
}

.welcome-state {
    max-width: 560px;
    margin-top: var(--xl-space-4);
}

.section-heading {
    margin: calc(var(--xl-space-4) + var(--xl-space-1)) 0 var(--xl-space-3);

    h2 {
        margin: 0;
        font-size: var(--xl-font-lg);
        line-height: 1.5;
    }

    p {
        margin: var(--xl-space-1) 0 0;
        color: var(--el-text-color-secondary);
        font-size: var(--xl-font-sm);
    }
}

.metric-card {
    height: 100%;

    :deep(.el-card__body) {
        min-height: 104px;
    }
}

.metric-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
    font-size: 20px;

    &.is-blue {
        color: var(--el-color-primary);
    }

    &.is-green {
        color: var(--el-color-success);
    }

    &.is-orange {
        color: var(--el-color-warning);
    }
}

.metric-footer {
    margin-top: var(--xl-space-4);
    padding-top: var(--xl-space-3);
    border-top: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-md);
}

.shortcut-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--xl-space-2);
}

.shortcut-card {
    height: 100%;

    :deep(.el-card__header) {
        padding: var(--xl-space-3) var(--xl-space-4);
    }

    :deep(.el-card__body) {
        padding: var(--xl-space-3);
    }
}

.shortcut-btn {
    display: flex;
    align-items: center;
    gap: var(--xl-space-2);
    min-width: 0;
    height: 42px;
    margin: 0;
    padding: 0 var(--xl-space-2);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--xl-radius-sm);
    color: var(--el-text-color-regular);
    background: var(--el-bg-color);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition:
        border-color 0.2s,
        color 0.2s,
        background-color 0.2s;

    &:hover,
    &:focus-visible {
        outline: none;
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
        background: var(--el-color-primary-light-9);
    }
}

.shortcut-icon {
    display: inline-flex;
    flex: 0 0 auto;
    font-size: 16px;
}

.shortcut-arrow {
    flex: 0 0 auto;
    margin-left: auto;
    color: var(--el-text-color-placeholder);
}

.card-title {
    font-weight: 600;
}

.card-subtitle {
    margin-top: var(--xl-space-1);
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
}

.monitor-stat {
    text-align: center;
    padding: 16px 0;
}

.monitor-stat-label {
    font-size: 14px;
    color: var(--el-text-color-secondary);
    margin-bottom: 12px;
}

.monitor-stat-info {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 8px;
}

.monitor-load-grid {
    display: flex;
    justify-content: space-around;
    padding: 20px 0;
}

.monitor-load-item {
    text-align: center;
}

.monitor-load-value {
    font-size: 24px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.monitor-load-label {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-top: 4px;
}

.dashboard-table {
    width: 100%;
}

.stat-card {
    height: 100%;

    :deep(.el-card__header) {
        padding: var(--xl-space-3) 18px;
    }
}

.stat-card--primary {
    min-height: 390px;
}

.chart {
    width: 100%;
    height: 280px;
}

.chart--large {
    height: 300px;
}

.empty-state-card :deep(.el-card__body) {
    padding: var(--xl-space-4);
}

.card-header-extra {
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
}

.chart-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--xl-space-3);
}

.chart-card-title {
    display: flex;
    align-items: baseline;
    gap: var(--xl-space-2);
    min-width: 0;
}

.chart-toolbar {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--xl-space-2);
    min-width: 0;
}

.chart-toolbar__date {
    width: 230px;
}

.storage-block {
    display: flex;
    flex-direction: column;
    gap: var(--xl-space-4);
}

.storage-summary {
    display: flex;
    flex-wrap: wrap;
    gap: var(--xl-space-3);
}

.storage-summary-row {
    flex: 1;
    min-width: 130px;
    padding: 10px var(--xl-space-3);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-lighter);
    display: flex;
    flex-direction: column;
    gap: var(--xl-space-1);
}

.storage-summary-label {
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
}

.storage-summary-value {
    color: var(--el-text-color-primary);
    font-size: var(--xl-font-xl);
    font-weight: 600;
}

.storage-bytype-title {
    margin-bottom: var(--xl-space-2);
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-md);
}

.storage-bytype-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: var(--xl-space-2);

    &:last-child {
        margin-bottom: 0;
    }
}

.storage-bytype-label {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 110px;
    min-width: 0;
}

.storage-bytype-count {
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
}

.storage-bytype-bar {
    flex: 1;
    min-width: 60px;
}

.storage-bytype-size {
    flex: 0 0 auto;
    color: var(--el-text-color-regular);
    font-size: var(--xl-font-sm);
    min-width: 64px;
    text-align: right;
}

@media (max-width: 768px) {
    .welcome-content {
        align-items: flex-start;
        flex-direction: column;
    }

    .welcome-content .el-button {
        width: 100%;
    }

    .shortcut-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .card-header-extra {
        display: none;
    }

    .chart-card-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .chart-toolbar {
        flex-wrap: wrap;
        justify-content: flex-start;
        width: 100%;
    }

    .chart-toolbar__date {
        width: min(100%, 260px);
    }

    .monitor-load-grid {
        gap: var(--xl-space-2);
    }

    .monitor-load-value {
        font-size: 18px;
    }
}

@media (max-width: 480px) {
    .shortcut-grid {
        grid-template-columns: 1fr;
    }
}
</style>
