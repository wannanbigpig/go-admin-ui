<template>
    <div class="storage-panel" :class="{ 'is-embedded': embedded }">
        <div v-if="!embedded" class="storage-header">
            <div>
                <h3>{{ t('system.storage.title') }}</h3>
                <p>{{ t('system.storage.description') }}</p>
            </div>
            <div class="storage-actions">
                <xl-action-button v-permission="'storage:test'" :text="t('system.storage.testConnection')" type="primary" :show-icon="false" :loading="testing" @click="handleTest" />
                <xl-action-button v-permission="'storage:update'" :text="t('system.storage.save')" type="primary" :show-icon="false" :loading="saving" @click="handleSave" />
            </div>
        </div>

        <el-skeleton v-if="loading" animated :rows="10" />

        <el-form v-else ref="formRef" :model="formData" :rules="formRules" :validate-on-rule-change="false" label-width="170px" class="storage-form">
            <el-form-item :label="t('system.storage.activeDriver')" prop="active_driver">
                <el-radio-group v-model="formData.active_driver">
                    <el-radio-button v-for="item in driverOptions" :key="item.value" :value="item.value">
                        {{ item.label }}
                    </el-radio-button>
                </el-radio-group>
            </el-form-item>

            <el-divider />

            <template v-if="formData.active_driver === 'local'">
                <el-form-item :label="t('system.storage.local.basePath')" prop="config.local.base_path">
                    <el-input v-model.trim="formData.config.local.base_path" :placeholder="t('system.storage.local.basePathPlaceholder')" />
                </el-form-item>
                <el-form-item :label="t('system.storage.local.publicBasePath')" prop="config.local.public_base_path">
                    <el-input v-model.trim="formData.config.local.public_base_path" :placeholder="t('system.storage.local.publicBasePathPlaceholder')" />
                </el-form-item>
                <el-form-item :label="t('system.storage.local.privateBasePath')" prop="config.local.private_base_path">
                    <el-input v-model.trim="formData.config.local.private_base_path" :placeholder="t('system.storage.local.privateBasePathPlaceholder')" />
                </el-form-item>
            </template>

            <template v-else-if="formData.active_driver === 'aliyun_oss'">
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.endpoint')" prop="config.aliyun_oss.endpoint">
                            <el-input v-model.trim="formData.config.aliyun_oss.endpoint" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.region')" prop="config.aliyun_oss.region">
                            <el-input v-model.trim="formData.config.aliyun_oss.region" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('system.storage.bucket')" prop="config.aliyun_oss.bucket">
                    <el-input v-model.trim="formData.config.aliyun_oss.bucket" />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.accessKeyId')" prop="config.aliyun_oss.access_key_id">
                            <el-input v-model.trim="formData.config.aliyun_oss.access_key_id" :placeholder="t('system.storage.secretPlaceholder')" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.accessKeySecret')" prop="config.aliyun_oss.access_key_secret">
                            <el-input v-model.trim="formData.config.aliyun_oss.access_key_secret" type="password" show-password :placeholder="t('system.storage.secretPlaceholder')" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.publicDomain')" prop="config.aliyun_oss.public_domain">
                            <el-input v-model.trim="formData.config.aliyun_oss.public_domain" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.internalEndpoint')" prop="config.aliyun_oss.internal_endpoint">
                            <el-input v-model.trim="formData.config.aliyun_oss.internal_endpoint" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('system.storage.forcePathStyle')" prop="config.aliyun_oss.force_path_style">
                    <el-switch v-model="formData.config.aliyun_oss.force_path_style" />
                </el-form-item>
            </template>

            <template v-else>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.endpoint')" prop="config.s3.endpoint">
                            <el-input v-model.trim="formData.config.s3.endpoint" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.region')" prop="config.s3.region">
                            <el-input v-model.trim="formData.config.s3.region" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('system.storage.bucket')" prop="config.s3.bucket">
                    <el-input v-model.trim="formData.config.s3.bucket" />
                </el-form-item>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.accessKeyId')" prop="config.s3.access_key_id">
                            <el-input v-model.trim="formData.config.s3.access_key_id" :placeholder="t('system.storage.secretPlaceholder')" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.secretAccessKey')" prop="config.s3.secret_access_key">
                            <el-input v-model.trim="formData.config.s3.secret_access_key" type="password" show-password :placeholder="t('system.storage.secretPlaceholder')" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="16">
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.publicDomain')" prop="config.s3.public_domain">
                            <el-input v-model.trim="formData.config.s3.public_domain" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('system.storage.forcePathStyle')" prop="config.s3.force_path_style">
                            <el-switch v-model="formData.config.s3.force_path_style" />
                        </el-form-item>
                    </el-col>
                </el-row>
            </template>

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
            <el-form-item :label="t('system.storage.allowedMimeTypes')" prop="allowedMimeTypesText">
                <el-input v-model="allowedMimeTypesText" type="textarea" :rows="4" :placeholder="t('system.storage.allowedMimeTypesPlaceholder')" />
            </el-form-item>

            <div class="storage-actions storage-actions-bottom" :class="{ 'is-embedded': embedded }">
                <xl-action-button v-permission="'storage:test'" :text="t('system.storage.testConnection')" type="primary" :show-icon="false" :loading="testing" @click="handleTest" />
                <xl-action-button v-permission="'storage:update'" :text="t('system.storage.save')" type="primary" :show-icon="false" :loading="saving" @click="handleSave" />
            </div>
        </el-form>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import xlActionButton from '@/components/actionButton/index.vue'
