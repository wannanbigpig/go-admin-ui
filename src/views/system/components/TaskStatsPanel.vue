<template>
    <div class="task-stats-wrapper">
        <section class="xl-container xl-m-bottom-16 stats-page-heading">
            <div>
                <h2>{{ t('system.task.statsPageTitle') }}</h2>
                <p>{{ t('system.task.statsPageDescription') }}</p>
            </div>
            <div class="stats-page-heading__actions">
                <span class="stats-range-label">{{ selectedRangeLabel }}</span>
                <el-button :icon="Refresh" :loading="statsLoading" @click="handleStatsSearch">{{ t('system.task.refreshStats') }}</el-button>
            </div>
        </section>

        <div class="xl-container xl-m-bottom-16 search-panel">
            <el-form ref="statsQueryFormRef" class="xl-search-form" :model="statsQuery" @submit.prevent="handleStatsSearch" @keydown.enter.prevent="handleStatsSearch">
                <el-row id="taskStatsSearchForm" :gutter="16">
                    <el-col :xs="24" :sm="12" :md="6" :lg="5">
                        <el-form-item :label="t('system.task.code')" prop="task_code">
                            <el-input v-model.trim="statsQuery.task_code" :placeholder="t('system.task.codePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="6" :lg="4">
                        <el-form-item :label="t('system.task.kind')" prop="kind">
                            <el-select v-model="statsQuery.kind" clearable>
                                <el-option v-for="item in taskKindOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="6" :lg="4">
                        <el-form-item :label="t('system.task.source')" prop="source">
                            <el-select v-model="statsQuery.source" clearable>
                                <el-option v-for="item in taskSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :xs="24" :sm="12" :md="12" :lg="7">
                        <el-form-item :label="t('system.task.timeRange')" prop="statsDateRange">
                            <xl-date-range-picker v-model="statsDateRange" />
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="statsLoading" :maxShow="4" @search="handleStatsSearch" @reset="handleStatsReset" :modelRef="statsQueryFormRef" nodeName="#taskStatsSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <section class="xl-container xl-m-bottom-16 stats-overview-panel">
            <el-alert class="stats-truth-tip" :title="t('system.task.statsTruthTip')" type="info" show-icon :closable="false" />

            <div class="metric-grid">
                <article
                    v-for="item in summaryCards"
                    :key="item.key"
                    class="metric-card"
                    :class="[{ 'is-clickable': item.drilldownStatus }, `is-${item.tone}`]"
                    :role="item.drilldownStatus ? 'button' : undefined"
                    :tabindex="item.drilldownStatus ? 0 : undefined"
                    @click="openSummaryDetails(item.drilldownStatus)"
                    @keydown.enter.prevent="openSummaryDetails(item.drilldownStatus)"
                >
                    <div class="metric-card__topline">
                        <div class="metric-card__header-left">
                            <span class="metric-card__icon"
                                ><el-icon><component :is="item.icon" /></el-icon
                            ></span>
                            <span class="metric-card__label">{{ item.title }}</span>
                        </div>
                        <span v-if="item.drilldownStatus" class="metric-card__link">{{ t('system.task.viewDetails') }} <i-ep-arrow-right /></span>
                    </div>
                    <el-statistic class="metric-card__value" :value="item.value" :precision="item.precision" :suffix="item.suffix" />
                    <span class="metric-card__hint">{{ item.hint }}</span>
                </article>
            </div>
        </section>

        <section class="stats-main-grid xl-m-bottom-16">
            <div class="xl-container trend-panel">
                <header class="panel-heading">
                    <div>
                        <h3>{{ t('system.task.statsTrend') }}</h3>
                        <p>{{ t('system.task.statsTrendDescription') }}</p>
                    </div>
                    <span>{{ selectedRangeLabel }}</span>
                </header>

                <div class="efficiency-strip">
                    <div v-for="item in efficiencyMetrics" :key="item.key" class="efficiency-strip__item">
                        <span>{{ item.title }}</span>
                        <strong>{{ item.value }}</strong>
                    </div>
                </div>

                <el-skeleton v-if="statsLoading" animated :rows="8" />
                <div v-show="!statsLoading" ref="trendChartRef" class="task-trend-chart" />
            </div>

            <aside class="xl-container outcome-panel">
                <header class="panel-heading panel-heading--stacked">
                    <div>
                        <h3>{{ t('system.task.failureBreakdown') }}</h3>
                        <p>{{ t('system.task.drilldownTip') }}</p>
                    </div>
                </header>

                <div class="outcome-list">
                    <button
                        v-for="item in statusBreakdown"
                        :key="item.status"
                        :data-testid="`task-stats-${item.status}`"
                        type="button"
                        class="outcome-item"
                        :class="`is-${item.status}`"
                        :disabled="item.value === 0"
                        @click="openRunDetails(item.status)"
                    >
                        <span class="outcome-item__status" />
                        <span class="outcome-item__copy">
                            <strong>{{ item.title }}</strong>
                            <small>{{ item.percent.toFixed(1) }}%</small>
                        </span>
                        <span class="outcome-item__value">{{ item.value }}</span>
                        <i-ep-arrow-right />
                        <span class="outcome-item__track"><i :style="{ width: `${item.percent}%` }" /></span>
                    </button>
                </div>
            </aside>
        </section>

        <section class="xl-container trend-detail-panel">
            <el-collapse v-model="expandedSections">
                <el-collapse-item name="trend-table">
                    <template #title>
                        <div class="trend-detail-title">
                            <span>{{ t('system.task.trendDetailTitle') }}</span>
                            <small>{{ t('system.task.trendDetailDescription', { count: trendRows.length }) }}</small>
                        </div>
                    </template>
                    <xl-table-list :loading="statsLoading" :data="trendRows" :tableTitle="trendTableTitle">
                        <template #td="{ val }">
                            <span>{{ val ?? '-' }}</span>
                        </template>
                    </xl-table-list>
                </el-collapse-item>
            </el-collapse>
        </section>
    </div>
