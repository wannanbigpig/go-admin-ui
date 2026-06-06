<template>
    <div class="request-mask-panel" :class="{ 'is-embedded': embedded }">
        <div v-if="!embedded" class="request-mask-header">
            <div class="header-content">
                <h3 class="title">
                    <span class="title-icon">
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                        </svg>
                    </span>
                    {{ t('system.requestMask.title') }}
                </h3>
                <div class="desc-box">
                    <span class="desc-icon">
                        <svg viewBox="0 0 24 24" width="16" height="16">
                            <path fill="currentColor" d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                        </svg>
                    </span>
                    <span>{{ t('system.requestMask.description') }}</span>
                </div>
            </div>
            <div class="request-mask-actions">
                <xl-action-button type="primary" :show-icon="false" :text="t('system.requestMask.save')" :loading="saving" @click="handleSave" />
            </div>
        </div>

        <el-skeleton v-if="loading" animated :rows="8" />

        <el-form v-else ref="formRef" :model="maskConfigText" label-position="top" class="request-mask-form">
            <div class="request-mask-layout">
                <section class="request-mask-section is-full fade-in-up" style="animation-delay: 0.1s">
                    <div class="request-mask-section-header">
                        <div class="header-title">
                            <span class="header-icon primary-icon">
                                <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" /></svg>
                            </span>
                            <h4>{{ t('system.requestMask.common') }}</h4>
                        </div>
                    </div>
                    <div class="section-content textarea-wrapper">
                        <el-input v-model="maskConfigText.common" type="textarea" :rows="8" resize="none" :placeholder="t('system.requestMask.placeholder')" />
                        <div class="expand-icon" @click="openExpandDialog('common', t('system.requestMask.common'))" :title="t('common.actions.expand')">
                            <svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M10 21v-2H6.41l4.5-4.5-1.41-1.41-4.5 4.5V14H3v7h7zm4.5-10.09L19 6.41V10h2V3h-7v2h3.59l-4.5 4.5 1.41 1.41z" /></svg>
                        </div>
                    </div>
                </section>

                <section v-for="(group, index) in maskFieldGroups" :key="group.title" class="request-mask-section fade-in-up" :style="{ animationDelay: `${0.2 + index * 0.1}s` }">
                    <div class="request-mask-section-header">
                        <div class="header-title">
                            <span class="header-icon" :class="index === 0 ? 'warning-icon' : 'success-icon'">
                                <svg v-if="index === 0" viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z" /></svg>
                                <svg v-else viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" /></svg>
                            </span>
                            <h4>{{ group.title }}</h4>
                        </div>
                    </div>
                    <div class="request-mask-fields">
                        <el-form-item v-for="field in group.fields" :key="field.key" :label="field.label">
                            <div class="textarea-wrapper">
                                <el-input v-model="maskConfigText[field.key]" type="textarea" :rows="8" resize="none" :placeholder="t('system.requestMask.placeholder')" />
                                <div class="expand-icon" @click="openExpandDialog(field.key, field.label)" :title="t('common.actions.expand')">
                                    <svg viewBox="0 0 24 24" width="14" height="14">
                                        <path fill="currentColor" d="M10 21v-2H6.41l4.5-4.5-1.41-1.41-4.5 4.5V14H3v7h7zm4.5-10.09L19 6.41V10h2V3h-7v2h3.59l-4.5 4.5 1.41 1.41z" />
                                    </svg>
                                </div>
                            </div>
                        </el-form-item>
                    </div>
                </section>
            </div>

            <div class="request-mask-actions request-mask-actions-bottom" :class="{ 'is-embedded': embedded }">
                <xl-action-button type="primary" :show-icon="false" :text="t('system.requestMask.save')" :loading="saving" @click="handleSave" />
            </div>
        </el-form>

        <el-dialog v-model="expandDialogVisible" :title="currentExpandTitle" width="600px" append-to-body destroy-on-close class="request-mask-dialog">
            <el-input v-if="currentExpandField" v-model="maskConfigText[currentExpandField]" type="textarea" :rows="20" resize="none" :placeholder="t('system.requestMask.placeholder')" class="expanded-textarea" />
        </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import xlActionButton from '@/components/actionButton/index.vue'
