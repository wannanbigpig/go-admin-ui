<template>
    <div class="notification-center-page">
        <!-- 顶部搜索表单 -->
        <div class="xl-container xl-m-bottom-10">
            <el-form ref="queryFormRef" class="xl-search-form" :model="queryParams" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="notificationSearchForm" :gutter="20">
                    <el-col :span="5">
                        <el-form-item :label="t('system.notification.category')" prop="category">
                            <el-select v-model="queryParams.category" clearable :placeholder="t('system.notification.selectCategory')">
                                <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item :label="t('system.notification.readStatus')" prop="is_read">
                            <el-select v-model="queryParams.is_read" clearable :placeholder="t('system.notification.selectReadStatus')">
                                <el-option v-for="item in readStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="2" :onSearch="handleSearch" :onReset="handleReset" :modelRef="queryFormRef" nodeName="#notificationSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <!-- 主体区域：双栏布局 -->
        <div class="xl-container notification-layout">
            <!-- 头部标题与全局操作 -->
            <div class="notification-layout__header">
                <div class="header-left">
                    <h2 class="page-title">{{ t('system.notification.title') }}</h2>
                    <p class="page-subtitle">{{ t('system.notification.listHint') }}</p>
                </div>
                <div class="header-actions">
                    <el-button type="primary" link size="default" :disabled="!hasUnread" @click="handleMarkAllRead">
                        <template #icon><i-ep-check /></template>
                        {{ t('layout.notification.markAllRead') }}
                    </el-button>
                    <el-button type="primary" link size="default" @click="handleOpenManagePage">
                        <template #icon><i-ep-setting /></template>
                        {{ t('system.notification.manageEntry') }}
                    </el-button>
                </div>
            </div>

            <!-- 主内容体 -->
            <div class="notification-layout__content">
                <!-- 左栏：消息列表 -->
                <div class="notification-list-sidebar">
                    <div v-if="loading && list.length === 0" class="sidebar-loading">
                        <el-skeleton animated :rows="5" />
                    </div>
                    <div v-else-if="hasError" class="sidebar-error">
                        <el-empty :description="t('common.i18n.loadFailed')" :image-size="64">
                            <el-button type="primary" size="small" @click="fetchList">{{ t('common.actions.retry') }}</el-button>
                        </el-empty>
                    </div>
                    <div v-else-if="list.length === 0" class="sidebar-empty">
                        <el-empty :description="t('layout.notification.empty')" :image-size="64" />
                    </div>
                    <el-scrollbar v-else class="sidebar-scroll">
                        <div
                            v-for="item in list"
                            :key="item.id"
                            class="notification-item"
                            :class="{
                                'is-unread': !item.read,
                                'is-active': selectedNotification?.id === item.id,
                            }"
                            @click="selectNotification(item)"
                        >
                            <div class="item-badge-dot" v-if="!item.read" />
                            <div class="item-main">
                                <div class="item-top">
                                    <el-tag size="small" class="item-tag" effect="flat" :type="getCategoryTagType(item.category)">
                                        {{ getCategoryLabel(item.category) }}
                                    </el-tag>
                                    <span class="item-time">{{ formatTimeAgo(item.created_at) }}</span>
                                </div>
                                <h4 class="item-title" :title="item.title">{{ item.title }}</h4>
                                <p class="item-summary">{{ getSummaryText(item) }}</p>
                            </div>
                        </div>
                    </el-scrollbar>

                    <!-- 分页部分嵌套在左栏底部 -->
                    <div class="sidebar-pagination" v-if="total > 0">
                        <el-pagination
                            v-model:current-page="queryParams.page"
                            v-model:page-size="queryParams.per_page"
                            :total="total"
                            :pager-count="3"
                            layout="prev, pager, next"
                            small
                            @current-change="handlePageChange"
                        />
                    </div>
                </div>

                <!-- 右栏：消息详情 -->
                <div class="notification-detail-container">
                    <div v-if="!selectedNotification" class="detail-empty">
                        <el-empty :description="t('system.notification.selectToView')">
                            <template #image>
                                <el-icon size="64" color="var(--el-text-color-placeholder)">
                                    <i-lucide-mail-open />
                                </el-icon>
                            </template>
                        </el-empty>
                    </div>
                    <div v-else class="detail-content">
                        <div class="detail-header">
                            <div class="detail-meta">
                                <el-tag size="default" effect="plain" :type="getCategoryTagType(selectedNotification.category)">
                                    {{ getCategoryLabel(selectedNotification.category) }}
                                </el-tag>
                                <span class="detail-time">
                                    <el-icon><i-ep-clock /></el-icon>
                                    {{ formatDateTime(selectedNotification.created_at) }}
                                </span>
                                <el-button v-if="!selectedNotification.read" type="primary" plain size="small" class="mark-read-btn" @click="handleMarkRead(selectedNotification)">{{
                                    t('system.notification.markRead')
                                }}</el-button>
                            </div>
                            <h2 class="detail-title">{{ selectedNotification.title }}</h2>
                        </div>

                        <el-scrollbar class="detail-body-scroll">
                            <div class="detail-body">
                                {{ selectedNotification.message || selectedNotification.title }}
                            </div>
                        </el-scrollbar>

                        <!-- 附加动作按钮 -->
                        <div v-if="selectedNotification.action_url" class="detail-footer">
                            <el-button type="primary" size="default" class="action-btn" @click="handleActionClick(selectedNotification)">
                                {{ selectedNotification.action_label || t('system.notification.goHandle') }}
                                <el-icon class="el-icon--right"><i-ep-arrow-right /></el-icon>
                            </el-button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 移动端适配：抽屉详情展示 -->
        <el-drawer v-model="drawerVisible" direction="rtl" size="85%" :with-header="false" class="notification-mobile-drawer">
            <div v-if="selectedNotification" class="detail-content mobile-detail">
                <div class="drawer-close-btn" role="button" tabindex="0" aria-label="Close" @click="drawerVisible = false" @keydown.enter="drawerVisible = false">
                    <el-icon size="20"><i-ep-close /></el-icon>
                </div>

                <div class="detail-header">
                    <div class="detail-meta">
                        <el-tag size="small" effect="plain" :type="getCategoryTagType(selectedNotification.category)">
                            {{ getCategoryLabel(selectedNotification.category) }}
                        </el-tag>
                        <span class="detail-time">{{ formatDateTime(selectedNotification.created_at) }}</span>
                    </div>
                    <h3 class="detail-title">{{ selectedNotification.title }}</h3>
                </div>

                <div class="detail-body">
                    {{ selectedNotification.message || selectedNotification.title }}
                </div>

                <div class="detail-footer-actions">
                    <el-button v-if="!selectedNotification.read" type="primary" plain size="default" @click="handleMarkRead(selectedNotification)">{{ t('system.notification.markRead') }}</el-button>
                    <el-button v-if="selectedNotification.action_url" type="primary" size="default" @click="handleActionClick(selectedNotification)">
                        {{ selectedNotification.action_label || t('system.notification.goHandle') }}
                    </el-button>
                </div>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance } from 'element-plus'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import { useNotificationStore, normalizeNotification } from '@/stores/notification'