</template>

<script setup lang="ts">
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { DataLine, PieChart, Refresh, Select, Warning } from '@element-plus/icons-vue'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import { useDictOptions } from '@/composables/useDictOptions'
import type { DashboardChart } from '@/modules/dashboard/echarts'
import { createTaskRunStatsQuery } from '@/modules/system/model'
import { buildTaskRunDrilldownQuery, type TaskRunDrilldownStatus } from '@/modules/system/taskRunDrilldown'
import { SYSTEM_DICT_TYPES, taskKindFallbackOptions, taskSourceFallbackOptions } from '@/modules/system/dictOptions'
import { fetchTaskRunStats, fetchTaskRunStatsTrend } from '@/modules/system/service'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import { Logger } from '@/utils/logger'
import type { TableColumn } from '@/types/common'
import type { TaskRunStats, TaskRunStatsQuery, TaskRunTrendPoint } from '@/types/system'

const { t } = useI18n()
const router = useRouter()
const { options: taskKindOptions, load: loadTaskKindOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskKind, taskKindFallbackOptions)
const { options: taskSourceOptions, load: loadTaskSourceOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskSource, taskSourceFallbackOptions)

type StatsDateRange = [string, string] | [] | null
type MetricTone = 'primary' | 'success' | 'danger' | 'warning'

const taskStatsDefaultRangeDays = 7

const statsQueryFormRef = ref<FormInstance>()
const statsQuery = reactive(createTaskRunStatsQuery())
const statsDateRange = ref<StatsDateRange>(createDefaultStatsDateRange())
const statsLoading = ref(false)
const expandedSections = ref<string[]>([])
const statsSummary = ref<TaskRunStats>({
    detail_time_basis: 'finished_at',
    detail_start_time: '',
    detail_end_time: '',
    total_count: 0,
    success_count: 0,
    failed_count: 0,
    canceled_count: 0,
    timeout_count: 0,
    interrupted_count: 0,
    sampled_success_count: 0,
    duration_total_ms: 0,
    duration_max_ms: 0,
    duration_avg_ms: 0,
    success_rate: 0,
})
const trendRows = ref<TaskRunTrendPoint[]>([])
const trendChartRef = ref<HTMLElement | null>(null)
let trendChart: DashboardChart | null = null
let themeObserver: MutationObserver | undefined