import { useI18n } from 'vue-i18n'
import { fetchStorageConfig, testStorageConnection, updateStorageConfig } from '@/modules/system/service'
import { validateFormSafely } from '@/modules/shared/form'
import { Logger } from '@/utils/logger'
import type { StorageConfig, StorageConfigPayload } from '@/types/system'

interface Props {
    embedded?: boolean
}

const { embedded = false } = defineProps<Props>()

const { t } = useI18n()

const createDefaultForm = (): StorageConfig => ({
    active_driver: 'local',
    config: {
        local: {
            base_path: '',
            public_base_path: '',
            private_base_path: '',
        },
        aliyun_oss: {
            endpoint: '',
            region: '',
            bucket: '',
            access_key_id: '',
            access_key_secret: '',
            public_domain: '',
            internal_endpoint: '',
            force_path_style: false,
        },
        s3: {
            endpoint: '',
            region: '',
            bucket: '',
            access_key_id: '',
            secret_access_key: '',
            public_domain: '',
            force_path_style: false,
        },
        signed_url_ttl_seconds: 600,
        max_file_size_mb: 20,
        allowed_mime_types: [],
    },
})

const formRef = ref<FormInstance>()
const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const allowedMimeTypesText = ref('')
const formData = reactive(createDefaultForm())

const driverOptions = computed(() => [
    { label: t('system.storage.drivers.local'), value: 'local' },
    { label: t('system.storage.drivers.aliyunOss'), value: 'aliyun_oss' },
    { label: t('system.storage.drivers.s3'), value: 's3' },
])

const formRules = computed(() => ({
    active_driver: [{ required: true, message: t('system.storage.form.driverRequired'), trigger: 'change' }],
    'config.local.base_path': [{ required: formData.active_driver === 'local', message: t('system.storage.form.basePathRequired'), trigger: 'blur' }],
    'config.aliyun_oss.endpoint': [{ required: formData.active_driver === 'aliyun_oss', message: t('system.storage.form.endpointRequired'), trigger: 'blur' }],
    'config.aliyun_oss.region': [{ required: formData.active_driver === 'aliyun_oss', message: t('system.storage.form.regionRequired'), trigger: 'blur' }],
    'config.aliyun_oss.bucket': [{ required: formData.active_driver === 'aliyun_oss', message: t('system.storage.form.bucketRequired'), trigger: 'blur' }],
    'config.s3.region': [{ required: formData.active_driver === 's3', message: t('system.storage.form.regionRequired'), trigger: 'blur' }],
    'config.s3.bucket': [{ required: formData.active_driver === 's3', message: t('system.storage.form.bucketRequired'), trigger: 'blur' }],
}))

