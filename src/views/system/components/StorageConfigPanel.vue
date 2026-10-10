<template>
    <div class="storage-panel" :class="{ 'is-embedded': embedded }">
        <div v-if="!embedded" class="panel-header">
            <div class="panel-title-wrapper">
                <span class="panel-title-bar"></span>
                <h3 class="panel-title">{{ t('system.storage.title') }}</h3>
            </div>
            <p class="panel-description">{{ t('system.storage.description') }}</p>
        </div>

        <el-skeleton v-if="loading" animated :rows="10" />

        <el-alert v-else-if="loadError" :title="t('system.storage.loadFailed')" type="error" :closable="false" show-icon>
            <el-button @click="loadConfig">{{ t('common.actions.retry') }}</el-button>
        </el-alert>

        <el-form v-else-if="configLoaded" ref="formRef" :model="formData" :rules="formRules" :validate-on-rule-change="false" label-width="170px" class="storage-form">
            <el-form-item :label="t('system.storage.activeDriver')" prop="active_driver">
                <el-radio-group v-model="formData.active_driver">
                    <el-radio-button v-for="item in driverOptions" :key="item.value" :value="item.value">
                        {{ item.label }}
                    </el-radio-button>
                </el-radio-group>
            </el-form-item>

            <el-divider />

            <component
                :is="activeProviderDefinition.component"
                v-if="activeProviderDefinition"
                :model-value="activeProviderConfig"
                v-bind="activeProviderComponentProps"
                @update:model-value="updateActiveProviderConfig"
                @toggle-secret="toggleActiveProviderSecret"
            />

            <el-alert v-else :title="t('system.storage.unknownDriverTitle')" :description="t('system.storage.unknownDriverDescription', { driver: formData.active_driver })" type="warning" :closable="false" show-icon />

            <el-divider />

            <el-row :gutter="16">
                <el-col :span="12">
                    <el-form-item :label="t('system.storage.signedUrlTtl')" prop="config.signed_url_ttl_seconds">
                        <el-input-number v-model="formData.config.signed_url_ttl_seconds" :min="0" :step="60" style="width: 100%" />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item :label="t('system.storage.maxFileSize')" prop="config.max_file_size_mb">
                        <el-input-number v-model="formData.config.max_file_size_mb" :min="0" style="width: 100%" />
                    </el-form-item>
                </el-col>
            </el-row>
            <el-form-item :label="t('system.storage.allowedExtensions')" prop="allowedExtensionsText">
                <el-input v-model="allowedExtensionsText" type="textarea" :rows="4" :placeholder="t('system.storage.allowedExtensionsPlaceholder')" />
            </el-form-item>

            <el-divider>
                <span class="divider-title">{{ t('system.storage.exportSettingTitle') }}</span>
            </el-divider>

            <el-row :gutter="16">
                <el-col :span="12">
                    <el-form-item :label="t('system.storage.exportTempFileTtl')" prop="config.export_temp_file_ttl_days">
                        <el-input-number v-model="formData.config.export_temp_file_ttl_days" :min="1" style="width: 100%" />
                    </el-form-item>
                </el-col>
            </el-row>

            <div class="panel-actions-bottom">
                <xl-action-button v-permission="'storage:test'" :text="t('system.storage.testConnection')" type="default" :show-icon="false" :loading="testing" :disabled="!configLoaded || loading || saving" @click="handleTest" />
                <xl-action-button v-permission="'storage:update'" :text="t('system.storage.save')" type="primary" :show-icon="false" :loading="saving" :disabled="!configLoaded || loading || testing" @click="handleSave" />
            </div>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import xlActionButton from '@/components/actionButton/index.vue'
import { useI18n } from 'vue-i18n'
import { fetchStorageConfig, fetchStorageSecret, testStorageConnection, updateStorageConfig } from '@/modules/system/service'
import { validateFormSafely } from '@/modules/shared/form'
import { Logger } from '@/utils/logger'
import { hasPermission } from '@/utils/auth'
import type { StorageConfig, StorageConfigPayload } from '@/types/system'
import { createRegisteredStorageProviderDefaults, mergeRegisteredStorageProviderDefaults, storageProviderForms, type StorageProviderConfig } from './storageProviders/registry'

interface Props {
    embedded?: boolean
}

const { embedded = false } = defineProps<Props>()

const { t } = useI18n()

const createDefaultForm = (): StorageConfig => ({
    active_driver: 'local',
    config: {
        ...(createRegisteredStorageProviderDefaults() as unknown as Pick<StorageConfig['config'], 'local' | 'aliyun_oss'>),
        signed_url_ttl_seconds: 600,
        max_file_size_mb: 20,
        allowed_mime_types: [],
        allowed_extensions: [],
        export_temp_file_ttl_days: 7,
    },
})