function formatDateTime(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

function formatTrendWindowStart(row: TaskRunTrendPoint) {
    if (!row.window_start) return '-'
    if (row.window_size === 'day') return row.window_start.slice(0, 10)
    return row.window_start
}

function formatTrendWindowSize(row: TaskRunTrendPoint) {
    if (row.window_size === 'day') return t('system.task.windowSizeDay')
    if (row.window_size === 'hour') return t('system.task.windowSizeHour')
    return row.window_size || '-'
}

function createDefaultStatsDateRange(): [string, string] {
    const end = new Date()
    const start = new Date(end)
    start.setDate(start.getDate() - (taskStatsDefaultRangeDays - 1))
    start.setHours(0, 0, 0, 0)
    return [formatDateTime(start), formatDateTime(end)]
}

function isCompleteStatsDateRange(value: StatsDateRange): value is [string, string] {
    return Array.isArray(value) && value.length === 2 && Boolean(value[0]) && Boolean(value[1])
}

function ensureStatsDateRange(): [string, string] {
    if (!isCompleteStatsDateRange(statsDateRange.value)) {
        statsDateRange.value = createDefaultStatsDateRange()
    }
    return statsDateRange.value
}

const buildStatsParams = (): TaskRunStatsQuery => {
    const params: TaskRunStatsQuery = { ...statsQuery }
    applyDateRangeToQuery(params as Record<string, unknown>, ensureStatsDateRange())
    return params
}

const selectedRangeLabel = computed(() => {
    const range = ensureStatsDateRange()
    return `${range[0].slice(0, 10)} — ${range[1].slice(0, 10)}`
})

const summaryCards = computed<
    Array<{
        key: string
        title: string
        value: number
        precision: number
        suffix?: string
        icon: ReturnType<typeof markRaw>
        tone: MetricTone
        hint: string
        drilldownStatus?: TaskRunDrilldownStatus
    }>
>(() => [
    {
        key: 'total',
        title: t('system.task.totalCount'),
        value: statsSummary.value.total_count,
        precision: 0,
        icon: markRaw(DataLine),
        tone: 'primary',
        hint: selectedRangeLabel.value,
    },
    {
        key: 'success',
        title: t('system.task.successCount'),
        value: statsSummary.value.success_count,
        precision: 0,
        icon: markRaw(Select),
        tone: 'success',
        hint: t('system.task.sampledSuccessHint', { count: statsSummary.value.sampled_success_count }),
    },
    {
        key: 'failed',
        title: t('system.task.failedCount'),
        value: statsSummary.value.failed_count,
        precision: 0,
        icon: markRaw(Warning),
        tone: 'danger',
        hint: t('system.task.failedDrilldownHint'),
        drilldownStatus: 'failed',
    },
    {
        key: 'success_rate',
        title: t('system.task.successRate'),
        value: statsSummary.value.success_rate,
        precision: 1,
        suffix: '%',
        icon: markRaw(PieChart),
        tone: 'warning',
        hint: t('system.task.executionQuality'),
    },
])

const statusBreakdown = computed<Array<{ status: TaskRunDrilldownStatus; title: string; value: number; percent: number }>>(() => {
    const total = Math.max(statsSummary.value.total_count, 1)
    return [
        { status: 'failed', title: t('system.task.failedCount'), value: statsSummary.value.failed_count, percent: (statsSummary.value.failed_count / total) * 100 },
        { status: 'timeout', title: t('system.task.timeoutCount'), value: statsSummary.value.timeout_count, percent: (statsSummary.value.timeout_count / total) * 100 },
        { status: 'interrupted', title: t('system.task.interruptedCount'), value: statsSummary.value.interrupted_count, percent: (statsSummary.value.interrupted_count / total) * 100 },
        { status: 'canceled', title: t('system.task.canceledCount'), value: statsSummary.value.canceled_count, percent: (statsSummary.value.canceled_count / total) * 100 },
    ]
})

const formatDuration = (durationMs: number) => {
    const milliseconds = Math.max(0, Number(durationMs) || 0)
    if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`
    if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(milliseconds >= 10000 ? 1 : 2).replace(/\.0+$/, '')} s`
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.round((milliseconds % 60000) / 1000)
    return seconds ? `${minutes} min ${seconds} s` : `${minutes} min`
}

const efficiencyMetrics = computed(() => [
    { key: 'average', title: t('system.task.durationAvgMs'), value: formatDuration(statsSummary.value.duration_avg_ms) },
    { key: 'maximum', title: t('system.task.durationMaxMs'), value: formatDuration(statsSummary.value.duration_max_ms) },
    { key: 'details', title: t('system.task.sampledSuccessCount'), value: statsSummary.value.sampled_success_count },
])

const openRunDetails = (status: TaskRunDrilldownStatus) => {
    void router.push({ path: '/task/center', query: buildTaskRunDrilldownQuery(statsSummary.value, status) })
}

const openSummaryDetails = (status?: TaskRunDrilldownStatus) => {
    if (status) openRunDetails(status)
}

const trendTableTitle = computed(
    () =>
        [
            { prop: 'window_start', h_label: t('system.task.windowStart'), minWidth: 170, align: 'center', formatter: formatTrendWindowStart },
            { prop: 'window_size', h_label: t('system.task.windowSize'), minWidth: 100, align: 'center', formatter: formatTrendWindowSize },
            { prop: 'total_count', h_label: t('system.task.totalCount'), minWidth: 120, align: 'center' },
            { prop: 'success_count', h_label: t('system.task.successCount'), minWidth: 120, align: 'center' },
            { prop: 'failed_count', h_label: t('system.task.failedCount'), minWidth: 120, align: 'center' },
            { prop: 'canceled_count', h_label: t('system.task.canceledCount'), minWidth: 120, align: 'center' },
            { prop: 'timeout_count', h_label: t('system.task.timeoutCount'), minWidth: 120, align: 'center' },
            { prop: 'interrupted_count', h_label: t('system.task.interruptedCount'), minWidth: 130, align: 'center' },
            { prop: 'sampled_success_count', h_label: t('system.task.sampledSuccessCount'), minWidth: 150, align: 'center' },
            { prop: 'duration_max_ms', h_label: t('system.task.durationMaxMs'), minWidth: 130, align: 'center', formatter: (row) => formatDuration(row.duration_max_ms) },
        ] as TableColumn<TaskRunTrendPoint>[]
)

const chartColor = (variable: string, fallback: string) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim()
    return value || fallback
}