const isMaskedValue = (value?: string) => {
    const text = String(value || '').trim()
    return text !== '' && /^[*•]+$/.test(text)
}

const keepEditableSecret = (value?: string) => (isMaskedValue(value) ? '' : value || '')

const applyConfig = (config: StorageConfig) => {
    const defaults = createDefaultForm()
    const merged: StorageConfig = {
        active_driver: config.active_driver || defaults.active_driver,
        config: {
            local: { ...defaults.config.local, ...(config.config?.local || {}) },
            aliyun_oss: { ...defaults.config.aliyun_oss, ...(config.config?.aliyun_oss || {}) },
            s3: { ...defaults.config.s3, ...(config.config?.s3 || {}) },
            signed_url_ttl_seconds: config.config?.signed_url_ttl_seconds ?? defaults.config.signed_url_ttl_seconds,
            max_file_size_mb: config.config?.max_file_size_mb ?? defaults.config.max_file_size_mb,
            allowed_mime_types: config.config?.allowed_mime_types ?? defaults.config.allowed_mime_types,
        },
    }
    merged.config.aliyun_oss.access_key_id = keepEditableSecret(merged.config.aliyun_oss.access_key_id)
    merged.config.aliyun_oss.access_key_secret = keepEditableSecret(merged.config.aliyun_oss.access_key_secret)
    merged.config.s3.access_key_id = keepEditableSecret(merged.config.s3.access_key_id)
    merged.config.s3.secret_access_key = keepEditableSecret(merged.config.s3.secret_access_key)
    Object.assign(formData, merged)
    allowedMimeTypesText.value = Array.isArray(merged.config.allowed_mime_types) ? merged.config.allowed_mime_types.join('\n') : String(merged.config.allowed_mime_types || '')
}

const buildPayload = (): StorageConfigPayload => ({
    active_driver: formData.active_driver,
    config: {
        local: { ...formData.config.local },
        aliyun_oss: { ...formData.config.aliyun_oss },
        s3: { ...formData.config.s3 },
        signed_url_ttl_seconds: Number(formData.config.signed_url_ttl_seconds || 0),
        max_file_size_mb: Number(formData.config.max_file_size_mb || 0),
        allowed_mime_types: allowedMimeTypesText.value
            .split(/\r?\n|,/)
            .map((item) => item.trim())
            .filter(Boolean),
    },
})

const validateForm = async () => {
    if (!formRef.value) return false
    return await validateFormSafely(formRef.value, 'system-storage-form')
}

const loadConfig = async () => {
    loading.value = true
    try {
        const config = await fetchStorageConfig()
        applyConfig(config)
    } catch (error) {
        Logger.error('获取存储配置失败:', error)
    } finally {
        loading.value = false
    }
}

const handleTest = async () => {
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
    border-radius: 8px;
}

.storage-panel.is-embedded {
    padding: 0;
    background-color: transparent;
}

.storage-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 18px;

    h3 {
        margin: 0 0 6px;
        font-size: 18px;
        font-weight: 600;
    }

    p {
        margin: 0;
        color: var(--el-text-color-secondary);
        line-height: 1.5;
    }
}

.storage-actions {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
}

.storage-actions-bottom {
    justify-content: flex-end;
    margin-top: 18px;
}

.storage-form {
    max-width: 980px;
}

@media (max-width: 768px) {
    .storage-header {
        flex-direction: column;
    }

    .storage-actions {
        width: 100%;
    }
}
</style>
