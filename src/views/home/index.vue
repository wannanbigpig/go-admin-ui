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
                        </div>
                        <el-button v-permission:or="['dashboard:overview', 'dashboard:statistics']" type="primary" :loading="dashboardLoading" @click="refreshDashboard">
                            <template #icon>
                                <i-ep-refresh-right />
                            </template>
                            {{ t('home.dashboard.refresh') }}
                        </el-button>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row v-if="hasPermission('dashboard:overview')" :gutter="16" class="dashboard-row">
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
        </el-row>

        <el-row v-if="hasPermission('dashboard:statistics') && dashboardStatistics?.trend.days.length" :gutter="16" class="dashboard-row">
            <el-col :span="24">
                <el-card shadow="never">
                    <template #header>
                        <span>{{ t('home.dashboard.trend.title') }}</span>
                    </template>
                    <div ref="trendChartRef" style="height: 300px"></div>
                </el-card>
            </el-col>
        </el-row>

        <el-row v-if="hasPermission('dashboard:statistics') && hasAdvancedStats" :gutter="16" class="dashboard-row">
            <el-col :xs="24" :md="12" :lg="8">
                <el-card shadow="never" class="stat-card">
                    <template #header>
                        <div class="card-header">
                            <span>{{ t('home.dashboard.responseTime.title') }}</span>
                            <span v-if="responseTimeAvgText" class="card-header-extra">{{ responseTimeAvgText }}</span>
                        </div>
                    </template>
                    <div v-if="hasResponseTime" ref="responseTimeChartRef" style="height: 280px"></div>
                    <el-empty v-else :description="t('home.dashboard.responseTime.empty')">
                        <template #image>
                            <el-icon size="60" color="var(--el-text-color-placeholder)">
                                <i-lucide-activity />
                            </el-icon>
                        </template>
                    </el-empty>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="12" :lg="8">
                <el-card shadow="never" class="stat-card">
                    <template #header>
                        <span>{{ t('home.dashboard.errorCodes.title') }}</span>
                    </template>
                    <div v-if="hasErrorCodes" ref="errorCodesChartRef" style="height: 280px"></div>
                    <el-empty v-else :description="t('home.dashboard.errorCodes.empty')">
                        <template #image>
                            <el-icon size="60" color="var(--el-text-color-placeholder)">
                                <i-lucide-server-crash />
                            </el-icon>
                        </template>
                    </el-empty>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="24" :lg="8">
                <el-card shadow="never" class="stat-card">
                    <template #header>
                        <span>{{ t('home.dashboard.storage.title') }}</span>
                    </template>
                    <div v-if="hasStorage" class="storage-block">
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
                    <el-empty v-else :description="t('home.dashboard.storage.empty')">
                        <template #image>
                            <el-icon size="60" color="var(--el-text-color-placeholder)">
                                <i-lucide-hard-drive />
                            </el-icon>
                        </template>
                    </el-empty>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16" class="dashboard-row">
            <el-col :span="24">
                <el-card shadow="never">
                    <template #header>
                        <div class="card-header">
                            <span>{{ t('home.dashboard.shortcuts') }}</span>
                        </div>
                    </template>
                    <div class="shortcut-grid">
                        <el-button v-for="item in shortcuts" :key="item.key" plain class="shortcut-btn" @click="goShortcut(item.path)">
                            <template #icon>
                                <i-ep-user v-if="item.key === 'users'" />
                                <i-ep-lock v-else-if="item.key === 'roles'" />
                                <i-ep-menu v-else-if="item.key === 'menus'" />
                                <i-ep-document v-else-if="item.key === 'logs'" />
                                <i-ep-setting v-else-if="item.key === 'config'" />
                                <i-ep-tickets v-else-if="item.key === 'tasks'" />
                                <i-ep-user-filled v-else-if="item.key === 'profile'" />
                            </template>
                            <span>{{ item.label }}</span>
                        </el-button>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row v-if="hasPermission('dashboard:overview')" :gutter="16" class="dashboard-row">
            <el-col :span="24">
                <el-card shadow="never">
                    <template #header>
                        <div class="card-header">
                            <span>{{ t('home.dashboard.activityTitle') }}</span>
                        </div>
                    </template>
                    <el-timeline v-if="activities.length > 0" class="activity-timeline">
                        <el-timeline-item v-for="item in activities" :key="item.key" :timestamp="item.time" :type="item.type">
                            <div class="activity-title">{{ item.title }}</div>
                            <div class="activity-desc">{{ item.desc }}</div>
                        </el-timeline-item>
                    </el-timeline>
                    <el-empty v-else :description="t('home.dashboard.empty')">
                        <template #image>
                            <el-icon size="60" color="var(--el-text-color-placeholder)">
                                <i-lucide-inbox />
                            </el-icon>
                        </template>
                    </el-empty>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { fetchDashboardOverview, fetchDashboardStatistics, type DashboardOverview, type DashboardStatistics } from '@/modules/dashboard/service'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/auth'