let initChart: ((el: HTMLElement) => DashboardChart) | null = null
const ensureEcharts = async () => {
    if (initChart) return
    const module = await import('@/modules/dashboard/echarts')
    initChart = module.initDashboardChart
}

const renderTrendChart = async () => {
    await nextTick()
    if (!trendChartRef.value) return
    if (!trendChart) {
        await ensureEcharts()
        if (!trendChartRef.value || !initChart) return
        trendChart = initChart(trendChartRef.value)
    }

    const textColor = chartColor('--el-text-color-secondary', '#909399')
    const primaryTextColor = chartColor('--el-text-color-primary', '#303133')
    const borderColor = chartColor('--el-border-color-lighter', '#ebeef5')
    const tooltipBackground = chartColor('--el-bg-color-overlay', '#ffffff')
    const chartBackground = chartColor('--el-bg-color', '#ffffff')
    const labels = trendRows.value.map(formatTrendWindowStart)

    trendChart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: tooltipBackground,
            borderColor,
            borderWidth: 1,
            textStyle: { color: primaryTextColor },
            padding: [10, 14],
            extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.12); border-radius: 8px;',
        },
        legend: { top: 0, right: 0, icon: 'circle', textStyle: { color: textColor } },
        grid: { left: 46, right: 18, top: 48, bottom: 36 },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: labels,
            axisLine: { lineStyle: { color: borderColor } },
            axisTick: { show: false },
            axisLabel: { color: textColor },
        },
        yAxis: {
            type: 'value',
            minInterval: 1,
            axisLine: { show: false },
            splitLine: { lineStyle: { type: 'dashed', color: borderColor } },
            axisLabel: { color: textColor },
        },
        series: [
            {
                name: t('system.task.totalCount'),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { width: 3, color: '#409eff' },
                itemStyle: { color: '#409eff', borderWidth: 2, borderColor: chartBackground },
                areaStyle: { color: 'rgba(64, 158, 255, 0.12)' },
                data: trendRows.value.map((item) => item.total_count),
            },
            {
                name: t('system.task.successCount'),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                lineStyle: { width: 2, color: '#67c23a' },
                itemStyle: { color: '#67c23a', borderWidth: 2, borderColor: chartBackground },
                data: trendRows.value.map((item) => item.success_count),
            },
            {
                name: t('system.task.failedOutcomeCount'),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 5,
                lineStyle: { width: 2, color: '#f56c6c' },
                itemStyle: { color: '#f56c6c', borderWidth: 2, borderColor: chartBackground },
                data: trendRows.value.map((item) => item.failed_count + item.timeout_count + item.interrupted_count),
            },
        ],
    })
}