const formRef = ref<FormInstance>()
const loading = ref(false)
const configLoaded = ref(false)
const loadError = ref(false)
const saving = ref(false)
const testing = ref(false)
const allowedExtensionsText = ref('')
const formData = reactive(createDefaultForm())
type StorageSecretFieldPath = string

type StorageSecretFieldState = {
    maskedValue: string
    revealedValue: string
    loading: boolean
    revealed: boolean
}

const createSecretState = (): StorageSecretFieldState => ({
    maskedValue: '',
    revealedValue: '',
    loading: false,
    revealed: false,
})

const secretFieldState = reactive<Record<StorageSecretFieldPath, StorageSecretFieldState>>(
    Object.fromEntries(storageProviderForms.filter((provider) => provider.secretReveal).map((provider) => [`${provider.secretReveal!.driver}.${provider.secretReveal!.field}`, createSecretState()]))
)

const activeProviderDefinition = computed(() => storageProviderForms.find((provider) => provider.key === formData.active_driver) || null)
const activeProviderConfig = computed(() => {
    const definition = activeProviderDefinition.value
    if (!definition) return {}
    const configured = formData.config[definition.key]
    return configured && typeof configured === 'object' ? (configured as StorageProviderConfig) : definition.createDefaultConfig()
})
const driverOptions = computed(() => {
    const options = storageProviderForms.map((provider) => ({ label: provider.labelKey ? t(provider.labelKey) : provider.label, value: provider.key }))
    if (!activeProviderDefinition.value && formData.active_driver) {
        options.push({ label: formData.active_driver, value: formData.active_driver })
    }
    return options
})
const canViewSensitive = computed(() => hasPermission('storage:secret', true))

const formRules = computed(() => ({
    active_driver: [{ required: true, message: t('system.storage.form.driverRequired'), trigger: 'change' }],
}))

const activeProviderComponentProps = computed(() => {
    const reveal = activeProviderDefinition.value?.secretReveal
    if (!reveal) return {}
    const field = `${reveal.driver}.${reveal.field}` as StorageSecretFieldPath
    return {
        canViewSensitive: canViewSensitive.value,
        secretHasValue: hasSensitiveValue(field),
        secretLoading: isSecretFieldLoading(field),
        secretRevealed: isSecretFieldRevealed(field),
    }
})

const updateActiveProviderConfig = (value: StorageProviderConfig) => {
    const definition = activeProviderDefinition.value
    if (definition) formData.config[definition.key] = value
}

const toggleActiveProviderSecret = () => {
    const reveal = activeProviderDefinition.value?.secretReveal
    if (reveal) void toggleSecretField(`${reveal.driver}.${reveal.field}` as StorageSecretFieldPath)
}

const secretProviderDefinition = (field: StorageSecretFieldPath) => storageProviderForms.find((provider) => provider.secretReveal && `${provider.secretReveal.driver}.${provider.secretReveal.field}` === field)

const getSecretFieldValue = (field: StorageSecretFieldPath) => {
    const definition = secretProviderDefinition(field)
    const config = definition ? formData.config[definition.key] : null
    return definition?.secretReveal && config && typeof config === 'object' ? definition.secretReveal.getValue(config as StorageProviderConfig) : ''
}

const setSecretFieldValue = (field: StorageSecretFieldPath, value: string) => {
    const definition = secretProviderDefinition(field)
    const config = definition ? formData.config[definition.key] : null
    if (definition?.secretReveal && config && typeof config === 'object') definition.secretReveal.setValue(config as StorageProviderConfig, value)
}

const resetSecretFieldState = () => {
    for (const definition of storageProviderForms) {
        const reveal = definition.secretReveal
        if (!reveal) continue
        const field = `${reveal.driver}.${reveal.field}`
        const state = (secretFieldState[field] ||= createSecretState())
        state.maskedValue = getSecretFieldValue(field)
        state.revealedValue = ''
        state.loading = false
        state.revealed = false
    }
}

const hasSensitiveValue = (field: StorageSecretFieldPath) => {
    const state = secretFieldState[field] || createSecretState()
    return Boolean(String(state.maskedValue || getSecretFieldValue(field) || '').trim())
}

const isSecretFieldLoading = (field: StorageSecretFieldPath) => secretFieldState[field]?.loading || false
const isSecretFieldRevealed = (field: StorageSecretFieldPath) => secretFieldState[field]?.revealed || false

