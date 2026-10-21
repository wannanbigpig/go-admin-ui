<template>
    <div class="monitor-container">
        <PageHeading :title="t('system.monitor.title')" :description="t('system.monitor.pageDescription')" />
        <!-- 主机信息卡片 -->
        <el-row :gutter="16" class="xl-m-bottom-16">
            <el-col :span="8">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>{{ t('system.monitor.cpu') }}</span>
                            <el-tag :type="getUsageTagType(data?.host?.cpu?.usage_percent || 0)" size="small"> {{ t('system.monitor.cpuCores', { cores: data?.host?.cpu?.cores || 0 }) }} </el-tag>
                        </div>
                    </template>
                    <div class="progress-wrapper">
                        <el-progress type="dashboard" :percentage="Math.round(data?.host?.cpu?.usage_percent || 0)" :color="getProgressColor(data?.host?.cpu?.usage_percent || 0)" :size="120" />
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>{{ t('system.monitor.memory') }}</span>
                            <el-tag size="small"> {{ formatBytes(data?.host?.memory?.used || 0) }} / {{ formatBytes(data?.host?.memory?.total || 0) }} </el-tag>
                        </div>
                    </template>
                    <div class="progress-wrapper">
                        <el-progress type="dashboard" :percentage="Math.round(data?.host?.memory?.usage_percent || 0)" :color="getProgressColor(data?.host?.memory?.usage_percent || 0)" :size="120" />
                    </div>
                </el-card>
            </el-col>
            <el-col :span="8">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>{{ t('system.monitor.disk') }}</span>
                            <el-tag size="small"> {{ formatBytes(data?.host?.disk?.used || 0) }} / {{ formatBytes(data?.host?.disk?.total || 0) }} </el-tag>
                        </div>
                    </template>
                    <div class="progress-wrapper">
                        <el-progress type="dashboard" :percentage="Math.round(data?.host?.disk?.usage_percent || 0)" :color="getProgressColor(data?.host?.disk?.usage_percent || 0)" :size="120" />
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <!-- 系统负载 -->
        <el-row :gutter="16" class="xl-m-bottom-16">
            <el-col :span="24">
                <el-card shadow="hover">
                    <template #header>
                        <span>{{ t('system.monitor.load') }}</span>
                    </template>
                    <el-row :gutter="16">
                        <el-col :span="8">
                            <div class="load-item">
                                <div class="load-label">{{ t('system.monitor.load1') }}</div>
                                <div class="load-value" :class="getLoadClass(data?.host?.load?.load1 || 0, data?.host?.cpu?.cores || 1)">
                                    {{ (data?.host?.load?.load1 || 0).toFixed(2) }}
                                </div>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="load-item">
                                <div class="load-label">{{ t('system.monitor.load5') }}</div>
                                <div class="load-value" :class="getLoadClass(data?.host?.load?.load5 || 0, data?.host?.cpu?.cores || 1)">
                                    {{ (data?.host?.load?.load5 || 0).toFixed(2) }}
                                </div>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="load-item">
                                <div class="load-label">{{ t('system.monitor.load15') }}</div>
                                <div class="load-value" :class="getLoadClass(data?.host?.load?.load15 || 0, data?.host?.cpu?.cores || 1)">
                                    {{ (data?.host?.load?.load15 || 0).toFixed(2) }}
                                </div>
                            </div>
                        </el-col>
                    </el-row>
                </el-card>
            </el-col>
        </el-row>

        <!-- 运行时信息 -->
        <el-row :gutter="16" class="xl-m-bottom-16">
            <el-col :xs="24" :md="12" class="monitor-info-column">
                <el-card shadow="hover">
                    <template #header>
                        <span>{{ t('system.monitor.goRuntime') }}</span>
                    </template>
                    <DetailGrid>
                        <DetailItem :label="t('system.monitor.goVersion')">{{ data?.runtime?.go_version || '-' }}</DetailItem>
                        <DetailItem :label="t('system.monitor.goroutines')">{{ data?.runtime?.goroutines || 0 }}</DetailItem>
                        <DetailItem :label="t('system.monitor.heapAlloc')">{{ formatBytes(data?.runtime?.heap_alloc || 0) }}</DetailItem>
                        <DetailItem :label="t('system.monitor.heapInuse')">{{ formatBytes(data?.runtime?.heap_inuse || 0) }}</DetailItem>
                        <DetailItem :label="t('system.monitor.heapSys')">{{ formatBytes(data?.runtime?.heap_sys || 0) }}</DetailItem>
                        <DetailItem :label="t('system.monitor.heapReleased')">{{ formatBytes(data?.runtime?.heap_released || 0) }}</DetailItem>
                        <DetailItem :label="t('system.monitor.gcCycles')">{{ data?.runtime?.gc_cycles || 0 }}</DetailItem>
                        <DetailItem :label="t('system.monitor.gcPauseTotal')">{{ formatDuration(data?.runtime?.gc_pause_total_ns || 0) }}</DetailItem>
                    </DetailGrid>
                </el-card>
            </el-col>
            <el-col :xs="24" :md="12" class="monitor-info-column">
                <el-card shadow="hover">
                    <template #header>
                        <span>{{ t('system.monitor.hostInfo') }}</span>
                    </template>
                    <DetailGrid>
                        <DetailItem :label="t('system.monitor.hostname')">{{ data?.host?.hostname || '-' }}</DetailItem>
                        <DetailItem :label="t('system.monitor.os')">{{ data?.host?.os || '-' }}</DetailItem>
                        <DetailItem :label="t('system.monitor.platform')">{{ data?.host?.platform || '-' }}</DetailItem>
                        <DetailItem :label="t('system.monitor.uptime')">{{ formatUptime(data?.host?.uptime || 0) }}</DetailItem>
                        <DetailItem :label="t('system.monitor.updateTime')" :span="2">{{ data?.host?.updated_at || '-' }}</DetailItem>
                    </DetailGrid>
                </el-card>
            </el-col>
        </el-row>

        <!-- 应用态 -->
        <el-row :gutter="16">
            <el-col :span="24">
                <el-card shadow="hover">
                    <template #header>
                        <span>{{ t('system.monitor.appStatus') }}</span>
                    </template>
                    <el-row :gutter="16">
                        <el-col :span="6">
                            <div class="stat-item">
                                <div class="stat-value">{{ data?.app?.online_sessions || 0 }}</div>
                                <div class="stat-label">{{ t('system.monitor.onlineSessions') }}</div>
                            </div>
                        </el-col>
                        <el-col :span="6">
                            <div class="stat-item">
                                <div class="stat-value">{{ data?.app?.ws_online || 0 }}</div>
                                <div class="stat-label">{{ t('system.monitor.wsOnline') }}</div>
                            </div>
                        </el-col>
                        <el-col :span="4">
                            <div class="stat-item">
                                <div class="stat-value warning">{{ data?.app?.queue_pending || 0 }}</div>
                                <div class="stat-label">{{ t('system.monitor.queuePending') }}</div>
                            </div>
                        </el-col>
                        <el-col :span="4">
                            <div class="stat-item">
                                <div class="stat-value warning">{{ data?.app?.queue_retrying || 0 }}</div>
                                <div class="stat-label">{{ t('system.monitor.queueRetrying') }}</div>
                            </div>
                        </el-col>
                        <el-col :span="4">
                            <div class="stat-item">
                                <div class="stat-value primary">{{ data?.app?.queue_running || 0 }}</div>
                                <div class="stat-label">{{ t('system.monitor.queueRunning') }}</div>
                            </div>
                        </el-col>
                    </el-row>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import PageHeading from '@/components/pageHeading/index.vue'
