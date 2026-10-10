<template>
    <el-drawer v-model="model" :title="title" :direction="direction" :size="resolvedSize" :before-close="handleBeforeClose">
        <template #header="{ titleId, titleClass }">
            <h4 :id="titleId" :class="titleClass">{{ title }}</h4>
        </template>
        <template #default>
            <slot />
        </template>
        <template #footer>
            <slot name="footer">
                <div class="drawer-footer">
                    <el-button v-if="withReset" type="warning" :disabled="isSubmitting || loading" @click="handleReset">{{ t('common.actions.reset') }}</el-button>
                    <el-button @click="handleCancel">{{ t('common.actions.cancel') }}</el-button>
                    <el-button type="primary" :disabled="isSubmitting || loading" :loading="isSubmitting" @click="handleConfirm">
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
import { computed } from 'vue'

// ==================== Props 定义 ====================
type DrawerSizeToken = 'sm' | 'md' | 'lg'

interface Props {
    direction?: 'ltr' | 'rtl' | 'ttb' | 'btt'
    title?: string
    withReset?: boolean
    isSubmitting?: boolean
    loading?: boolean
    size?: DrawerSizeToken | string | number
    onConfirm?: () => void | Promise<void>
    onReset?: () => void
    onCancel?: () => void
    beforeClose?: (done: () => void) => void
    formRef?: FormInstance | null
}

const props = withDefaults(defineProps<Props>(), {
    direction: 'rtl',
    title: '',
    withReset: true,
    isSubmitting: false,
    loading: false,
    size: 'md',
    formRef: null,
})

// 把语义化 size token 映射成 CSS clamp() 表达式；其他字符串/数字原样透传
const SIZE_TOKEN_MAP: Record<DrawerSizeToken, string> = {
    sm: 'var(--xl-drawer-sm)',
    md: 'var(--xl-drawer-md)',
    lg: 'var(--xl-drawer-lg)',
}

const resolvedSize = computed<string | number>(() => {
    const raw = props.size
    if (typeof raw === 'string' && raw in SIZE_TOKEN_MAP) {
        return SIZE_TOKEN_MAP[raw as DrawerSizeToken]
    }
    return raw
})
const { t } = useI18n()

// ==================== 响应式数据 ====================
const model = defineModel<boolean>()

// ==================== 方法 ====================
const handleReset = () => {
    if (props.isSubmitting || props.loading) return
    if (props.onReset) {
        props.onReset()
    } else if (props.formRef?.resetFields) {
        props.formRef.resetFields()
    } else {
        Logger.warn(t('validation.drawer.resetOrFormRefRequired'))
    }
}

const handleBeforeClose = (done: () => void) => {
    if (props.beforeClose) props.beforeClose(done)
    else done()
}

const handleCancel = () =>
    handleBeforeClose(() => {
        if (props.onCancel) props.onCancel()
        else model.value = false
    })

const handleConfirm = async () => {
    if (props.isSubmitting || props.loading) return
    if (props.onConfirm) {
        try {
            await props.onConfirm()
        } catch (error) {
            Logger.error('Drawer onConfirm error:', error)
        }
    } else {
        Logger.error(t('validation.drawer.onConfirmRequired'))
    }
}
</script>

<style lang="scss" scoped>
.drawer-footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-top: 1px solid var(--el-border-color-lighter);
    padding-top: 16px;
}
</style>