import { getNotificationList } from '@/api/system'
import { normalizeListData } from '@/modules/shared/response'
import { translate } from '@/locales'
import { Logger } from '@/utils/logger'
import router from '@/router'
import type { AppNotification } from '@/types/notification'
import { useNotificationCategoryOptions } from './notificationConstants'
import { normalizeNotificationActionUrl } from '@/utils/notificationAction'

const { t } = useI18n()
const notificationStore = useNotificationStore()

const queryFormRef = ref<FormInstance>()
const loading = ref(false)
const hasError = ref(false)
const list = ref<AppNotification[]>([])
const total = ref(0)

// 响应式数据
const selectedNotification = ref<AppNotification | null>(null)
const drawerVisible = ref(false)

const queryParams = reactive({
    category: '',
    is_read: undefined as number | undefined,
    page: 1,
    per_page: 15,
})

const pagination = reactive({
    page: 1,
    pageSize: 15,
    total: 0,
})

const hasUnread = computed(() => list.value.some((item) => !item.read))

const categoryOptions = useNotificationCategoryOptions()

const readStatusOptions = computed(() => [
    { value: 0, label: t('system.notification.readStatusOptions.unread') },
    { value: 1, label: t('system.notification.readStatusOptions.read') },
])

const getCategoryLabel = (category?: string) => {
    const map: Record<string, string> = {
        system: t('system.notification.categoryOptions.system'),
        export: t('system.notification.categoryOptions.export'),
    }
    return category ? map[category] || category : '-'
}

const getCategoryTagType = (category?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
        system: 'success',
        export: 'primary',
    }
    return category ? map[category] || 'info' : 'info'
}

const formatDateTime = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 格式化相对时间
const formatTimeAgo = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t('system.notification.timeAgo.justNow')
    if (diffMins < 60) return t('system.notification.timeAgo.minutesAgo', { count: diffMins })
    if (diffHours < 24) return t('system.notification.timeAgo.hoursAgo', { count: diffHours })
    if (diffDays < 7) return t('system.notification.timeAgo.daysAgo', { count: diffDays })

    return t('system.notification.timeAgo.monthDay', { month: date.getMonth() + 1, day: date.getDate() })
}

