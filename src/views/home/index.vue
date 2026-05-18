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
                        <el-button type="primary" :icon="RefreshRight" :loading="dashboardLoading" @click="refreshDashboard">
                            {{ t('home.dashboard.refresh') }}
                        </el-button>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16" class="dashboard-row">
            <el-col v-for="item in metricCards" :key="item.key" :xs="24" :sm="12" :lg="6">
                <el-card shadow="never" class="metric-card">
                    <div class="metric-main">
                        <div class="metric-icon" :class="item.tone">
                            <component :is="item.icon" />
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

        <el-row :gutter="16" class="dashboard-row">
            <el-col :span="24">
                <el-card shadow="never">
                    <template #header>
                        <div class="card-header">
                            <span>{{ t('home.dashboard.shortcuts') }}</span>
                        </div>
                    </template>
                    <div class="shortcut-grid">
                        <el-button v-for="item in shortcuts" :key="item.key" :icon="item.icon" plain class="shortcut-btn" @click="goShortcut(item.path)">
                            <span>{{ item.label }}</span>
                        </el-button>
                    </div>
                </el-card>
            </el-col>
        </el-row>

        <el-row :gutter="16" class="dashboard-row">
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
                    <el-empty v-else :description="t('home.dashboard.empty')" :image-size="90" />
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>

<script setup lang="ts">
import { CircleCheckFilled, DataAnalysis, Document, Lock, Menu as MenuIcon, RefreshRight, Setting, Tickets, User, UserFilled, WarningFilled } from '@element-plus/icons-vue'
import { computed, onMounted, ref, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { fetchDashboardOverview, type DashboardOverview } from '@/modules/dashboard/service'
import { useAuthStore } from '@/stores/auth'
import { Logger } from '@/utils/logger'

const { t } = useI18n()
const router = useRouter()

const username = ref('')
const loginTime = ref('')
const lastLoginIP = ref('')
const dashboardLoading = ref(false)
const dashboardOverview = ref<DashboardOverview | null>(null)

const metricMeta: Record<string, { icon: Component; tone: string; title: string }> = {
    users: { icon: UserFilled, tone: 'is-blue', title: t('home.dashboard.metrics.users') },
    requests: { icon: DataAnalysis, tone: 'is-green', title: t('home.dashboard.metrics.requests') },
    errors: { icon: WarningFilled, tone: 'is-orange', title: t('home.dashboard.metrics.errors') },
    tasks: { icon: CircleCheckFilled, tone: 'is-blue', title: t('home.dashboard.metrics.tasks') },
}

const metricCards = computed(() => {
    return (dashboardOverview.value?.metrics || [])
        .filter((item) => metricMeta[item.key])
        .map((item) => ({
            ...item,
            title: metricMeta[item.key].title,
            icon: metricMeta[item.key].icon,
            tone: metricMeta[item.key].tone,
            tagType: item.type || 'info',
        }))
})

const shortcuts = computed(() => [
    { key: 'users', label: t('home.dashboard.shortcut.users'), icon: User, path: '/permission/admin-user-list' },
    { key: 'roles', label: t('home.dashboard.shortcut.roles'), icon: Lock, path: '/permission/role-list' },
    { key: 'menus', label: t('home.dashboard.shortcut.menus'), icon: MenuIcon, path: '/permission/menu-list' },
    { key: 'logs', label: t('home.dashboard.shortcut.logs'), icon: Document, path: '/log/request-log' },
    { key: 'config', label: t('home.dashboard.shortcut.config'), icon: Setting, path: '/system/config' },
    { key: 'tasks', label: t('home.dashboard.shortcut.tasks'), icon: Tickets, path: '/task/center' },
    { key: 'profile', label: t('home.dashboard.shortcut.profile'), icon: UserFilled, path: '/profile' },
])

const activities = computed(() => dashboardOverview.value?.activities || [])

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
        dashboardOverview.value = await fetchDashboardOverview()
    } catch (error) {
        dashboardOverview.value = null
        Logger.warn('获取仪表盘概览失败', error)
    } finally {
        dashboardLoading.value = false
    }
    syncUserInfo()
}

const goShortcut = (path: string) => {
    router.push(path)
}

onMounted(refreshDashboard)
</script>

<style scoped lang="scss">
.dashboard-page {
    color: var(--el-text-color-primary);
}

.dashboard-row {
    margin-bottom: 16px;
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
    margin: 0 0 8px;
    color: var(--el-color-primary);
    font-size: 13px;
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
    margin: 10px 0 16px;
    color: var(--el-text-color-secondary);
    font-size: 14px;
    line-height: 1.7;
}

.login-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
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
    margin-top: 16px;
    padding-top: 12px;
    border-top: 1px solid var(--el-border-color-lighter);
    color: var(--el-text-color-secondary);
    font-size: 13px;
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
    padding: 4px 4px 0;
}

.activity-title {
    color: var(--el-text-color-primary);
    font-size: 14px;
    font-weight: 600;
}

.activity-desc {
    margin-top: 4px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.5;
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
