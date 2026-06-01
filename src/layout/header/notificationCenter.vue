<template>
    <el-popover placement="bottom-end" :width="380" trigger="click" popper-class="notification-center-popper" @before-enter="handlePanelOpen">
        <template #reference>
            <div class="xl-theme-trigger xl-cursor-pointer notification-bell">
                <el-tooltip :content="t('layout.notification.title')" placement="bottom" :show-after="200">
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center">
                        <el-badge :value="badgeValue" :hidden="!notificationStore.hasUnread" :max="99">
                            <el-icon size="20">
                                <i-lucide-bell />
                            </el-icon>
                        </el-badge>
                    </div>
                </el-tooltip>
            </div>
        </template>

        <div class="notification-panel">
            <div class="notification-panel__header">
                <div>
                    <div class="notification-panel__title">{{ t('layout.notification.title') }}</div>
                    <div class="notification-panel__status" :class="`is-${notificationStore.connectionStatus}`">
                        <span class="notification-panel__status-dot" />
                        <span>{{ connectionStatusText }}</span>
                    </div>
                </div>
                <div class="notification-panel__actions">
                    <el-button link size="small" :disabled="notificationStore.unreadCount === 0" @click="handleMarkAllRead">
                        {{ t('layout.notification.markAllRead') }}
                    </el-button>
                    <el-button link size="small" :disabled="notificationStore.connectionStatus === 'connecting'" @click="notificationStore.reconnect()">
                        {{ t('layout.notification.reconnect') }}
                    </el-button>
                </div>
            </div>

            <div v-if="notificationStore.lastError" class="notification-panel__error">{{ notificationStore.lastError }}</div>

            <div v-if="notificationStore.listLoading" class="notification-panel__loading">
                <el-skeleton animated :rows="4" />
            </div>
            <div v-else-if="notificationStore.notifications.length === 0" class="notification-panel__empty">
                <el-empty :description="t('layout.notification.empty')" :image-size="72" />
            </div>
            <div v-else class="notification-list">
                <section v-for="item in previewNotifications" :key="item.id" class="notification-item" :class="{ 'is-unread': !item.read }">
                    <div class="notification-item__header">
                        <div class="notification-item__title-row">
                            <span class="notification-item__title">{{ item.title }}</span>
                            <span v-if="!item.read" class="notification-item__dot" />
                        </div>
                        <el-tag size="small" effect="plain" :type="notificationTagTypeMap[item.level || 'info']">
                            {{ sourceLabelMap[item.source || 'websocket'] }}
                        </el-tag>
                    </div>
                    <div class="notification-item__message" :class="{ 'is-expanded': isExpanded(item.id) }" :data-id="item.id">
                        {{ item.message || '-' }}
                    </div>
                    <div class="notification-item__footer">
                        <span>{{ formatDateTime(item.created_at) }}</span>
                        <div class="notification-item__footer-actions">
                            <el-button v-if="overflowMap[item.id]" link size="small" @click="toggleExpanded(item.id)">
                                {{ isExpanded(item.id) ? t('common.actions.collapse') : t('common.actions.expand') }}
                            </el-button>
                            <el-button v-if="!item.read" link size="small" type="primary" @click="handleMarkRead(item)">
                                {{ t('system.notification.markRead') }}
                            </el-button>
                            <el-button v-if="item.action_url" link size="small" type="primary" @click="handleGoProcess(item)">
                                {{ t('system.notification.goHandle') }}
                            </el-button>
                        </div>
                    </div>
                </section>
            </div>

            <div class="notification-panel__footer">
                <el-button link @click="openNotificationManage">
                    {{ t('system.notification.manageEntry') }}
                </el-button>
                <el-button link type="primary" @click="openNotificationCenter">
                    {{ t('layout.notification.viewMore') }}
                </el-button>
            </div>
        </div>
    </el-popover>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useSettingStore } from '@/stores/setting'
import { useNotificationStore } from '@/stores/notification'
import type { AppNotification } from '@/types/notification'

const authStore = useAuthStore()
const settingStore = useSettingStore()
const notificationStore = useNotificationStore()
const { t, locale } = useI18n()

const badgeValue = computed(() => notificationStore.unreadCount)
const expandedIds = ref<string[]>([])
const overflowMap = ref<Record<string, boolean>>({})

