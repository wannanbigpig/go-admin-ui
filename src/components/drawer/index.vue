<template>
    <el-drawer v-model="model" :direction="direction" :size="size" @closed="handleClosed">
        <template #header>
            <h4>{{ title }}</h4>
        </template>
        <template #default>
            <slot />
        </template>
        <template #footer>
            <slot name="footer">
                <el-divider />
                <div class="drawer-footer">
                    <el-button v-if="withReset" type="warning" @click="handleReset">{{ t('common.actions.reset') }}</el-button>
                    <el-button @click="handleCancel">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" :disabled="isSubmitting" :loading="isSubmitting" @click="handleConfirm">
                        {{ isSubmitting ? t('common.actions.submitting') : t('common.actions.submit') }}
                    </el-button>
                </div>
            </slot>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { Logger } from '@/utils/logger'
import { useI18n } from 'vue-i18n'

// ==================== Props 定义 ====================
interface Props {
    direction?: 'ltr' | 'rtl' | 'ttb' | 'btt'
    title?: string
    withReset?: boolean
    isSubmitting?: boolean
    size?: string | number
    onConfirm?: () => void | Promise<void>
    onReset?: () => void
    onCancel?: () => void
    formRef?: FormInstance | null
}

const props = withDefaults(defineProps<Props>(), {
    direction: 'rtl',
    title: '',
    withReset: true,
    isSubmitting: false,
    size: '30%',
    formRef: null,
})
const { t } = useI18n()

// ==================== 响应式数据 ====================
const model = defineModel<boolean>()

// ==================== 方法 ====================
const handleReset = () => {
    if (props.onReset) {
        props.onReset()
    } else if (props.formRef?.resetFields) {
        props.formRef.resetFields()
    } else {
        Logger.warn(t('validation.drawer.resetOrFormRefRequired'))
    }
}

const handleCancel = () => {
    if (props.onCancel) {
        props.onCancel()
    } else {
        model.value = false
    }
}

const handleConfirm = () => {
    if (props.onConfirm) {
        props.onConfirm()
    } else {
        Logger.error(t('validation.drawer.onConfirmRequired'))
    }
}

const handleClosed = () => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement) {
        activeElement.blur()
    }
}
</script>

<style lang="scss" scoped>
.drawer-footer {
    display: flex;
    justify-content: flex-end;
}
</style>