import { formatFileSize } from '@/utils/helper'
import { Logger } from '@/utils/logger'

// 异步加载的 ECharts 命名空间（在 onMounted 中初始化）
type EChartsNamespace = typeof import('echarts/core')
type EChartsInstance = ReturnType<EChartsNamespace['init']>
let echarts: EChartsNamespace | null = null

const { t } = useI18n()
const router = useRouter()

const username = ref('')
const loginTime = ref('')
const lastLoginIP = ref('')
const dashboardLoading = ref(false)
const dashboardOverview = ref<DashboardOverview | null>(null)
const dashboardStatistics = ref<DashboardStatistics | null>(null)
const trendChartRef = ref<HTMLDivElement>()
const responseTimeChartRef = ref<HTMLDivElement>()
const errorCodesChartRef = ref<HTMLDivElement>()
let trendChart: EChartsInstance | null = null
let responseTimeChart: EChartsInstance | null = null
let errorCodesChart: EChartsInstance | null = null

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

const shortcuts = computed(() => [
    { key: 'users', label: t('home.dashboard.shortcut.users'), path: '/permission/admin-user-list' },
    { key: 'roles', label: t('home.dashboard.shortcut.roles'), path: '/permission/role-list' },
    { key: 'menus', label: t('home.dashboard.shortcut.menus'), path: '/permission/menu-list' },
    { key: 'logs', label: t('home.dashboard.shortcut.logs'), path: '/log/request-log' },
    { key: 'config', label: t('home.dashboard.shortcut.config'), path: '/system/config' },
    { key: 'tasks', label: t('home.dashboard.shortcut.tasks'), path: '/task/center' },
    { key: 'profile', label: t('home.dashboard.shortcut.profile'), path: '/profile' },
])

const activities = computed(() => dashboardOverview.value?.activities || [])
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
const hasAdvancedStats = computed(() => hasResponseTime.value || hasErrorCodes.value || hasStorage.value || !!responseTimeStats.value || !!storageStats.value || errorCodeStats.value.length > 0)

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

const toDisplayText = (value: unknown, fallback: string) => {
    return typeof value === 'string' && value.trim() ? value : fallback
}

const resolveLoginTime = (value: unknown) => {
    const fallback = loginTime.value || new Date().toLocaleString()
    return toDisplayText(value, fallback)
}

const syncUserInfo = () => {
    const authStore = useAuthStore()
    const userInfo = authStore.userInfo || {}

    username.value = toDisplayText(userInfo.nickname, toDisplayText(userInfo.username, t('home.unknownUser')))
    loginTime.value = resolveLoginTime(dashboardOverview.value?.user_login?.last_login || userInfo.last_login)
    lastLoginIP.value = toDisplayText(dashboardOverview.value?.user_login?.last_ip || userInfo.last_ip, t('home.unknown'))
}

const refreshDashboard = async () => {
    dashboardLoading.value = true
    try {
        const canViewOverview = hasPermission('dashboard:overview')
        const canViewStatistics = hasPermission('dashboard:statistics')

        const overviewPromise = canViewOverview ? fetchDashboardOverview() : Promise.reject(new Error('No overview permission'))

        const statisticsPromise = canViewStatistics ? fetchDashboardStatistics() : Promise.reject(new Error('No statistics permission'))

        const [overviewResult, statisticsResult] = await Promise.allSettled([overviewPromise, statisticsPromise])

        if (canViewOverview && overviewResult.status === 'fulfilled') {
            dashboardOverview.value = overviewResult.value
        } else {
            dashboardOverview.value = null
            if (canViewOverview && overviewResult.status === 'rejected') {
                Logger.warn('获取仪表盘概览失败', overviewResult.reason)
            }
        }

        if (canViewStatistics && statisticsResult.status === 'fulfilled') {
            dashboardStatistics.value = statisticsResult.value
        } else {
            dashboardStatistics.value = null
            if (canViewStatistics && statisticsResult.status === 'rejected') {
                Logger.warn('获取仪表盘统计失败', statisticsResult.reason)
            }
        }
    } catch (error) {
        dashboardOverview.value = null
        dashboardStatistics.value = null
        Logger.warn('获取仪表盘数据失败', error)
    } finally {
        dashboardLoading.value = false
    }
    syncUserInfo()
    trendChart?.dispose()
    trendChart = null
    responseTimeChart?.dispose()
    responseTimeChart = null
    errorCodesChart?.dispose()
    errorCodesChart = null
    await nextTick()
    initTrendChart()
    initResponseTimeChart()
    initErrorCodesChart()
}