const checkOverflow = () => {
    nextTick(() => {
        const elements = document.querySelectorAll('.notification-item__message')
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

const sourceLabelMap = computed<Record<AppNotification['source'], string>>(() => ({
    websocket: t('layout.notification.source.websocket'),
    export: t('layout.notification.source.export'),
}))

const notificationTagTypeMap: Record<AppNotification['level'], 'success' | 'warning' | 'danger' | 'info'> = {
    success: 'success',
    warning: 'warning',
    error: 'danger',
    info: 'info',
}

const connectionStatusText = computed(() => {
    switch (notificationStore.connectionStatus) {
        case 'connected':
            return t('layout.notification.connection.connected')
        case 'connecting':
            return t('layout.notification.connection.connecting')
        case 'reconnecting':
            return t('layout.notification.connection.reconnecting')
        case 'error':
            return t('layout.notification.connection.error')
        case 'disabled':
            return t('layout.notification.connection.disabled')
        default:
            return t('layout.notification.connection.idle')
    }
})

const previewNotifications = computed(() => notificationStore.notifications.slice(0, 5))

const startNotificationCenter = () => {
    if (!authStore.token) {
        notificationStore.stop()
        return
    }
    notificationStore.start(authStore.token, locale.value || settingStore.locale || 'zh-CN')
}

const isExpanded = (id: string) => expandedIds.value.includes(id)

const toggleExpanded = (id: string) => {
    if (isExpanded(id)) {
        expandedIds.value = expandedIds.value.filter((itemId) => itemId !== id)
        return
    }
    expandedIds.value = [...expandedIds.value, id]
}

const formatDateTime = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const handleMarkRead = async (item: AppNotification) => {
    if (item.read) return
    await notificationStore.markRead(item.id)
}

const handleGoProcess = async (item: AppNotification) => {
    if (!item.action_url) return
    if (!item.read) {
        await handleMarkRead(item)
    }
    await router.push(item.action_url)
}

const handlePanelOpen = async () => {
    const previewIds = new Set(previewNotifications.value.map((item) => item.id))
    expandedIds.value = expandedIds.value.filter((id) => previewIds.has(id))
    await Promise.all([notificationStore.loadNotifications(), notificationStore.refreshUnreadCount()])
    checkOverflow()
}

watch(
    () => previewNotifications.value,
    () => {
        checkOverflow()
    },
    { deep: true }
)

let resizeTimer: number | null = null
const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(() => {
        checkOverflow()
    }, 150)
}

onMounted(() => {
    window.addEventListener('resize', handleResize)
    checkOverflow()
})

const handleMarkAllRead = async () => {
    await notificationStore.markAllRead()
}

const openNotificationCenter = async () => {
    await router.push('/system/notification')
}

const openNotificationManage = async () => {
    await router.push('/system/notification-manage')
}

watch(
    () => [authStore.token, settingStore.locale],
    () => {
        startNotificationCenter()
    },
    { immediate: true }
)

onBeforeUnmount(() => {
    notificationStore.stop()
    window.removeEventListener('resize', handleResize)
    if (resizeTimer) clearTimeout(resizeTimer)
})
</script>

<style scoped lang="scss">
.notification-bell {
    :deep(.el-badge__content) {
        transform: scale(0.85) translate(50%, -35%);
    }
}

:global(.notification-center-popper) {
    padding: 12px 8px !important;
}

.notification-panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.notification-panel__header,
.notification-panel__footer,
.notification-item__header,
.notification-item__footer,
.notification-item__title-row,
.notification-panel__actions,
.notification-item__footer-actions {
    display: flex;
    align-items: center;
}

.notification-panel__header,
.notification-item__header,
.notification-item__footer {
    justify-content: space-between;
}

.notification-panel__header {
    gap: 12px;
    padding: 0 8px 8px;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.notification-panel__actions,
.notification-item__footer-actions {
    gap: 8px;
}

.notification-panel__title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.notification-panel__status {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-top: 4px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}

.notification-panel__status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--el-text-color-disabled);
}

.notification-panel__status.is-connected .notification-panel__status-dot {
    background: var(--el-color-success);
}

.notification-panel__status.is-connecting .notification-panel__status-dot,
.notification-panel__status.is-reconnecting .notification-panel__status-dot {
    background: var(--el-color-warning);
}

.notification-panel__status.is-error .notification-panel__status-dot {
    background: var(--el-color-danger);
}

.notification-panel__error {
    padding: 8px 10px;
    border-radius: 8px;
    background: var(--el-color-danger-light-9);
    color: var(--el-color-danger);
    font-size: 12px;
    margin: 0 8px;
}

.notification-panel__empty {
    padding: 16px 0;
}

.notification-panel__loading {
    padding: 12px 8px;
}

.notification-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 430px;
    overflow-y: auto;
    padding: 0 4px;
}

.notification-item {
    border-radius: 8px;
    padding: 10px 8px;
    background: transparent;
}

.notification-item.is-unread {
    background: color-mix(in srgb, var(--el-color-primary-light-9) 35%, transparent);
}

.notification-item__title-row {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    gap: 6px;
    margin-right: 8px;
}

.notification-item__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.notification-item__dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--el-color-primary);
    flex-shrink: 0;
}

.notification-item__message {
    margin-top: 4px;
    font-size: 12px;
    line-height: 1.5;
    color: var(--el-text-color-regular);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
    white-space: pre-wrap;
}

.notification-item__message.is-expanded {
    display: block;
    -webkit-line-clamp: unset;
    overflow: visible;
}

.notification-item__footer {
    margin-top: 6px;
    font-size: 11px;
    color: var(--el-text-color-secondary);
    gap: 8px;
}

.notification-panel__footer {
    padding-top: 4px;
    justify-content: space-between;
    border-top: 1px solid var(--el-border-color-lighter);
}

@media (max-width: 768px) {
    .notification-panel__header,
    .notification-item__footer {
        align-items: flex-start;
        flex-direction: column;
    }

    .notification-panel__actions,
    .notification-item__footer-actions,
    .notification-panel__footer {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
    }
}
</style>
