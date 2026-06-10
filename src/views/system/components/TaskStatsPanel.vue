<template>
    <div class="task-stats-wrapper">
        <div class="xl-container xl-m-bottom-10 search-panel">
            <el-form ref="statsQueryFormRef" class="xl-search-form" :model="statsQuery" @submit.prevent="handleStatsSearch" @keydown.enter.prevent="handleStatsSearch">
                <el-row id="taskStatsSearchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item :label="t('system.task.code')" prop="task_code">
                            <el-input v-model.trim="statsQuery.task_code" :placeholder="t('system.task.codePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item :label="t('system.task.kind')" prop="kind">
                            <el-select v-model="statsQuery.kind" clearable>
                                <el-option v-for="item in taskKindOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item :label="t('system.task.source')" prop="source">
                            <el-select v-model="statsQuery.source" clearable>
                                <el-option v-for="item in taskSourceOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item :label="t('system.task.timeRange')" prop="statsDateRange">
                            <xl-date-range-picker v-model="statsDateRange" />
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="statsLoading" :maxShow="4" :onSearch="handleStatsSearch" :onReset="handleStatsReset" :modelRef="statsQueryFormRef" nodeName="#taskStatsSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container xl-m-bottom-10 stats-dashboard-panel">
            <el-alert class="xl-m-bottom-16" :title="t('system.task.statsTruthTip')" type="info" show-icon />

            <el-row :gutter="16">
                <el-col v-for="item in summaryCardsTop" :key="item.key" :xs="24" :sm="12" :lg="6">
                    <el-card shadow="hover" class="xl-stat-card premium-card">
                        <div class="stat-content">
                            <div class="stat-icon-wrapper" :style="{ backgroundColor: item.bgColor, color: item.color }">
                                <el-icon :size="24"><component :is="item.icon" /></el-icon>
                            </div>
                            <div class="stat-info">
                                <div class="stat-title">{{ item.title }}</div>
                                <div class="stat-value" :style="{ color: item.color }">
                                    <el-statistic :value="item.value" :precision="item.precision" :suffix="item.suffix" />
                                </div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>

            <el-row :gutter="16" class="xl-m-top-16">
                <el-col v-for="item in summaryCardsBottom" :key="item.key" :xs="24" :sm="12" :lg="6">
                    <el-card shadow="hover" class="xl-stat-card mini-card">
                        <div class="stat-content">
                            <div class="stat-icon-wrapper mini" :style="{ backgroundColor: item.bgColor, color: item.color }">
                                <el-icon :size="16"><component :is="item.icon" /></el-icon>
                            </div>
                            <div class="stat-info">
                                <div class="stat-title">{{ item.title }}</div>
                                <div class="stat-value">
                                    <el-statistic :value="item.value" :precision="item.precision" :suffix="item.suffix" value-style="font-size: 18px; font-weight: 600;" />
                                </div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>

            <div class="xl-m-top-16">
                <el-descriptions class="custom-descriptions" :column="2" border>
                    <el-descriptions-item :label="t('system.task.durationAvgMs')">{{ statsSummary.duration_avg_ms }}</el-descriptions-item>
                    <el-descriptions-item :label="t('system.task.durationMaxMs')">{{ statsSummary.duration_max_ms }}</el-descriptions-item>
                </el-descriptions>
            </div>
        </div>

        <div class="xl-container xl-m-bottom-10 chart-panel">
            <div class="task-stats-section-title">{{ t('system.task.statsTrend') }}</div>
            <el-skeleton v-if="statsLoading" animated :rows="8" />
            <div v-show="!statsLoading" ref="trendChartRef" class="task-trend-chart" />
        </div>

        <div class="xl-container table-panel">
            <xl-table-list :loading="statsLoading" :data="trendRows" :tableTitle="trendTableTitle">
                <template #td="{ val }">
                    <span>{{ val ?? '-' }}</span>
                </template>
            </xl-table-list>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, markRaw } from 'vue'
