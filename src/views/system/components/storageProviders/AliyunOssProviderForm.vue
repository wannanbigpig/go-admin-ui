<template>
    <div class="storage-provider-form">
        <el-row :gutter="16">
            <el-col :span="12">
                <el-form-item :label="t('system.storage.endpoint')" prop="config.aliyun_oss.endpoint" :rules="requiredRule(t('system.storage.form.endpointRequired'))">
                    <el-input v-model.trim="config.endpoint" />
                </el-form-item>
            </el-col>
            <el-col :span="12">
                <el-form-item :label="t('system.storage.region')" prop="config.aliyun_oss.region" :rules="requiredRule(t('system.storage.form.regionRequired'))">
                    <el-input v-model.trim="config.region" />
                </el-form-item>
            </el-col>
        </el-row>
        <el-form-item :label="t('system.storage.bucket')" prop="config.aliyun_oss.bucket" :rules="requiredRule(t('system.storage.form.bucketRequired'))">
            <el-input v-model.trim="config.bucket" />
        </el-form-item>
        <el-row :gutter="16">
            <el-col :span="12">
                <el-form-item :label="t('system.storage.accessKeyId')" prop="config.aliyun_oss.access_key_id">
                    <el-input v-model.trim="config.access_key_id" />
                </el-form-item>
            </el-col>
            <el-col :span="12">
                <el-form-item :label="t('system.storage.accessKeySecret')" prop="config.aliyun_oss.access_key_secret">
                    <el-input v-model.trim="config.access_key_secret" :type="secretRevealed ? 'text' : 'password'" :placeholder="t('system.storage.secretPlaceholder')">
                        <template v-if="canViewSensitive && secretHasValue" #suffix>
                            <el-icon size="16" class="xl-cursor-hover" @click="emit('toggle-secret')">
                                <i-ep-loading v-if="secretLoading" />
                                <i-ant-design-eye-invisible-outlined v-else-if="secretRevealed" />
                                <i-ant-design-eye-outlined v-else />
                            </el-icon>
                        </template>
                    </el-input>
                </el-form-item>
            </el-col>
        </el-row>
        <el-row :gutter="16">
            <el-col :span="12">
                <el-form-item :label="t('system.storage.publicDomain')" prop="config.aliyun_oss.public_domain">
                    <el-input v-model.trim="config.public_domain" />
                </el-form-item>
            </el-col>
            <el-col :span="12">
                <el-form-item :label="t('system.storage.internalEndpoint')" prop="config.aliyun_oss.internal_endpoint">
                    <el-input v-model.trim="config.internal_endpoint" />
                </el-form-item>
            </el-col>
        </el-row>
        <el-form-item :label="t('system.storage.forcePathStyle')" prop="config.aliyun_oss.force_path_style">
            <el-switch v-model="config.force_path_style" />
        </el-form-item>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { StorageConfig } from '@/types/system'

withDefaults(
    defineProps<{
        canViewSensitive?: boolean
        secretHasValue?: boolean
        secretLoading?: boolean
        secretRevealed?: boolean
    }>(),
    { canViewSensitive: false, secretHasValue: false, secretLoading: false, secretRevealed: false }
)
const emit = defineEmits<{ 'toggle-secret': [] }>()
const config = defineModel<StorageConfig['config']['aliyun_oss']>({ required: true })
const { t } = useI18n()
const requiredRule = (message: string) => [{ required: true, message, trigger: 'blur' }]
</script>