const loadStats = async () => {
    try {
        statsLoading.value = true
        const params = buildStatsParams()
        const [summary, trend] = await Promise.all([fetchTaskRunStats(params), fetchTaskRunStatsTrend(params)])
        statsSummary.value = summary
        trendRows.value = trend
    } catch (error) {
        Logger.error('获取任务统计失败:', error)
    } finally {
        statsLoading.value = false
        await renderTrendChart()
    }
}

const handleStatsSearch = async () => {
    await loadStats()
}

const handleStatsReset = async () => {
    statsDateRange.value = createDefaultStatsDateRange()
    Object.assign(statsQuery, createTaskRunStatsQuery())
    statsQueryFormRef.value?.clearValidate()
    await loadStats()
}

let resizeTimer: ReturnType<typeof setTimeout> | null = null
const resizeChart = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
        trendChart?.resize()
        resizeTimer = null
    }, 150)
}

onMounted(async () => {
    await Promise.all([loadTaskKindOptions(), loadTaskSourceOptions()])
    await loadStats()
    window.addEventListener('resize', resizeChart)
    themeObserver = new MutationObserver(() => {
        void renderTrendChart()
    })
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] })
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart)
    if (resizeTimer) {
        clearTimeout(resizeTimer)
        resizeTimer = null
    }
    themeObserver?.disconnect()
    trendChart?.dispose()
    trendChart = null
})
</script>

<style scoped lang="scss">
.task-stats-wrapper {
    :deep(.el-form-item) {
        width: 100%;
    }
}

.stats-page-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;

    h2 {
        margin: 0;
        color: var(--el-text-color-primary);
        font-size: var(--xl-font-xl);
    }

    p {
        margin: 6px 0 0;
        color: var(--el-text-color-secondary);
        font-size: var(--xl-font-sm);
        line-height: 1.5;
    }
}

.stats-page-heading__actions {
    display: flex;
    align-items: center;
    flex: none;
    gap: 12px;
}

.stats-range-label {
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
}

.stats-overview-panel,
.trend-panel,
.outcome-panel,
.trend-detail-panel {
    border: 1px solid var(--el-border-color-lighter);
}

.stats-truth-tip {
    margin-bottom: 16px;
}

.metric-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px;
}

.metric-card {
    position: relative;
    min-width: 0;
    padding: 14px 16px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    color: var(--el-text-color-primary);
    background: var(--el-bg-color);
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease;

    &::after {
        position: absolute;
        right: -20px;
        bottom: -32px;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: var(--metric-soft-color);
        content: '';
        pointer-events: none;
    }

    &.is-primary {
        --metric-color: var(--el-color-primary);
        --metric-soft-color: var(--el-color-primary-light-9);
    }

    &.is-success {
        --metric-color: var(--el-color-success);
        --metric-soft-color: var(--el-color-success-light-9);
    }

    &.is-danger {
        --metric-color: var(--el-color-danger);
        --metric-soft-color: var(--el-color-danger-light-9);
    }

    &.is-warning {
        --metric-color: var(--el-color-warning);
        --metric-soft-color: var(--el-color-warning-light-9);
    }

    &.is-clickable {
        cursor: pointer;

        &:hover,
        &:focus-visible {
            border-color: var(--metric-color);
            background: var(--metric-soft-color);
            outline: none;
        }
    }
}

.metric-card__topline {
    position: relative;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
}

.metric-card__header-left {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
}

.metric-card__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 7px;
    color: var(--metric-color);
    background: var(--metric-soft-color);
    font-size: 15px;
    flex-shrink: 0;
}

.metric-card__link {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    color: var(--el-color-danger);
    font-size: 12px;
    flex-shrink: 0;
}

.metric-card__label,
.metric-card__hint {
    position: relative;
    z-index: 1;
    display: block;
}

