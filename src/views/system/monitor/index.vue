<template>
    <div class="monitor-container">
        <!-- 主机信息卡片 -->
        <el-row :gutter="16" class="xl-m-bottom-16">
            <el-col :span="8">
                <el-card shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>CPU</span>
                            <el-tag :type="getUsageTagType(data?.host?.cpu?.usage_percent || 0)" size="small"> {{ data?.host?.cpu?.cores || 0 }} 核心 </el-tag>
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
                            <span>内存</span>
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
                            <span>磁盘</span>
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
                        <span>系统负载</span>
                    </template>
                    <el-row :gutter="16">
                        <el-col :span="8">
                            <div class="load-item">
                                <div class="load-label">1 分钟</div>
                                <div class="load-value" :class="getLoadClass(data?.host?.load?.load1 || 0, data?.host?.cpu?.cores || 1)">
                                    {{ (data?.host?.load?.load1 || 0).toFixed(2) }}
                                </div>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="load-item">
                                <div class="load-label">5 分钟</div>
                                <div class="load-value" :class="getLoadClass(data?.host?.load?.load5 || 0, data?.host?.cpu?.cores || 1)">
                                    {{ (data?.host?.load?.load5 || 0).toFixed(2) }}
                                </div>
                            </div>
                        </el-col>
                        <el-col :span="8">
                            <div class="load-item">
                                <div class="load-label">15 分钟</div>
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
            <el-col :span="12">
                <el-card shadow="hover">
                    <template #header>
                        <span>Go 运行时</span>
                    </template>
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="Go 版本">{{ data?.runtime?.go_version || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="Goroutines">{{ data?.runtime?.goroutines || 0 }}</el-descriptions-item>
                        <el-descriptions-item label="堆内存分配">{{ formatBytes(data?.runtime?.heap_alloc || 0) }}</el-descriptions-item>
                        <el-descriptions-item label="堆内存使用">{{ formatBytes(data?.runtime?.heap_inuse || 0) }}</el-descriptions-item>
                        <el-descriptions-item label="堆内存系统">{{ formatBytes(data?.runtime?.heap_sys || 0) }}</el-descriptions-item>
                        <el-descriptions-item label="堆内存释放">{{ formatBytes(data?.runtime?.heap_released || 0) }}</el-descriptions-item>
                        <el-descriptions-item label="GC 次数">{{ data?.runtime?.gc_cycles || 0 }}</el-descriptions-item>
                        <el-descriptions-item label="GC 暂停总时间">{{ formatDuration(data?.runtime?.gc_pause_total_ns || 0) }}</el-descriptions-item>
                    </el-descriptions>
                </el-card>
            </el-col>
            <el-col :span="12">
                <el-card shadow="hover">
                    <template #header>
                        <span>主机信息</span>
                    </template>
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="主机名">{{ data?.host?.hostname || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="操作系统">{{ data?.host?.os || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="平台">{{ data?.host?.platform || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="运行时长">{{ formatUptime(data?.host?.uptime || 0) }}</el-descriptions-item>
                        <el-descriptions-item label="更新时间" :span="2">{{ data?.host?.updated_at || '-' }}</el-descriptions-item>
                    </el-descriptions>
                </el-card>
            </el-col>
        </el-row>

        <!-- 应用态 -->
        <el-row :gutter="16">
            <el-col :span="24">
                <el-card shadow="hover">
                    <template #header>
                        <span>应用状态</span>
                    </template>
                    <el-row :gutter="16">
                        <el-col :span="6">
                            <div class="stat-item">
                                <div class="stat-value">{{ data?.app?.online_sessions || 0 }}</div>
                                <div class="stat-label">在线会话</div>
                            </div>
                        </el-col>
                        <el-col :span="6">
                            <div class="stat-item">
                                <div class="stat-value">{{ data?.app?.ws_online || 0 }}</div>
                                <div class="stat-label">WS 连接</div>
                            </div>
                        </el-col>
                        <el-col :span="4">
                            <div class="stat-item">
                                <div class="stat-value warning">{{ data?.app?.queue_pending || 0 }}</div>
                                <div class="stat-label">队列待处理</div>
                            </div>
                        </el-col>
                        <el-col :span="4">
                            <div class="stat-item">
                                <div class="stat-value warning">{{ data?.app?.queue_retrying || 0 }}</div>
                                <div class="stat-label">队列重试中</div>
                            </div>
                        </el-col>
                        <el-col :span="4">
                            <div class="stat-item">
                                <div class="stat-value primary">{{ data?.app?.queue_running || 0 }}</div>
                                <div class="stat-label">队列执行中</div>
                            </div>
                        </el-col>
                    </el-row>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { getDashboardMonitor, type DashboardMonitor } from '@/api/dashboard'
import { subscribeChannel, unsubscribeChannel } from '@/stores/notification'

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
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
    if (days > 0) parts.push(`${days} 天`)
    if (hours > 0) parts.push(`${hours} 小时`)
    if (minutes > 0) parts.push(`${minutes} 分钟`)
    return parts.join(' ') || '刚启动'
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
        color: #909399;
        margin-bottom: 8px;
    }

    .load-value {
        font-size: 32px;
        font-weight: 600;

        &.success {
            color: #67c23a;
        }

        &.warning {
            color: #e6a23c;
        }

        &.danger {
            color: #f56c6c;
        }
    }
}

.stat-item {
    text-align: center;
    padding: 16px;

    .stat-value {
        font-size: 36px;
        font-weight: 600;
        color: #303133;

        &.warning {
            color: #e6a23c;
        }

        &.primary {
            color: #409eff;
        }
    }

    .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 8px;
    }
}
</style>