const goShortcut = (path: string) => {
    router.push(path)
}

const gridWithAxisLabelBounds = {
    outerBoundsMode: 'same' as const,
    outerBoundsContain: 'axisLabel' as const,
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
    if (!echarts || !trendChartRef.value || statisticsTrendDays.value.length === 0) return
    trendChart = echarts.init(trendChartRef.value)
    const seriesNames = trendSeriesNames.value
    trendChart.setOption({
        tooltip: { trigger: 'axis' },
        legend: {
            data: [seriesNames.requests, seriesNames.errors, seriesNames.logins],
            top: 0,
        },
        grid: { top: 40, left: '3%', right: '4%', bottom: '3%', ...gridWithAxisLabelBounds },
        xAxis: { type: 'category', boundaryGap: false, data: statisticsTrendDays.value.map((day) => day.date) },
        yAxis: { type: 'value' },
        series: [
            { name: seriesNames.requests, type: 'line', smooth: true, data: statisticsTrendDays.value.map((day) => day.request_count) },
            { name: seriesNames.errors, type: 'line', smooth: true, data: statisticsTrendDays.value.map((day) => day.error_count) },
            { name: seriesNames.logins, type: 'line', smooth: true, data: statisticsTrendDays.value.map((day) => day.login_count) },
        ],
    })
    observeElement(trendChartRef.value)
}

const initResponseTimeChart = () => {
    if (!echarts || !responseTimeChartRef.value || !hasResponseTime.value) return
    const stats = responseTimeStats.value
    if (!stats) return
    responseTimeChart = echarts.init(responseTimeChartRef.value)
    const labels = stats.buckets.map((b) => localizeBucketLabel(b.label))
    const counts = stats.buckets.map((b) => b.count)
    responseTimeChart.setOption({
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '3%', ...gridWithAxisLabelBounds },
        xAxis: { type: 'category', data: labels, axisLabel: { interval: 0, rotate: labels.length > 4 ? 20 : 0 } },
        yAxis: { type: 'value', name: t('home.dashboard.responseTime.count') },
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
    if (!echarts || !errorCodesChartRef.value || !hasErrorCodes.value) return
    errorCodesChart = echarts.init(errorCodesChartRef.value)
    const data = errorCodeStats.value.map((item) => ({
        name: `${item.status_code}`,
        value: item.count,
    }))
    errorCodesChart.setOption({
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { type: 'scroll', orient: 'horizontal', bottom: 0 },
        series: [
            {
                name: t('home.dashboard.errorCodes.title'),
                type: 'pie',
                radius: ['45%', '70%'],
                center: ['50%', '45%'],
                avoidLabelOverlap: true,
                label: { show: true, formatter: '{b}\n{c}' },
                data,
            },
        ],
    })
    observeElement(errorCodesChartRef.value)
}

const ensureEcharts = async () => {
    if (echarts) return
    const [core, charts, components, renderers] = await Promise.all([import('echarts/core'), import('echarts/charts'), import('echarts/components'), import('echarts/renderers')])
    core.use([charts.BarChart, charts.LineChart, charts.PieChart, components.GridComponent, components.LegendComponent, components.TooltipComponent, renderers.CanvasRenderer])
    echarts = core
}

onMounted(async () => {
    initResizeObserver()
    await ensureEcharts()
    await refreshDashboard()
})

onUnmounted(() => {
    resizeObserver?.disconnect()
    resizeObserver = null
    trendChart?.dispose()
    responseTimeChart?.dispose()
    errorCodesChart?.dispose()
})
</script>

<style scoped lang="scss">
.dashboard-page {
    color: var(--el-text-color-primary);
}

.dashboard-row {
    margin-bottom: var(--xl-space-4);
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

.welcome-card {
    height: 100%;
}

.welcome-content {
    gap: 18px;
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

.metric-card {
    height: 100%;
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
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 10px;
}

.shortcut-btn {
    justify-content: flex-start;
    height: 44px;
    margin: 0;
}

.dashboard-table {
    width: 100%;
}

.activity-timeline {
    min-height: 292px;
    padding: var(--xl-space-1) var(--xl-space-1) 0;
}

.activity-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
}

.activity-desc {
    margin-top: var(--xl-space-1);
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-md);
    line-height: 1.5;
}

.stat-card {
    height: 100%;

    :deep(.el-card__header) {
        padding: var(--xl-space-3) 18px;
    }
}

.card-header-extra {
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
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
        grid-template-columns: 1fr;
    }
}
</style>
