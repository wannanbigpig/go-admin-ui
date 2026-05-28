<template>
    <div class="notification-center-page">
        <div class="xl-container xl-m-bottom-10">
            <el-form ref="queryFormRef" class="xl-search-form" :model="queryParams" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="notificationSearchForm" :gutter="20">
                    <el-col :span="5">
                        <el-form-item :label="t('system.notification.category')" prop="category">
                            <el-select v-model="queryParams.category" clearable>
                                <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item :label="t('system.notification.readStatus')" prop="is_read">
                            <el-select v-model="queryParams.is_read" clearable>
                                <el-option v-for="item in readStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="2" :onSearch="handleSearch" :onReset="handleReset" :modelRef="queryFormRef" nodeName="#notificationSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container notification-center-body">
            <div class="notification-center-body__header">
                <div>
                    <div class="notification-center-body__title">{{ t('system.notification.title') }}</div>
                    <div class="notification-center-body__subtitle">{{ t('system.notification.listHint') }}</div>
                </div>
                <div class="notification-center-body__header-actions">
                    <el-button link type="primary" size="small" @click="handleToggleAllExpanded">
                        {{ allExpanded ? t('common.actions.collapseAll') : t('common.actions.expandAll') }}
                    </el-button>
                    <el-button link type="primary" size="small" :disabled="!hasUnread" @click="handleMarkAllRead">
                        {{ t('layout.notification.markAllRead') }}
                    </el-button>
                    <el-button link type="primary" size="small" @click="handleOpenManagePage">
                        {{ t('system.notification.manageEntry') }}
                    </el-button>
                </div>
            </div>

            <div v-if="loading && list.length === 0" class="notification-center-body__loading">
                <el-skeleton animated :rows="6" />
            </div>
            <div v-else-if="hasError" class="notification-center-body__error">
                <el-empty :description="t('common.i18n.loadFailed')" :image-size="96">
                    <el-button type="primary" @click="fetchList">{{ t('common.actions.retry') }}</el-button>
                </el-empty>
            </div>
            <div v-else-if="list.length === 0" class="notification-center-body__empty">
                <el-empty :description="t('layout.notification.empty')" :image-size="96" />
            </div>
            <div v-else class="notification-center-body__list">
                <section v-for="item in list" :key="item.id" class="notification-card" :class="{ 'is-unread': !item.read }">
                    <div class="notification-card__header">
                        <div class="notification-card__title-block">
                            <div class="notification-card__title-row">
                                <span class="notification-card__title">{{ item.title }}</span>
                                <span v-if="!item.read" class="notification-card__dot" />
                            </div>
                            <div class="notification-card__meta">
                                <el-tag size="small" effect="plain" :type="getCategoryTagType(item.category)">
                                    {{ getCategoryLabel(item.category) }}
                                </el-tag>
                                <span class="notification-card__time">{{ formatDateTime(item.created_at) }}</span>
                            </div>
                        </div>
                        <div class="notification-card__actions">
                            <el-button v-if="overflowMap[item.id]" link size="small" @click="toggleExpanded(item.id)">
                                {{ isExpanded(item.id) ? t('common.actions.collapse') : t('common.actions.expand') }}
                            </el-button>
                            <el-button v-if="!item.read" link size="small" type="primary" @click="handleMarkRead(item)">
                                {{ t('system.notification.markRead') }}
                            </el-button>
                            <el-button v-if="item.action_url" link size="small" type="primary" @click="handleActionClick(item)">
                                {{ t('system.notification.goHandle') }}
                            </el-button>
                        </div>
                    </div>

                    <div class="notification-card__content" :class="{ 'is-expanded': isExpanded(item.id) }" :data-id="item.id">
                        {{ item.message || item.title }}
                    </div>

                    <div v-if="item.action_label && item.action_url" class="notification-card__extra">
                        {{ t('system.notification.actionLabelPrefix', { label: item.action_label }) }}
                    </div>
                </section>
            </div>

            <xl-pagination v-if="total > 0" :current-page="pagination.page" :page-size="pagination.pageSize" :total="total" @size-change="handlePageSizeChange" @current-change="handlePageChange" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, type FormInstance } from 'element-plus'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlPagination from '@/components/pagination/index.vue'
import { useNotificationStore, normalizeNotification } from '@/stores/notification'
import { getNotificationList } from '@/api/system'
import { normalizeListData } from '@/modules/shared/response'
import { translate } from '@/locales'
import router from '@/router'
import type { AppNotification } from '@/types/notification'
import { useNotificationCategoryOptions } from './notificationConstants'

const { t } = useI18n()
const notificationStore = useNotificationStore()

const queryFormRef = ref<FormInstance>()
const loading = ref(false)
const hasError = ref(false)
const list = ref<AppNotification[]>([])
const total = ref(0)
const expandedIds = ref<string[]>([])
const overflowMap = ref<Record<string, boolean>>({})