// 精简左侧消息显示
const getSummaryText = (item: AppNotification) => {
    const text = item.message || item.title
    if (text.length > 36) {
        return text.substring(0, 36) + '...'
    }
    return text
}

// 选中消息
const selectNotification = (item: AppNotification) => {
    selectedNotification.value = item
    if (!item.read) {
        void handleMarkRead(item)
    }
    if (window.innerWidth <= 768) {
        drawerVisible.value = true
    }
}

const fetchList = async () => {
    loading.value = true
    try {
        const params: Record<string, unknown> = {
            page: queryParams.page,
            per_page: queryParams.per_page,
        }
        if (queryParams.category) {
            params.category = queryParams.category
        }
        if (queryParams.is_read !== undefined && queryParams.is_read !== null) {
            params.is_read = queryParams.is_read
        }

        const response = await getNotificationList(params)
        const normalized = normalizeListData<AppNotification>(response)
        list.value = normalized.list.map((item) => normalizeNotification(item as unknown as Record<string, unknown>))
        total.value = normalized.total
        pagination.page = normalized.page ?? pagination.page
        pagination.pageSize = normalized.pageSize ?? pagination.pageSize
        pagination.total = normalized.total
        hasError.value = false

        // 保持选中同步或默认选中第一项
        if (list.value.length > 0) {
            const found = list.value.find((item) => item.id === selectedNotification.value?.id)
            if (found) {
                selectedNotification.value = found
            } else if (!selectedNotification.value) {
                if (window.innerWidth > 768) {
                    selectedNotification.value = list.value[0]
                }
            }
        } else {
            selectedNotification.value = null
        }
    } catch {
        list.value = []
        total.value = 0
        hasError.value = true
        selectedNotification.value = null
    } finally {
        loading.value = false
    }
}

const handleSearch = async () => {
    queryParams.page = 1
    await fetchList()
}

const handleReset = async () => {
    if (queryFormRef.value) {
        queryFormRef.value.resetFields()
    }
    await handleSearch()
}

const handlePageChange = async (page: number) => {
    queryParams.page = page
    await fetchList()
}

const handleMarkRead = async (item: AppNotification) => {
    if (item.read) return
    const previousRead = item.read
    item.read = true
    const success = await notificationStore.markRead(item.id)
    if (!success) {
        item.read = previousRead
    }
}

const handleActionClick = async (item: AppNotification) => {
    const target = normalizeNotificationActionUrl(item.action_url)
    if (!target) return
    if (!item.read) {
        await handleMarkRead(item)
    }
    await router.push(target)
}

const handleMarkAllRead = async () => {
    try {
        await notificationStore.markAllRead()
        list.value = list.value.map((item) => ({ ...item, read: true }))
        if (selectedNotification.value) {
            selectedNotification.value.read = true
        }
        ElMessage.success(translate('common.result.operationSuccess'))
    } catch (error) {
        ElMessage.error(translate('common.result.operationFailed'))
        Logger.error('标记全部已读失败:', error)
    }
}

const handleOpenManagePage = async () => {
    await router.push('/system/notification-manage')
}

onMounted(() => {
    void fetchList()
})
</script>

<style scoped lang="scss">
.notification-center-page {
    padding-bottom: 24px;
}

.notification-layout {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 200px);
    min-height: 550px;
    padding: 0 !important; /* 清除通用 container 的 padding，由子组件控制 */
    overflow: hidden;
}

.notification-layout__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 18px 24px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-blank);
    flex-shrink: 0;

    .header-left {
        .page-title {
            font-size: 16px;
            font-weight: 600;
            margin: 0;
            color: var(--el-text-color-primary);
        }

        .page-subtitle {
            font-size: 13px;
            margin: 4px 0 0 0;
            color: var(--el-text-color-secondary);
        }
    }

    .header-actions {
        display: flex;
        gap: 12px;
    }
}

.notification-layout__content {
    flex: 1;
    display: flex;
    overflow: hidden;
    min-height: 0;
}

