<template>
    <div class="notification-manage-page">
        <div class="xl-container notification-manage-page__header">
            <div>
                <div class="notification-manage-page__title">{{ t('system.notification.manageTitle') }}</div>
                <div class="notification-manage-page__subtitle">{{ t('system.notification.manageSubtitle') }}</div>
            </div>
            <el-button link type="primary" @click="openNotificationCenter">
                {{ t('system.notification.backToCenter') }}
            </el-button>
        </div>

        <div class="xl-container notification-manage-page__content">
            <div class="notification-manage-page__main">
                <el-alert :title="t('system.notification.manageNotice')" type="info" show-icon :closable="false" />

                <el-form ref="formRef" class="notification-manage-form" :model="form" :rules="rules" label-width="120px" @submit.prevent="handleSubmit">
                    <el-form-item :label="t('system.notification.audienceType')" prop="audience_type">
                        <el-radio-group v-model="form.audience_type">
                            <el-radio-button value="all">{{ t('system.notification.audienceOptions.all') }}</el-radio-button>
                            <el-radio-button value="user_ids">{{ t('system.notification.audienceOptions.userIds') }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>

                    <el-form-item v-if="form.audience_type === 'user_ids'" :label="t('system.notification.userIds')" prop="user_ids_text">
                        <el-input v-model="form.user_ids_text" type="textarea" :rows="3" :placeholder="t('system.notification.userIdsPlaceholder')" />
                    </el-form-item>

                    <el-form-item :label="t('system.notification.category')" prop="category">
                        <el-select v-model="form.category" class="notification-manage-form__field">
                            <el-option v-for="item in categoryOptions" :key="item.value" :label="item.label" :value="item.value" />
                        </el-select>
                    </el-form-item>

                    <el-form-item :label="t('system.notification.formTitle')" prop="title">
                        <el-input v-model.trim="form.title" :placeholder="t('system.notification.formTitlePlaceholder')" maxlength="120" show-word-limit />
                    </el-form-item>

                    <el-form-item :label="t('system.notification.formMessage')" prop="message">
                        <el-input v-model.trim="form.message" type="textarea" :rows="5" :placeholder="t('system.notification.formMessagePlaceholder')" maxlength="1000" show-word-limit />
                    </el-form-item>

                    <el-form-item :label="t('system.notification.actionUrl')" prop="action_url">
                        <el-input v-model.trim="form.action_url" :placeholder="t('system.notification.actionUrlPlaceholder')" clearable />
                    </el-form-item>

                    <el-form-item :label="t('system.notification.actionLabel')" prop="action_label">
                        <el-input v-model.trim="form.action_label" :placeholder="t('system.notification.actionLabelPlaceholder')" clearable />
                    </el-form-item>

                    <div class="notification-manage-form__actions">
                        <el-button type="primary" :loading="submitting" native-type="submit">
                            {{ t('common.actions.submit') }}
                        </el-button>
                        <el-button @click="handleReset">
                            {{ t('common.actions.reset') }}
                        </el-button>
                    </div>
                </el-form>
            </div>

            <div class="notification-manage-page__aside">
                <el-card shadow="never">
                    <template #header>
                        <span>{{ t('system.notification.previewTitle') }}</span>
                    </template>
                    <div class="notification-preview-card">
                        <div class="notification-preview-card__title">{{ form.title || t('layout.notification.defaultTitle') }}</div>
                        <div class="notification-preview-card__meta">
                            <el-tag size="small" effect="plain">{{ currentCategoryLabel }}</el-tag>
                            <span>{{ audienceSummary }}</span>
                        </div>
                        <div class="notification-preview-card__message">{{ form.message || t('system.notification.previewEmptyMessage') }}</div>
                        <div v-if="form.action_url" class="notification-preview-card__footer">
                            <el-button type="primary" size="small" class="preview-action-btn">
                                {{ form.action_label || t('system.notification.goHandle') }}
                                <el-icon class="el-icon--right"><ArrowRight /></el-icon>
                            </el-button>
                        </div>
                    </div>
                </el-card>

                <el-card shadow="never">
                    <template #header>
                        <span>{{ t('system.notification.formScopeTitle') }}</span>
                    </template>
                    <ul class="notification-manage-page__scope-list">
                        <li v-for="item in scopeItems" :key="item.key" class="scope-item">
                            <div class="scope-item__icon-wrapper" :style="{ backgroundColor: item.bgColor, color: item.color }">
                                <el-icon :size="16"><component :is="item.icon" /></el-icon>
                            </div>
                            <div class="scope-item__body">
                                <div class="scope-item__title" :style="{ color: item.color }">{{ item.title }}</div>
                                <div class="scope-item__content">{{ item.content }}</div>
                            </div>
                        </li>
                    </ul>
                </el-card>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ArrowRight, Bell, Position, Warning } from '@element-plus/icons-vue'