const toggleSecretField = async (field: StorageSecretFieldPath) => {
    if (!canViewSensitive.value) return
    const definition = secretProviderDefinition(field)
    const reveal = definition?.secretReveal
    if (!reveal) return
    const state = (secretFieldState[field] ||= createSecretState())
    if (state.loading || !hasSensitiveValue(field)) return
    if (state.revealed) {
        if (getSecretFieldValue(field) === state.revealedValue) {
            setSecretFieldValue(field, state.maskedValue)
        }
        state.revealed = false
        return
    }
    state.loading = true
    try {
        const secret = await fetchStorageSecret(reveal.driver, reveal.field)
        state.maskedValue = state.maskedValue || getSecretFieldValue(field)
        state.revealedValue = secret
        setSecretFieldValue(field, secret)
        state.revealed = true
    } catch (error) {
        Logger.error('获取存储敏感信息失败:', error)
    } finally {
        state.loading = false
    }
}

const applyConfig = (config: StorageConfig) => {
    const defaults = createDefaultForm()
    const merged: StorageConfig = {
        active_driver: config.active_driver || defaults.active_driver,
        config: {
            ...mergeRegisteredStorageProviderDefaults(config.config || defaults.config),
            signed_url_ttl_seconds: config.config?.signed_url_ttl_seconds ?? defaults.config.signed_url_ttl_seconds,
            max_file_size_mb: config.config?.max_file_size_mb ?? defaults.config.max_file_size_mb,
            allowed_mime_types: config.config?.allowed_mime_types ?? defaults.config.allowed_mime_types,
            allowed_extensions: config.config?.allowed_extensions ?? defaults.config.allowed_extensions,
            export_temp_file_ttl_days: config.config?.export_temp_file_ttl_days ?? defaults.config.export_temp_file_ttl_days,
        },
    }
    Object.assign(formData, merged)
    allowedExtensionsText.value = Array.isArray(merged.config.allowed_extensions) ? merged.config.allowed_extensions.join('\n') : String(merged.config.allowed_extensions || '')
    resetSecretFieldState()
}

const buildPayload = (): StorageConfigPayload => ({
    active_driver: formData.active_driver,
    config: {
        ...formData.config,
        local: { ...formData.config.local },
        aliyun_oss: { ...formData.config.aliyun_oss },
        signed_url_ttl_seconds: Number(formData.config.signed_url_ttl_seconds || 0),
        max_file_size_mb: Number(formData.config.max_file_size_mb || 0),
        allowed_mime_types: formData.config.allowed_mime_types || [],
        allowed_extensions: allowedExtensionsText.value
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter(Boolean),
        export_temp_file_ttl_days: Number(formData.config.export_temp_file_ttl_days || 0),
    },
})

const validateForm = async () => {
    if (!formRef.value) return false
    return await validateFormSafely(formRef.value, 'system-storage-form')
}

const loadConfig = async () => {
    loading.value = true
    configLoaded.value = false
    loadError.value = false
    try {
        const config = await fetchStorageConfig()
        applyConfig(config)
        configLoaded.value = true
    } catch (error) {
        loadError.value = true
        Logger.error('获取存储配置失败:', error)
    } finally {
        loading.value = false
    }
}

const handleTest = async () => {
    if (!configLoaded.value || loading.value || saving.value || testing.value) return
    if (!(await validateForm())) return
    testing.value = true
    try {
        const result = await testStorageConnection(buildPayload())
        ElMessage.success(result.message || t('system.storage.testSuccess'))
    } catch (error) {
        Logger.error('测试存储连接失败:', error)
    } finally {
        testing.value = false
    }
}

const handleSave = async () => {
    if (!configLoaded.value || loading.value || saving.value || testing.value) return
    if (!(await validateForm())) return
    saving.value = true
    try {
        await updateStorageConfig(buildPayload())
        ElMessage.success(t('common.result.updateSuccess'))
        await loadConfig()
    } catch (error) {
        Logger.error('保存存储配置失败:', error)
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadConfig()
})
</script>

<style scoped lang="scss">
.storage-panel {
    padding: 20px;
    background-color: var(--xl-bg-color);
    border-radius: 12px;
    border: 1px solid var(--el-border-color-lighter);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.storage-panel.is-embedded {
    padding: 0;
    border-radius: 0;
    background-color: transparent;
    border: none;
    box-shadow: none;
}

.panel-header {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--el-border-color-lighter);

    .panel-title-wrapper {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .panel-title-bar {
        width: 4px;
        height: 18px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
        flex-shrink: 0;
    }

    .panel-title {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.4;
        color: var(--el-text-color-primary);
    }

    .panel-description {
        margin: 8px 0 0 14px;
        font-size: 13px;
        color: var(--el-text-color-secondary);
        line-height: 1.5;
    }
}

.panel-actions-bottom {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--el-border-color-lighter);
}

.storage-form {
    max-width: 980px;
}

.divider-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--el-text-color-regular);
}
</style>