import { type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { DataLine, Select, CloseBold, PieChart, Remove, Warning, VideoPause, Filter } from '@element-plus/icons-vue'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import { useDictOptions } from '@/composables/useDictOptions'
import { initDashboardChart, type DashboardChart } from '@/modules/dashboard/echarts'
import { createTaskRunStatsQuery } from '@/modules/system/model'
import { SYSTEM_DICT_TYPES, taskKindFallbackOptions, taskSourceFallbackOptions } from '@/modules/system/dictOptions'
import { fetchTaskRunStats, fetchTaskRunStatsTrend } from '@/modules/system/service'
import { applyDateRangeToQuery } from '@/modules/log/helpers'
import { Logger } from '@/utils/logger'
import type { TableColumn } from '@/types/common'
import type { TaskRunStats, TaskRunStatsQuery, TaskRunTrendPoint } from '@/types/system'

const { t } = useI18n()
const { options: taskKindOptions, load: loadTaskKindOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskKind, taskKindFallbackOptions)
const { options: taskSourceOptions, load: loadTaskSourceOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskSource, taskSourceFallbackOptions)

type StatsDateRange = [string, string] | [] | null

const taskStatsDefaultRangeDays = 7

const statsQueryFormRef = ref<FormInstance>()
const statsQuery = reactive(createTaskRunStatsQuery())
const statsDateRange = ref<StatsDateRange>(createDefaultStatsDateRange())
const statsLoading = ref(false)
const statsSummary = ref<TaskRunStats>({
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

function formatDateTime(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
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
    const selectedDateRange = ensureStatsDateRange()
    applyDateRangeToQuery(params as Record<string, unknown>, selectedDateRange)
    return params
}

const summaryCardsTop = computed(() => [
    { key: 'total', title: t('system.task.totalCount'), value: statsSummary.value.total_count, precision: 0, icon: markRaw(DataLine), color: '#4a89dc', bgColor: '#f0f6fc' },
    { key: 'success', title: t('system.task.successCount'), value: statsSummary.value.success_count, precision: 0, icon: markRaw(Select), color: '#5da341', bgColor: '#f3faf0' },
    { key: 'failed', title: t('system.task.failedCount'), value: statsSummary.value.failed_count, precision: 0, icon: markRaw(CloseBold), color: '#d9534f', bgColor: '#fdf3f3' },
    { key: 'success_rate', title: t('system.task.successRate'), value: statsSummary.value.success_rate, precision: 1, suffix: '%', icon: markRaw(PieChart), color: '#d49635', bgColor: '#fcf7f1' },
])

const summaryCardsBottom = computed(() => [
    { key: 'canceled', title: t('system.task.canceledCount'), value: statsSummary.value.canceled_count, precision: 0, suffix: undefined, icon: markRaw(Remove), color: '#8d9095', bgColor: '#f6f6f7' },
    { key: 'timeout', title: t('system.task.timeoutCount'), value: statsSummary.value.timeout_count, precision: 0, suffix: undefined, icon: markRaw(Warning), color: '#d49635', bgColor: '#fcf7f1' },
    { key: 'interrupted', title: t('system.task.interruptedCount'), value: statsSummary.value.interrupted_count, precision: 0, suffix: undefined, icon: markRaw(VideoPause), color: '#d9534f', bgColor: '#fdf3f3' },
    { key: 'sampled', title: t('system.task.sampledSuccessCount'), value: statsSummary.value.sampled_success_count, precision: 0, suffix: undefined, icon: markRaw(Filter), color: '#4a89dc', bgColor: '#f0f6fc' },
])

const trendTableTitle = computed(
    () =>
        [
            { prop: 'window_start', h_label: t('system.task.windowStart'), minWidth: 170, align: 'center' },
            { prop: 'window_size', h_label: t('system.task.windowSize'), minWidth: 100, align: 'center' },
            { prop: 'total_count', h_label: t('system.task.totalCount'), minWidth: 120, align: 'center' },
            { prop: 'success_count', h_label: t('system.task.successCount'), minWidth: 120, align: 'center' },
            { prop: 'failed_count', h_label: t('system.task.failedCount'), minWidth: 120, align: 'center' },
            { prop: 'canceled_count', h_label: t('system.task.canceledCount'), minWidth: 120, align: 'center' },
            { prop: 'timeout_count', h_label: t('system.task.timeoutCount'), minWidth: 120, align: 'center' },
            { prop: 'interrupted_count', h_label: t('system.task.interruptedCount'), minWidth: 130, align: 'center' },
            { prop: 'sampled_success_count', h_label: t('system.task.sampledSuccessCount'), minWidth: 150, align: 'center' },
            { prop: 'duration_max_ms', h_label: t('system.task.durationMaxMs'), minWidth: 130, align: 'center' },
        ] as TableColumn<TaskRunTrendPoint>[]
)

const renderTrendChart = async () => {
    await nextTick()
    if (!trendChartRef.value) return
    if (!trendChart) {
        trendChart = initDashboardChart(trendChartRef.value)
    }
    const labels = trendRows.value.map((item) => item.window_start)
    trendChart.setOption({
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#ebeef5',
            borderWidth: 1,
            textStyle: { color: '#606266' },
            padding: [10, 15],
            extraCssText: 'box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;',
        },
        legend: { top: 0, icon: 'circle' },
        grid: { left: 50, right: 20, top: 50, bottom: 40 },
        xAxis: {
            type: 'category',
            data: labels,
            axisLine: { lineStyle: { color: '#DCDFE6' } },
            axisLabel: { color: '#909399' },
        },
        yAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed', color: '#EBEEF5' } },
            axisLabel: { color: '#909399' },
        },
        series: [
            {
                name: t('system.task.totalCount'),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { width: 3, color: '#409EFF' },
                itemStyle: { color: '#409EFF', borderWidth: 2, borderColor: '#fff' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(64,158,255,0.4)' },
                            { offset: 1, color: 'rgba(64,158,255,0)' },
                        ],
                    },
                },
                data: trendRows.value.map((item) => item.total_count),
            },
            {
                name: t('system.task.successCount'),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { width: 3, color: '#67C23A' },
                itemStyle: { color: '#67C23A', borderWidth: 2, borderColor: '#fff' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(103,194,58,0.4)' },
                            { offset: 1, color: 'rgba(103,194,58,0)' },
                        ],
                    },
                },
                data: trendRows.value.map((item) => item.success_count),
            },
            {
                name: t('system.task.failedOutcomeCount'),
                type: 'line',
                smooth: true,
                symbol: 'circle',
                symbolSize: 6,
                lineStyle: { width: 3, color: '#F56C6C' },
                itemStyle: { color: '#F56C6C', borderWidth: 2, borderColor: '#fff' },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(245,108,108,0.4)' },
                            { offset: 1, color: 'rgba(245,108,108,0)' },
                        ],
                    },
                },
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