import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useI18n } from 'vue-i18n'
import router from '@/router'
import { dispatchSystemNotification } from '@/modules/system/service'
import type { NotificationAudienceType, NotificationSendPayload } from '@/types/notification'
import { useNotificationCategoryOptions } from '../notification/notificationConstants'

interface NotificationManageFormState {
    audience_type: NotificationAudienceType
    user_ids_text: string
    category: string
    title: string
    message: string
    action_url: string
    action_label: string
}

const { t } = useI18n()
const formRef = ref<FormInstance>()
const submitting = ref(false)

const createInitialForm = (): NotificationManageFormState => ({
    audience_type: 'all',
    user_ids_text: '',
    category: 'system',
    title: '',
    message: '',
    action_url: '',
    action_label: '',
})

const form = reactive<NotificationManageFormState>(createInitialForm())

const categoryOptions = useNotificationCategoryOptions()

const scopeItems = computed(() => {
    const items = [
        {
            key: 'listOnly',
            icon: Bell,
            color: 'var(--el-color-primary)',
            bgColor: 'var(--el-color-primary-light-9)',
        },
        {
            key: 'noDetail',
            icon: Position,
            color: 'var(--el-color-success)',
            bgColor: 'var(--el-color-success-light-9)',
        },
        {
            key: 'noRichText',
            icon: Warning,
            color: 'var(--el-color-warning)',
            bgColor: 'var(--el-color-warning-light-9)',
        },
    ]

    return items.map((item) => {
        const rawText = t(`system.notification.formScopeItems.${item.key}`)
        const match = rawText.match(/^([【[])(.*?)([】\]])(.*)$/)
        return {
            ...item,
            title: match ? match[2] : '',
            content: match ? match[4].trim() : rawText,
        }
    })
})

const currentCategoryLabel = computed(() => categoryOptions.value.find((item) => item.value === form.category)?.label || form.category)

const audienceSummary = computed(() => {
    if (form.audience_type === 'all') {
        return t('system.notification.audienceOptions.all')
    }
    const total = parseUserIDs(form.user_ids_text).length
    return t('system.notification.audienceSummary', { count: total })
})

const rules: FormRules<NotificationManageFormState> = {
    title: [{ required: true, message: t('system.notification.formTitlePlaceholder'), trigger: 'blur' }],
    message: [{ required: true, message: t('system.notification.formMessagePlaceholder'), trigger: 'blur' }],
    user_ids_text: [
        {
            validator: (_rule, value: string, callback) => {
                if (form.audience_type !== 'user_ids') {
                    callback()
                    return
                }
                const tokens = splitUserIDTokens(value)
                if (tokens.length === 0) {
                    callback(new Error(t('system.notification.userIdsRequired')))
                    return
                }
                if (tokens.every(isValidUserIDToken)) {
                    callback()
                    return
                }
                callback(new Error(t('system.notification.userIdsRequired')))
            },
            trigger: 'blur',
        },
    ],
}

function splitUserIDTokens(value: string) {
    return value
        .split(/[\s,，]+/)
        .map((item) => item.trim())
        .filter(Boolean)
}

function isValidUserIDToken(value: string) {
    if (!/^\d+$/.test(value)) return false
    const userId = Number(value)
    return Number.isSafeInteger(userId) && userId > 0
}