import { useI18n } from 'vue-i18n'
import { fetchRequestLogMaskConfig, updateRequestLogMaskConfig } from '@/modules/system/service'
import type { RequestLogMaskConfig } from '@/types/system'
import { Logger } from '@/utils/logger'

interface Props {
    embedded?: boolean
}

const { embedded = false } = defineProps<Props>()

const { t } = useI18n()
const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const maskConfigText = reactive<Record<keyof RequestLogMaskConfig, string>>({
    common: '',
    request_header: '',
    request_body: '',
    response_header: '',
    response_body: '',
})

type MaskField = {
    key: keyof RequestLogMaskConfig
    label: string
}

const MASK_CONFIG_FIELDS: Array<keyof RequestLogMaskConfig> = ['common', 'request_header', 'request_body', 'response_header', 'response_body']

const expandDialogVisible = ref(false)
const currentExpandField = ref<keyof RequestLogMaskConfig | null>(null)
const currentExpandTitle = ref('')

const openExpandDialog = (field: keyof RequestLogMaskConfig, title: string) => {
    currentExpandField.value = field
    currentExpandTitle.value = title
    expandDialogVisible.value = true
}
const maskFieldGroups = computed<Array<{ title: string; fields: MaskField[] }>>(() => [
    {
        title: t('system.requestMask.requestGroup'),
        fields: [
            { key: 'request_header', label: t('system.requestMask.requestHeader') },
            { key: 'request_body', label: t('system.requestMask.requestBody') },
        ],
    },
    {
        title: t('system.requestMask.responseGroup'),
        fields: [
            { key: 'response_header', label: t('system.requestMask.responseHeader') },
            { key: 'response_body', label: t('system.requestMask.responseBody') },
        ],
    },
])

function parseMaskConfigText(text: string) {
    return text
        .split('\n')
        .map((item) => item.trim())
        .filter((item) => item !== '')
}

const loadConfig = async () => {
    loading.value = true
    try {
        const config = await fetchRequestLogMaskConfig()
        MASK_CONFIG_FIELDS.forEach((field) => {
            maskConfigText[field] = (config[field] || []).join('\n')
        })
    } catch (error) {
        Logger.error('获取请求日志脱敏配置失败:', error)
    } finally {
        loading.value = false
    }
}

const handleSave = async () => {
    if (saving.value) return
    await formRef.value?.validate().catch(() => {
        /* 校验不通过时静默中断 */
    })

    saving.value = true
    try {
        const payload = {
            common: parseMaskConfigText(maskConfigText.common),
            request_header: parseMaskConfigText(maskConfigText.request_header),
            request_body: parseMaskConfigText(maskConfigText.request_body),
            response_header: parseMaskConfigText(maskConfigText.response_header),
            response_body: parseMaskConfigText(maskConfigText.response_body),
        }
        await updateRequestLogMaskConfig(payload)
        ElMessage.success(t('common.result.updateSuccess'))
    } catch (error) {
        Logger.error('更新请求日志脱敏配置失败:', error)
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadConfig()
})
</script>

<style scoped lang="scss">
.request-mask-panel {
    padding: var(--xl-space-5);
    background-color: var(--xl-bg-color);
    border-radius: var(--xl-radius-lg);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
    transition: all 0.3s ease;
}

.request-mask-panel.is-embedded {
    padding: 0;
    background-color: transparent;
    box-shadow: none;
}