const checkOverflow = () => {
    nextTick(() => {
        const elements = document.querySelectorAll('.notification-card__content')
        elements.forEach((el) => {
            const id = el.getAttribute('data-id')
            if (id) {
                if (isExpanded(id)) {
                    overflowMap.value[id] = true
                } else {
                    overflowMap.value[id] = el.scrollHeight > el.clientHeight
                }
            }
        })
    })
}

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
const allExpanded = computed(() => list.value.length > 0 && expandedIds.value.length === list.value.length)

const categoryOptions = useNotificationCategoryOptions()

const readStatusOptions = computed(() => [
    { value: 0, label: t('system.notification.readStatusOptions.unread') },
    { value: 1, label: t('system.notification.readStatusOptions.read') },
])

const getCategoryLabel = (category?: string) => {
    const map: Record<string, string> = {
        export: t('system.notification.categoryOptions.export'),
    }
    return category ? map[category] || category : '-'
}

const getCategoryTagType = (category?: string): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    const map: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
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

const syncExpandedIds = () => {
    const currentIds = new Set(list.value.map((item) => item.id))
    expandedIds.value = expandedIds.value.filter((id) => currentIds.has(id))
}

const isExpanded = (id: string) => expandedIds.value.includes(id)

const toggleExpanded = (id: string) => {
    if (isExpanded(id)) {
        expandedIds.value = expandedIds.value.filter((itemId) => itemId !== id)
        return
    }
    expandedIds.value = [...expandedIds.value, id]
}

const handleToggleAllExpanded = () => {
    if (allExpanded.value) {
        expandedIds.value = []
        return
    }
    expandedIds.value = list.value.map((item) => item.id)
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
        syncExpandedIds()
        checkOverflow()
    } catch {
        list.value = []
        total.value = 0
        expandedIds.value = []
        hasError.value = true
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

const handlePageSizeChange = async (size: number) => {
    queryParams.per_page = size
    queryParams.page = 1
    await fetchList()
}

const handleMarkRead = async (item: AppNotification) => {
    if (item.read) return
    await notificationStore.markRead(item.id)
    item.read = true
}

const handleActionClick = async (item: AppNotification) => {
    if (!item.action_url) return
    // 仅允许内部路由（以 / 开头），防止开放重定向和 XSS
    if (!item.action_url.startsWith('/')) return
    if (!item.read) {
        await handleMarkRead(item)
    }
    await router.push(item.action_url)
}

const handleMarkAllRead = async () => {
    try {
        await notificationStore.markAllRead()
        list.value = list.value.map((item) => ({ ...item, read: true }))
        ElMessage.success(translate('common.result.operationSuccess'))
    } catch {
        // noop
    }
}

const handleOpenManagePage = async () => {
    await router.push('/system/notification/manage')
}

let resizeTimer: number | null = null
const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
        checkOverflow()
    }, 150)
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    void fetchList()
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
})
</script>

<style scoped lang="scss">
.notification-center-page {
    padding-bottom: 20px;
}

.notification-center-body {
    padding: 20px;
}

.notification-center-body__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--xl-space-4);
    margin-bottom: var(--xl-space-4);
}

.notification-center-body__title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.notification-center-body__subtitle {
    margin-top: var(--xl-space-1);
    font-size: var(--xl-font-sm);
    color: var(--el-text-color-secondary);
}

.notification-center-body__header-actions {
    display: flex;
    align-items: center;
    gap: var(--xl-space-2);
    flex-wrap: wrap;
}

.notification-center-body__loading,
.notification-center-body__empty {
    padding: 40px 0;
}

.notification-center-body__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
}

.notification-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: 10px;
    background: var(--el-fill-color-blank);
    padding: var(--xl-space-4);
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease;
}

.notification-card.is-unread {
    border-color: var(--el-color-primary-light-7);
    background: color-mix(in srgb, var(--el-color-primary-light-9) 55%, white);
}

.notification-card__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--xl-space-4);
}

.notification-card__title-block {
    min-width: 0;
    flex: 1;
}

.notification-card__title-row {
    display: flex;
    align-items: center;
    gap: var(--xl-space-2);
    min-width: 0;
}

.notification-card__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.notification-card__dot {
    flex-shrink: 0;
    width: var(--xl-space-2);
    height: var(--xl-space-2);
    border-radius: 50%;
    background: var(--el-color-primary);
}

.notification-card__meta {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: var(--xl-space-2);
    flex-wrap: wrap;
}

.notification-card__actions {
    display: flex;
    align-items: center;
    gap: var(--xl-space-1);
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
}

.notification-card__content {
    margin-top: var(--xl-space-3);
    font-size: var(--xl-font-md);
    line-height: 1.7;
    color: var(--el-text-color-regular);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: pre-wrap;
}

.notification-card__content.is-expanded {
    display: block;
    -webkit-line-clamp: unset;
    overflow: visible;
}

.notification-card__time,
.notification-card__extra {
    font-size: var(--xl-font-sm);
    color: var(--el-text-color-secondary);
}

.notification-card__extra {
    margin-top: 10px;
}

@media (max-width: 768px) {
    .notification-center-body__header,
    .notification-card__header {
        flex-direction: column;
    }

    .notification-center-body__header-actions,
    .notification-card__actions {
        width: 100%;
        justify-content: flex-start;
    }
}
</style>