import DetailGrid from '@/components/detailGrid/index.vue'
import DetailItem from '@/components/detailGrid/DetailItem.vue'
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { getDashboardMonitor, type DashboardMonitor } from '@/api/dashboard'
import { subscribeChannel, unsubscribeChannel } from '@/stores/notification'
import { formatFileSize } from '@/utils/helper'

const { t } = useI18n()
const data = ref<DashboardMonitor | null>(null)
const loading = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

// 监控数据频道处理器
const handleMonitorData = (monitorData: unknown) => {
    if (monitorData && typeof monitorData === 'object') {
        data.value = monitorData as DashboardMonitor
    }
}

const fetchData = async () => {
    loading.value = true
    try {
        const res = await getDashboardMonitor()
        data.value = res
    } catch {
        // 获取监控数据失败
    } finally {
        loading.value = false
    }
}

onMounted(() => {
    fetchData()
    // 订阅 monitor 频道
    subscribeChannel('monitor', handleMonitorData)
    // 每 30 秒刷新一次（作为 WS 断开时的降级方案）
    timer = setInterval(fetchData, 30000)
})

onUnmounted(() => {
    // 退订 monitor 频道
    unsubscribeChannel('monitor', handleMonitorData)
    if (timer) {
        clearInterval(timer)
        timer = null
    }
})

const formatBytes = (bytes: number): string => {
    return formatFileSize(bytes)
}

const formatDuration = (ns: number): string => {
    if (ns === 0) return '0 ms'
    const ms = ns / 1000000
    if (ms < 1000) return ms.toFixed(2) + ' ms'
    const s = ms / 1000
    if (s < 60) return s.toFixed(2) + ' s'
    const m = s / 60
    return m.toFixed(2) + ' min'
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

const getUsageTagType = (percentage: number): '' | 'success' | 'warning' | 'danger' => {
    if (percentage >= 90) return 'danger'
    if (percentage >= 70) return 'warning'
    return 'success'
}

const getLoadClass = (load: number, cores: number): string => {
    const ratio = load / cores
    if (ratio >= 1) return 'danger'
    if (ratio >= 0.7) return 'warning'
    return 'success'
}
</script>

<style scoped lang="scss">
.monitor-info-column {
    margin-bottom: var(--xl-space-4);
}

.monitor-container {
    padding: 0;
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.progress-wrapper {
    display: flex;
    justify-content: center;
    padding: 16px 0;
}

.load-item {
    text-align: center;
    padding: 16px;

    .load-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-bottom: 8px;
    }

    .load-value {
        font-size: 32px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        &.success {
            color: var(--el-color-success);
        }

        &.warning {
            color: var(--el-color-warning);
        }

        &.danger {
            color: var(--el-color-danger);
        }
    }
}

.stat-item {
    text-align: center;
    padding: 16px;

    .stat-value {
        font-size: 36px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        &.warning {
            color: var(--el-color-warning);
        }

        &.primary {
            color: var(--el-color-primary);
        }
    }

    .stat-label {
        font-size: 14px;
        color: var(--el-text-color-secondary);
        margin-top: 8px;
    }
}
</style>
