<template>
    <div class="storage-provider-form">
        <el-form-item :label="t('system.storage.local.basePath')" prop="config.local.base_path" :rules="requiredRule(t('system.storage.form.basePathRequired'))">
            <el-input v-model.trim="config.base_path" :placeholder="t('system.storage.local.basePathPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('system.storage.local.publicBasePath')" prop="config.local.public_base_path">
            <el-input v-model.trim="config.public_base_path" :placeholder="t('system.storage.local.publicBasePathPlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('system.storage.local.privateBasePath')" prop="config.local.private_base_path">
            <el-input v-model.trim="config.private_base_path" :placeholder="t('system.storage.local.privateBasePathPlaceholder')" />
        </el-form-item>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { StorageConfig } from '@/types/system'

defineOptions({ inheritAttrs: false })
defineEmits<{ 'toggle-secret': [] }>()
const config = defineModel<StorageConfig['config']['local']>({ required: true })
const { t } = useI18n()
const requiredRule = (message: string) => [{ required: true, message, trigger: 'blur' }]
</script>
