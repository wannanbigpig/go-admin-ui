<template>
    <el-dialog v-model="visible" :title="t('todo.reminder.title')" width="520px" destroy-on-close>
        <el-skeleton v-if="loading" animated :rows="4" />
        <el-form v-else label-position="top" class="reminder-form">
            <el-form-item :label="t('todo.reminder.inApp')">
                <el-switch v-model="form.in_app_enabled" />
                <span class="field-tip">{{ t('todo.reminder.inAppHint') }}</span>
            </el-form-item>
            <el-form-item :label="t('todo.reminder.sms')">
                <el-switch v-model="form.sms_enabled" :disabled="!smsAvailable" />
                <span class="field-tip">{{ t('todo.reminder.smsHint') }}</span>
            </el-form-item>
            <el-alert v-if="!smsAvailable" type="warning" :closable="false" show-icon>
                <template #title>
                    <span>{{ t('todo.reminder.phoneMissing') }}</span>
                    <el-button link type="primary" @click="goToProfile">{{ t('todo.reminder.goToProfile') }}</el-button>
                </template>
            </el-alert>
            <el-alert class="system-setting-tip" type="info" :title="t('todo.reminder.systemLeadHint')" :closable="false" show-icon />
        </el-form>
        <template #footer>
            <el-button @click="visible = false">{{ t('common.actions.cancel') }}</el-button>
            <el-button type="primary" :loading="saving" :disabled="loading" @click="save">{{ t('todo.reminder.save') }}</el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
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
const form = reactive({ in_app_enabled: true, sms_enabled: false })

const load = async () => {
    loading.value = true
    try {
        const preference = await fetchTodoReminderPreference()
        smsAvailable.value = preference.sms_available
        form.in_app_enabled = preference.in_app_enabled
        form.sms_enabled = preference.sms_available && preference.sms_enabled
    } catch (error) {
        Logger.error('获取待办提醒偏好失败:', error)
    } finally {
        loading.value = false
    }
}

const save = async () => {
    if (loading.value || saving.value) return
    saving.value = true
    try {
        const preference = await submitTodoReminderPreference({
            in_app_enabled: form.in_app_enabled,
            sms_enabled: smsAvailable.value && form.sms_enabled,
        })
        smsAvailable.value = preference.sms_available
        form.in_app_enabled = preference.in_app_enabled
        form.sms_enabled = preference.sms_available && preference.sms_enabled
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
.reminder-form {
    display: flex;
    flex-direction: column;
    gap: var(--xl-space-2);
}

.field-tip {
    margin-left: var(--xl-space-3);
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
}

.system-setting-tip {
    margin-top: var(--xl-space-2);
}
</style>