/* 左侧栏样式 */
.notification-list-sidebar {
    width: 360px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-lightish, rgba(245, 247, 250, 0.4));
    min-height: 0;

    .sidebar-loading,
    .sidebar-error,
    .sidebar-empty {
        padding: 60px 0;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .sidebar-scroll {
        flex: 1;
        min-height: 0;
    }

    .notification-item {
        position: relative;
        padding: 16px 20px 16px 24px;
        border-bottom: 1px solid var(--el-border-color-lighter);
        cursor: pointer;
        background: var(--el-fill-color-blank);
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

        &::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 3px;
            background: var(--el-color-primary);
            transform: scaleY(0);
            transition: transform 0.2s ease;
        }

        &:hover {
            background: var(--el-fill-color-light);
        }

        &.is-active {
            background: color-mix(in srgb, var(--el-color-primary-light-9) 40%, var(--el-fill-color-blank));

            &::before {
                transform: scaleY(1);
            }
        }

        &.is-unread {
            background: color-mix(in srgb, var(--el-color-primary-light-9) 25%, var(--el-fill-color-blank));

            &.is-active {
                background: color-mix(in srgb, var(--el-color-primary-light-9) 50%, var(--el-fill-color-blank));
            }

            .item-title {
                font-weight: 700;
                color: var(--el-text-color-primary);
            }
        }

        .item-badge-dot {
            position: absolute;
            left: 10px;
            top: 22px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--el-color-primary);
            box-shadow: 0 0 6px var(--el-color-primary);
        }

        .item-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;

            .item-time {
                font-size: 12px;
                color: var(--el-text-color-secondary);
            }
        }

        .item-title {
            font-size: 13.5px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin: 0 0 4px 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .item-summary {
            font-size: 12px;
            color: var(--el-text-color-regular);
            margin: 0;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
    }

    .sidebar-pagination {
        padding: 8px 12px;
        border-top: 1px solid var(--el-border-color-lighter);
        background: var(--el-fill-color-blank);
        display: flex;
        justify-content: center;
        flex-shrink: 0;
    }
}

/* 右侧详情面板 */
.notification-detail-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--el-fill-color-blank);
    min-width: 0;
    min-height: 0;

    .detail-empty {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-blank);
    }

    .detail-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        min-height: 0;
    }

    .detail-header {
        padding: 24px 30px;
        position: relative;
        background: var(--el-fill-color-blank);
        flex-shrink: 0;

        &::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 30px;
            right: 30px;
            height: 1px;
            background-color: var(--el-border-color-lighter);
        }

        .detail-meta {
            display: flex;
            align-items: center;
            gap: 16px;
            margin-bottom: 10px;

            .detail-time {
                font-size: 13px;
                color: var(--el-text-color-secondary);
                display: flex;
                align-items: center;
                gap: 4px;
            }

            .mark-read-btn {
                margin-left: auto;
            }
        }

        .detail-title {
            font-size: 18px;
            font-weight: 600;
            color: var(--el-text-color-primary);
            margin: 0;
            line-height: 1.4;
        }
    }

    .detail-body-scroll {
        flex: 1;
        min-height: 0;
        background: var(--el-fill-color-blank);
    }

    .detail-body {
        padding: 24px 30px;
        font-size: 14px;
        line-height: 1.8;
        color: var(--el-text-color-regular);
        white-space: pre-wrap;
        word-break: break-all;
    }

    .detail-footer {
        padding: 16px 30px;
        background-color: var(--el-bg-color);
        border-top: 1px solid var(--el-border-color-lighter);
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-shrink: 0;

        .action-btn {
            min-width: 100px;
            height: 36px;
            border-radius: 6px;
            font-weight: 500;
        }
    }
}

/* 抽屉样式调整 */
.notification-mobile-drawer {
    :deep(.el-drawer__body) {
        padding: 0;
    }

    .detail-content.mobile-detail {
        padding: 16px 20px;
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        background: var(--el-fill-color-blank);

        .drawer-close-btn {
            position: absolute;
            right: 16px;
            top: 16px;
            cursor: pointer;
            color: var(--el-text-color-secondary);

            &:hover {
                color: var(--el-text-color-primary);
            }
        }

        .detail-header {
            padding: 24px 0 16px 0;
            border-bottom: 1px solid var(--el-border-color-lighter);

            .detail-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                margin-bottom: 8px;
                font-size: 12px;
                color: var(--el-text-color-secondary);
            }

            .detail-title {
                font-size: 16px;
                font-weight: 600;
                margin: 0;
                line-height: 1.4;
            }
        }

        .detail-body {
            flex: 1;
            padding: 16px 0;
            font-size: 13.5px;
            line-height: 1.6;
            overflow-y: auto;
        }

        .detail-footer-actions {
            padding: 12px 0 24px 0;
            border-top: 1px solid var(--el-border-color-lighter);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
    }
}

/* 响应式样式适配 */
@media (max-width: 768px) {
    .notification-layout {
        height: auto;
        min-height: auto;
    }

    .notification-layout__content {
        flex-direction: column;
        height: calc(100vh - 280px);
    }

    .notification-list-sidebar {
        width: 100% !important;
        border-right: none;
        height: 100%;
    }

    .notification-detail-container {
        display: none !important;
    }
}
</style>