.request-mask-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--xl-space-4);
    margin-bottom: var(--xl-space-5);
    padding-bottom: var(--xl-space-4);
    border-bottom: 1px dashed var(--el-border-color-lighter);

    .header-content {
        flex: 1;
    }

    .title {
        display: flex;
        align-items: center;
        gap: var(--xl-space-2);
        margin: 0 0 10px;
        font-size: var(--xl-font-xl);
        font-weight: 600;
        color: var(--el-text-color-primary);

        .title-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: var(--xl-radius-md);
            background: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
        }
    }

    .desc-box {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px var(--xl-space-3);
        background-color: var(--el-color-info-light-9);
        border-radius: var(--xl-radius-md);
        color: var(--el-text-color-regular);
        font-size: var(--xl-font-md);

        .desc-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-color-info);
        }
    }
}

.request-mask-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
}

.request-mask-actions-bottom {
    display: flex;
    justify-content: flex-end;
    margin-top: var(--xl-space-5);
    padding-top: 20px;
    border-top: 1px dashed var(--el-border-color-lighter);
}

.request-mask-form {
    max-width: 1120px;
}

.request-mask-layout {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 20px;
}

.request-mask-section {
    position: relative;
    min-width: 0;
    padding: var(--xl-space-5);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: var(--xl-radius-lg);
    background-color: var(--el-bg-color);
    transition: all 0.3s var(--xl-ease-standard);
    overflow: hidden;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: var(--xl-space-1);
        height: 100%;
        background: transparent;
        transition: all 0.3s;
    }

    &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
        transform: translateY(-2px);
        border-color: var(--el-border-color-light);

        &::before {
            background: var(--el-color-primary);
        }
    }
}

.request-mask-section.is-full {
    grid-column: 1 / -1;

    &:hover::before {
        background: var(--el-color-success);
    }
}

.request-mask-section:nth-child(2):hover::before {
    background: var(--el-color-warning);
}

.request-mask-section:nth-child(3):hover::before {
    background: var(--el-color-danger);
}

.request-mask-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;

    .header-title {
        display: flex;
        align-items: center;
        gap: 10px;

        h4 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
            color: var(--el-text-color-primary);
        }

        .header-icon {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: var(--xl-radius-md);

            &.primary-icon {
                background: var(--el-color-success-light-9);
                color: var(--el-color-success);
            }
            &.warning-icon {
                background: var(--el-color-warning-light-9);
                color: var(--el-color-warning);
            }
            &.success-icon {
                background: var(--el-color-danger-light-9);
                color: var(--el-color-danger);
            }
        }
    }
}

.request-mask-fields {
    display: grid;
    gap: var(--xl-space-4);

    :deep(.el-form-item) {
        margin-bottom: 0;
    }

    :deep(.el-form-item__label) {
        padding-bottom: var(--xl-space-2);
        line-height: 20px;
        font-weight: 500;
        color: var(--el-text-color-regular);
    }
}

.textarea-wrapper {
    position: relative;
    width: 100%;

    .expand-icon {
        position: absolute;
        bottom: 6px;
        right: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: var(--xl-radius-md);
        background-color: var(--el-fill-color);
        color: var(--el-text-color-secondary);
        cursor: pointer;
        transition: all 0.2s var(--xl-ease-standard);
        z-index: 10;

        &:hover {
            background-color: var(--el-color-primary-light-9);
            color: var(--el-color-primary);
            transform: scale(1.05);
        }
    }
}

:deep(.el-textarea__inner) {
    resize: none;
    line-height: 1.6;
    border-radius: 8px;
    padding: var(--xl-space-3);
    font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
    font-size: var(--xl-font-md);
    background-color: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s var(--xl-ease-standard);
    box-shadow: none;

    &:hover {
        border-color: var(--el-border-color);
        background-color: var(--el-fill-color);
    }

    &:focus {
        background-color: var(--el-bg-color);
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 1px var(--el-color-primary) inset;
    }

    &::placeholder {
        font-family: var(--el-font-family);
    }
}

.fade-in-up {
    animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .request-mask-header {
        align-items: flex-start;
        flex-direction: column;
    }

    .request-mask-actions {
        width: 100%;
        justify-content: flex-end;
    }

    .request-mask-layout {
        grid-template-columns: 1fr;
    }

    .request-mask-section.is-full {
        grid-column: auto;
    }
}
</style>
