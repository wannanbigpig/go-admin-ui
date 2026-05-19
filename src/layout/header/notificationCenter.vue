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
            <fixed-size-list v-else class-name="notification-list" :data="notificationStore.notifications" :total="notificationStore.notifications.length" :height="420" :item-size="112" width="100%">
                <template #default="{ index, style }">
                    <div class="notification-list__row" :style="style">
                        <button type="button" class="notification-item" :class="{ 'is-unread': !notificationStore.notifications[index]?.read }" @click="handleNotificationClick(notificationStore.notifications[index])">
                            <div class="notification-item__header">
                                <div class="notification-item__title-row">
                                    <span class="notification-item__title">{{ notificationStore.notifications[index]?.title }}</span>
                                    <span v-if="!notificationStore.notifications[index]?.read" class="notification-item__dot" />
                                </div>
                                <el-tag size="small" effect="plain" :type="notificationTagTypeMap[notificationStore.notifications[index]?.level || 'info']">
                                    {{ sourceLabelMap[notificationStore.notifications[index]?.source || 'websocket'] }}
                                </el-tag>
                            </div>
                            <div class="notification-item__message">{{ notificationStore.notifications[index]?.message || '-' }}</div>
                            <div class="notification-item__footer">
                                <span>{{ formatDateTime(notificationStore.notifications[index]?.created_at) }}</span>
                                <span v-if="notificationStore.notifications[index]?.action_label">{{ notificationStore.notifications[index]?.action_label }}</span>
                            </div>
                        </button>
                    </div>
                </template>
            </fixed-size-list>

            <div class="notification-panel__footer">
                <el-button link type="primary" @click="openExportCenter">
                    {{ t('layout.notification.viewExportCenter') }}
                </el-button>
            </div>
        </div>
    </el-popover>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { FixedSizeList } from 'element-plus'
import 'element-plus/es/components/virtual-list/style/css'
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

const startNotificationCenter = () => {
    if (!authStore.token) {
        notificationStore.stop()
        return
    }
    notificationStore.start(authStore.token, locale.value || settingStore.locale || 'zh-CN')
}

const openExportCenter = () => {
    router.push('/task/center?tab=export')
}

const formatDateTime = (value?: string) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const handleNotificationClick = (item: AppNotification) => {
    if (!item) return
    void notificationStore.markRead(item.id)
    if (item.action_url) {
        router.push(item.action_url)
    }
}

const handlePanelOpen = () => {
    void Promise.all([notificationStore.loadNotifications(), notificationStore.refreshUnreadCount()])
}

const handleMarkAllRead = async () => {
    await notificationStore.markAllRead()
}

watch(() => authStore.token, startNotificationCenter, { immediate: true })
watch(() => settingStore.locale, startNotificationCenter)

onBeforeUnmount(() => {
    notificationStore.stop()
})
</script>

<style scoped lang="scss">
.notification-bell {
    :deep(.el-badge__content) {
        transform: scale(0.85) translate(50%, -35%);
    }
}

.notification-panel {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.notification-panel__header,
.notification-panel__footer,
.notification-item__header,
.notification-item__footer,
.notification-item__title-row,
.notification-panel__actions {
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
}

.notification-panel__actions {
    gap: 4px;
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
    width: 8px;
    height: 8px;
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
}

.notification-panel__empty {
    padding: 16px 0;
}

.notification-panel__loading {
    padding: 12px 4px;
}

.notification-list__row {
    padding: 0 2px 8px;
    box-sizing: border-box;
}

.notification-list :deep(.el-vl__window) {
    overflow-x: hidden !important;
}

.notification-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.notification-item {
    width: 100%;
    border: 1px solid var(--el-border-color-light);
    border-radius: 12px;
    background: var(--el-fill-color-blank);
    padding: 12px;
    text-align: left;
    cursor: pointer;
    transition:
        border-color 0.2s ease,
        background-color 0.2s ease;
}

.notification-item:hover {
    border-color: var(--el-color-primary-light-5);
    background: var(--el-fill-color-light);
}

.notification-item.is-unread {
    border-color: var(--el-color-primary-light-7);
    background: color-mix(in srgb, var(--el-color-primary-light-9) 55%, white);
}

.notification-item__title-row {
    gap: 8px;
}

.notification-item__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.notification-item__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--el-color-primary);
}

.notification-item__message {
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.6;
    color: var(--el-text-color-regular);
}

.notification-item__footer {
    margin-top: 10px;
    font-size: 12px;
    color: var(--el-text-color-secondary);
}
</style>