.metric-card__label {
    margin-top: 0;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.metric-card__value {
    position: relative;
    z-index: 1;
    margin-top: 8px;

    :deep(.el-statistic__content) {
        color: var(--el-text-color-primary);
        font-size: 24px;
        font-weight: 700;
        line-height: 1.2;
    }
}

.metric-card__hint {
    margin-top: 4px;
    overflow: hidden;
    color: var(--el-text-color-placeholder);
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.stats-main-grid {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
    gap: 10px;
}

.trend-panel,
.outcome-panel {
    min-width: 0;
}

.panel-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;

    h3 {
        margin: 0;
        color: var(--el-text-color-primary);
        font-size: 16px;
    }

    p {
        margin: 5px 0 0;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.5;
    }

    > span {
        flex: none;
        color: var(--el-text-color-placeholder);
        font-size: 12px;
        font-variant-numeric: tabular-nums;
    }
}

.efficiency-strip {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 12px;
    padding: 12px 0;
    border-block: 1px solid var(--el-border-color-lighter);
}

.efficiency-strip__item {
    min-width: 0;
    padding: 0 16px;
    border-right: 1px solid var(--el-border-color-lighter);

    &:first-child {
        padding-left: 0;
    }

    &:last-child {
        border-right: 0;
    }

    span,
    strong {
        display: block;
    }

    span {
        color: var(--el-text-color-secondary);
        font-size: 12px;
    }

    strong {
        margin-top: 5px;
        color: var(--el-text-color-primary);
        font-size: 16px;
        font-variant-numeric: tabular-nums;
    }
}

.task-trend-chart {
    width: 100%;
    height: 320px;
}

.panel-heading--stacked {
    display: block;
}

.outcome-list {
    display: grid;
    gap: 10px;
}

.outcome-item {
    --outcome-color: var(--el-color-danger);

    position: relative;
    display: grid;
    grid-template-columns: 8px minmax(0, 1fr) auto 16px;
    align-items: center;
    gap: 10px;
    min-width: 0;
    padding: 14px 12px 18px;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 9px;
    color: var(--el-text-color-regular);
    background: var(--el-bg-color);
    font: inherit;
    text-align: left;
    cursor: pointer;

    &:hover:not(:disabled),
    &:focus-visible {
        border-color: var(--outcome-color);
        outline: none;
    }

    &:disabled {
        cursor: default;
        opacity: 0.55;
    }

    &.is-timeout {
        --outcome-color: var(--el-color-warning);
    }

    &.is-interrupted {
        --outcome-color: var(--el-color-primary);
    }

    &.is-canceled {
        --outcome-color: var(--el-text-color-secondary);
    }
}

.outcome-item__status {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--outcome-color);
}

.outcome-item__copy {
    min-width: 0;

    strong,
    small {
        display: block;
    }

    strong {
        overflow: hidden;
        color: var(--el-text-color-primary);
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    small {
        margin-top: 3px;
        color: var(--el-text-color-placeholder);
        font-size: 11px;
    }
}

.outcome-item__value {
    color: var(--outcome-color);
    font-size: 20px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
}

.outcome-item__track {
    position: absolute;
    right: 12px;
    bottom: 9px;
    left: 30px;
    height: 3px;
    overflow: hidden;
    border-radius: 2px;
    background: var(--el-fill-color);

    i {
        display: block;
        max-width: 100%;
        height: 100%;
        border-radius: inherit;
        background: var(--outcome-color);
    }
}

.trend-detail-panel {
    padding-block: 0;

    :deep(.el-collapse) {
        border-block: 0;
    }

    :deep(.el-collapse-item__header) {
        min-height: 58px;
        border-bottom-color: var(--el-border-color-lighter);
    }

    :deep(.el-collapse-item__wrap) {
        border-bottom: 0;
    }
}

.trend-detail-title {
    display: flex;
    align-items: baseline;
    gap: 10px;

    span {
        color: var(--el-text-color-primary);
        font-weight: 600;
    }

    small {
        color: var(--el-text-color-secondary);
        font-weight: 400;
    }
}

@media (max-width: 1100px) {
    .metric-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .stats-main-grid {
        grid-template-columns: 1fr;
    }

    .outcome-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 640px) {
    .stats-page-heading {
        align-items: flex-start;
        flex-direction: column;
    }

    .stats-page-heading__actions {
        justify-content: space-between;
        width: 100%;
    }

    .metric-grid,
    .outcome-list {
        grid-template-columns: 1fr;
    }

    .panel-heading {
        flex-direction: column;
    }

    .efficiency-strip__item {
        padding-inline: 10px;

        strong {
            font-size: 14px;
        }
    }

    .task-trend-chart {
        height: 280px;
    }

    .trend-detail-title {
        align-items: flex-start;
        flex-direction: column;
        gap: 2px;
        padding-block: 8px;
    }
}
</style>