const resizeChart = () => trendChart?.resize()

onMounted(async () => {
    await Promise.all([loadTaskKindOptions(), loadTaskSourceOptions()])
    await loadStats()
    window.addEventListener('resize', resizeChart)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', resizeChart)
    trendChart?.dispose()
    trendChart = null
})
</script>

<style scoped lang="scss">
.task-stats-wrapper {
    :deep(.el-form-item) {
        width: 100%;
    }

    .xl-m-top-16 {
        margin-top: 16px;
    }

    .xl-m-bottom-16 {
        margin-bottom: 16px;
    }

    .stats-dashboard-panel,
    .chart-panel,
    .table-panel {
        background-color: var(--el-bg-color);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.02);
        border: 1px solid var(--el-border-color-light);
    }

    /* 顶部高级卡片样式 */
    .premium-card {
        border-radius: 12px;
        border: none;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        background: linear-gradient(145deg, var(--el-bg-color), var(--el-bg-color-page));
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);

        &:hover {
            transform: translateY(-5px);
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);

            .stat-icon-wrapper {
                transform: scale(1.1) rotate(5deg);
            }
        }

        .stat-content {
            display: flex;
            align-items: center;
            padding: 10px 4px;
            gap: 16px;
        }

        .stat-icon-wrapper {
            width: 56px;
            height: 56px;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            transition: transform 0.3s ease;
        }

        .stat-info {
            flex: 1;
            overflow: hidden;
        }

        .stat-title {
            font-size: 14px;
            color: var(--el-text-color-secondary);
            margin-bottom: 4px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }

        .stat-value {
            font-size: 28px;
            font-weight: 700;
            line-height: 1.2;
        }

        :deep(.el-statistic__content) {
            font-size: inherit;
            font-weight: inherit;
            color: inherit;
        }
    }

    /* 底部次要卡片样式 */
    .mini-card {
        border-radius: 10px;
        border: 1px solid var(--el-border-color-lighter);
        transition: all 0.3s ease;
        box-shadow: none;

        &:hover {
            border-color: var(--el-color-primary-light-5);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            transform: translateY(-2px);
        }

        .stat-content {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 4px;
        }

        .stat-icon-wrapper.mini {
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        }

        .stat-info {
            flex: 1;
            overflow: hidden;
        }

        .stat-title {
            font-size: 13px;
            color: var(--el-text-color-regular);
            margin-bottom: 2px;
            white-space: nowrap;
            text-overflow: ellipsis;
            overflow: hidden;
        }

        .stat-value {
            color: var(--el-text-color-primary);
        }
    }

    /* 补充摘要面板 */
    .custom-descriptions {
        :deep(.el-descriptions__label) {
            background-color: var(--el-fill-color-light);
            color: var(--el-text-color-secondary);
            width: 130px;
        }

        :deep(.el-descriptions__content) {
            color: var(--el-text-color-primary);
            font-weight: 500;
        }
    }

    /* 趋势图区域 */
    .task-stats-section-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 16px;
        display: flex;
        align-items: center;

        &::before {
            content: '';
            display: inline-block;
            width: 4px;
            height: 16px;
            background-color: var(--el-color-primary);
            border-radius: 2px;
            margin-right: 8px;
        }
    }

    .task-trend-chart {
        height: 320px;
        width: 100%;
    }
}
</style>
