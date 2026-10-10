<template>
    <el-dialog
        v-model="visible"
        :title="t('todo.reminder.title')"
        width="540px"
        destroy-on-close
        class="reminder-preference-dialog"
    >
        <el-skeleton v-if="loading" animated :rows="4" />
        <el-form v-else label-position="top" class="reminder-form">
            <div class="reminder-settings-list">
                <!-- 1. 站内提醒设置卡片 -->
                <div class="setting-item-card">
                    <div class="setting-item-left">
                        <div class="setting-icon-box is-primary">
                            <el-icon><Bell /></el-icon>
                        </div>
                        <div class="setting-text-wrap">
                            <div class="setting-title">{{ t('todo.reminder.inApp') }}</div>
                            <div class="setting-desc">{{ t('todo.reminder.inAppHint') }}</div>
                        </div>
                    </div>
                    <div class="setting-item-right">
                        <el-switch v-model="form.in_app_enabled" />
                    </div>
                </div>

                <!-- 2. 短信提醒设置卡片 -->
                <div class="setting-item-card" :class="{ 'is-disabled': !smsAvailable }">
                    <div class="setting-item-left">
                        <div class="setting-icon-box" :class="smsAvailable ? 'is-success' : 'is-muted'">
                            <el-icon><ChatDotRound /></el-icon>
                        </div>
                        <div class="setting-text-wrap">
                            <div class="setting-title">{{ t('todo.reminder.sms') }}</div>
                            <div class="setting-desc">{{ t('todo.reminder.smsHint') }}</div>
                        </div>
                    </div>
                    <div class="setting-item-right">
                        <el-switch v-model="form.sms_enabled" :disabled="!smsAvailable" />
                    </div>
                </div>

                <!-- 短信未绑定告警提示条 -->
                <el-alert v-if="!smsAvailable" type="warning" :closable="false" show-icon class="reminder-alert-box">
                    <template #title>
                        <span class="alert-msg">{{ t('todo.reminder.phoneMissing') }}</span>
                        <el-button link type="primary" size="small" class="alert-link-btn" @click="goToProfile">
                            {{ t('todo.reminder.goToProfile') }}
                        </el-button>
                    </template>
                </el-alert>

                <!-- 3. 提前提醒时间设置卡片 -->
                <div class="setting-item-card setting-item-card--column">
                    <div class="setting-card-header">
                        <div class="setting-item-left">
                            <div class="setting-icon-box is-warning">
                                <el-icon><Timer /></el-icon>
                            </div>
                            <div class="setting-text-wrap">
                                <div class="setting-title">{{ t('todo.reminder.leadTime') }}</div>
                                <div class="setting-desc">{{ t('todo.reminder.leadTimeHint') }}</div>
                            </div>
                        </div>
                        <div class="lead-time-input-wrap">
                            <el-input-number
                                v-model="form.lead_minutes"
                                :min="0"
                                :max="43200"
                                :step="1"
                                :precision="0"
                                controls-position="right"
                                class="lead-time-number-input"
                            />
                            <span class="lead-time-unit-label">{{ t('todo.reminder.minutes') }}</span>
                        </div>
                    </div>

                    <!-- 常用时间快捷预设胶囊标签 -->
                    <div class="lead-time-presets">
                        <span class="presets-label">常用预设：</span>
                        <div class="presets-tags">
                            <span
                                v-for="preset in leadTimePresets"
                                :key="preset.value"
                                class="preset-pill"
                                :class="{ 'is-active': form.lead_minutes === preset.value }"
                                @click="form.lead_minutes = preset.value"
                            >
                                {{ preset.label }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </el-form>

        <template #footer>
            <div class="dialog-footer-actions">
                <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
                <el-button
                    type="primary"
                    :loading="saving"
                    :disabled="loading || !leadTimeValid"
                    @click="save"
                >
                    {{ t('todo.reminder.save') }}
                </el-button>
            </div>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Bell, ChatDotRound, Timer } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { fetchTodoReminderPreference, submitTodoReminderPreference } from '@/modules/todo/service'
import { Logger } from '@/utils/logger'

const visible = defineModel<boolean>({ default: false })
const { t } = useI18n()
const router = useRouter()
const loading = ref(false)
const saving = ref(false)
const smsAvailable = ref(false)
const form = reactive({ in_app_enabled: true, sms_enabled: false, lead_minutes: 1440 })
const leadTimeValid = computed(() => Number.isInteger(form.lead_minutes) && form.lead_minutes >= 0 && form.lead_minutes <= 43200)

const isZh = computed(() => t('todo.reminder.minutes') === '分钟')