function parseUserIDs(value: string) {
    return splitUserIDTokens(value)
        .filter(isValidUserIDToken)
        .map((item) => Number(item))
}

function buildPayload(): NotificationSendPayload {
    const payload: NotificationSendPayload = {
        audience_type: form.audience_type,
        category: form.category,
        title: form.title,
        message: form.message,
    }
    if (form.action_url) {
        payload.action_url = form.action_url
    }
    if (form.action_label) {
        payload.action_label = form.action_label
    }
    if (form.audience_type === 'user_ids') {
        payload.user_ids = parseUserIDs(form.user_ids_text)
    }
    return payload
}

const handleSubmit = async () => {
    if (!formRef.value) return
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
        await dispatchSystemNotification(buildPayload())
        ElMessage.success(t('common.result.operationSuccess'))
        handleReset()
    } finally {
        submitting.value = false
    }
}

const handleReset = () => {
    Object.assign(form, createInitialForm())
    formRef.value?.clearValidate()
}

const openNotificationCenter = async () => {
    await router.push('/system/notification')
}
</script>

<style scoped lang="scss">
.notification-manage-page {
    padding-bottom: 20px;
}

.notification-manage-page__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--xl-space-4);
    margin-bottom: 10px;
    padding: 20px;
}

.notification-manage-page__title {
    font-size: var(--xl-font-xl);
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.notification-manage-page__subtitle {
    margin-top: 6px;
    font-size: var(--xl-font-sm);
    color: var(--el-text-color-secondary);
}

.notification-manage-page__content {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
    gap: var(--xl-space-4);
    align-items: start;
}

.notification-manage-page__main,
.notification-manage-page__aside {
    display: flex;
    flex-direction: column;
    gap: var(--xl-space-4);
}

.notification-manage-page__main {
    padding: 20px;
}

.notification-manage-form {
    margin-top: var(--xl-space-4);
}

.notification-manage-form__field,
.notification-manage-form :deep(.el-select) {
    width: 100%;
}

.notification-manage-form__actions {
    display: flex;
    align-items: center;
    gap: var(--xl-space-3);
    padding-left: 120px;
}

.notification-preview-card {
    border: 1px solid var(--el-border-color-light);
    border-radius: var(--xl-radius-lg);
    background: color-mix(in srgb, var(--el-color-primary-light-9) 45%, white);
    padding: var(--xl-space-4);
}

.notification-preview-card__title {
    font-size: var(--xl-font-lg);
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.notification-preview-card__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--xl-space-2);
    flex-wrap: wrap;
    margin-top: 10px;
    font-size: var(--xl-font-sm);
    color: var(--el-text-color-secondary);
}

.notification-preview-card__footer {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: var(--xl-space-3);
    border-top: 1px dashed var(--el-border-color-lighter);
    padding-top: var(--xl-space-3);
}

.notification-preview-card__message {
    margin-top: var(--xl-space-3);
    white-space: pre-wrap;
    line-height: 1.7;
    font-size: var(--xl-font-md);
    color: var(--el-text-color-regular);
}

.notification-manage-page__scope-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;

    .scope-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        background-color: var(--el-bg-color-overlay);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 8px;
        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

        &:hover {
            border-color: var(--el-border-color-light);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
            transform: translateY(-1px);
        }
    }

    .scope-item__icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 8px;
        flex-shrink: 0;
        transition: transform 0.2s ease;
    }

    .scope-item:hover .scope-item__icon-wrapper {
        transform: scale(1.05);
    }

    .scope-item__body {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .scope-item__title {
        font-size: 14px;
        font-weight: 600;
        line-height: 1.4;
    }

    .scope-item__content {
        font-size: 12px;
        line-height: 1.5;
        color: var(--el-text-color-regular);
    }
}

@media (max-width: 960px) {
    .notification-manage-page__content {
        grid-template-columns: 1fr;
    }
}

@media (max-width: 768px) {
    .notification-manage-page__header {
        flex-direction: column;
    }

    .notification-manage-form__actions {
        padding-left: 0;
    }
}
</style>
