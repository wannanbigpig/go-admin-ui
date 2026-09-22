<template>
    <div class="sms-provider-form">
        <el-form-item :label="t('system.sms.aliyunEnabled')" prop="providers.aliyun.enabled">
            <el-switch v-model="config.enabled" />
        </el-form-item>
        <el-row :gutter="16">
            <el-col :span="12">
                <el-form-item label="AccessKey ID" prop="providers.aliyun.access_key_id">
                    <el-input v-model.trim="config.access_key_id" autocomplete="off" />
                </el-form-item>
            </el-col>
            <el-col :span="12">
                <el-form-item label="AccessKey Secret" prop="providers.aliyun.access_key_secret">
                    <el-input v-model.trim="config.access_key_secret" type="password" autocomplete="new-password" :placeholder="t('system.sms.secretPlaceholder')" />
                </el-form-item>
            </el-col>
        </el-row>
        <el-form-item label="Endpoint" prop="providers.aliyun.endpoint">
            <div class="sms-field-stack">
                <el-input v-model.trim="config.endpoint" readonly />
                <span class="sms-field-tip">{{ t('system.sms.endpointHint') }}</span>
            </div>
        </el-form-item>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { SmsAliyunProviderConfig } from '@/types/system'

const config = defineModel<SmsAliyunProviderConfig>({ required: true })
const { t } = useI18n()
</script>

<style scoped>
.sms-field-stack {
    width: 100%;
}

.sms-field-tip {
    display: block;
    margin-top: 6px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.5;
}
</style>