const leadTimePresets = computed(() => [
    { label: isZh.value ? '15 分钟' : '15m', value: 15 },
    { label: isZh.value ? '30 分钟' : '30m', value: 30 },
    { label: isZh.value ? '1 小时' : '1h', value: 60 },
    { label: isZh.value ? '2 小时' : '2h', value: 120 },
    { label: isZh.value ? '1 天 (24h)' : '1d (24h)', value: 1440 },
    { label: isZh.value ? '7 天' : '7d', value: 10080 },
])

const load = async () => {
    loading.value = true
    try {
        const preference = await fetchTodoReminderPreference()
        smsAvailable.value = preference.sms_available
        form.in_app_enabled = preference.in_app_enabled
        form.sms_enabled = preference.sms_available && preference.sms_enabled
        form.lead_minutes = preference.lead_minutes
    } catch (error) {
        Logger.error('获取待办提醒偏好失败:', error)
    } finally {
        loading.value = false
    }
}

const save = async () => {
    if (loading.value || saving.value || !leadTimeValid.value) return
    saving.value = true
    try {
        const preference = await submitTodoReminderPreference({
            in_app_enabled: form.in_app_enabled,
            sms_enabled: smsAvailable.value && form.sms_enabled,
            lead_minutes: form.lead_minutes,
        })
        smsAvailable.value = preference.sms_available
        form.in_app_enabled = preference.in_app_enabled
        form.sms_enabled = preference.sms_available && preference.sms_enabled
        form.lead_minutes = preference.lead_minutes
        ElMessage.success(t('todo.reminder.saveSuccess'))
        visible.value = false
    } catch (error) {
        Logger.error('保存待办提醒偏好失败:', error)
    } finally {
        saving.value = false
    }
}

const goToProfile = () => {
    visible.value = false
    router.push('/profile')
}

watch(visible, (open) => {
    if (open) load()
})

defineExpose({ form, load, save, smsAvailable, goToProfile })
</script>

<style scoped lang="scss">
.reminder-preference-dialog {
    :deep(.el-dialog__body) {
        padding: 16px 20px 20px;
    }
}

.reminder-form {
    width: 100%;
}

.reminder-settings-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.setting-item-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 16px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--xl-radius-md, 8px);
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

    &:hover {
        border-color: var(--el-border-color);
        background: var(--el-fill-color);
    }

    &.is-disabled {
        opacity: 0.75;
    }

    &--column {
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }
}

.setting-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
}

.setting-item-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
}

.setting-icon-box {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    flex-shrink: 0;

    &.is-primary {
        background: var(--el-color-primary-light-8);
        color: var(--el-color-primary);
    }

    &.is-success {
        background: var(--el-color-success-light-8);
        color: var(--el-color-success);
    }

    &.is-warning {
        background: var(--el-color-warning-light-8);
        color: var(--el-color-warning);
    }

    &.is-muted {
        background: var(--el-fill-color-dark);
        color: var(--el-text-color-placeholder);
    }
}

.setting-text-wrap {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
}

.setting-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-primary);
    line-height: 1.4;
}

.setting-desc {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.4;
}

.setting-item-right {
    flex-shrink: 0;
    display: flex;
    align-items: center;
}

/* 提前提醒时间输入框 */
.lead-time-input-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.lead-time-number-input {
    width: 110px;
}

.lead-time-unit-label {
    font-size: 13px;
    color: var(--el-text-color-secondary);
}

/* 快捷预设标签行 */
.lead-time-presets {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 8px;
    border-top: 1px dashed var(--el-border-color-lighter);
}

.presets-label {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    flex-shrink: 0;
}

.presets-tags {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
}

.preset-pill {
    font-size: 12px;
    padding: 2px 8px;
    border-radius: 4px;
    background: var(--el-fill-color);
    color: var(--el-text-color-regular);
    border: 1px solid var(--el-border-color-lighter);
    cursor: pointer;
    user-select: none;
    transition: all 0.2s ease;

    &:hover {
        color: var(--el-color-primary);
        border-color: var(--el-color-primary-light-5);
    }

    &.is-active {
        background: var(--el-color-primary);
        color: #fff;
        border-color: var(--el-color-primary);
        font-weight: 500;
    }
}

/* 短信未绑定告警框 */
.reminder-alert-box {
    margin-top: -2px;
    border-radius: var(--xl-radius-md, 8px);

    .alert-msg {
        font-size: 12px;
        color: var(--el-color-warning-dark-2, #b88230);
    }

    .alert-link-btn {
        font-size: 12px;
        margin-left: 6px;
        vertical-align: baseline;
    }
}

/* 底部操作栏 */
.dialog-footer-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
}
</style>
