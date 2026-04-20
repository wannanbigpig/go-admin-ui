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
                    <el-button v-if="withReset" type="warning" @click="handleReset">重置</el-button>
                    <el-button @click="handleCancel">取消</el-button>
                    <el-button type="primary" :disabled="isSubmitting" :loading="isSubmitting" @click="handleConfirm">
                        {{ isSubmitting ? '提交中...' : '提交' }}
                    </el-button>
                </div>
            </slot>
        </template>
    </el-drawer>
</template>

<script setup lang="ts">
import type { FormInstance } from 'element-plus'
import { Logger } from '@/utils/logger'

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

// ==================== 响应式数据 ====================
const model = defineModel<boolean>()

// ==================== 方法 ====================
const handleReset = () => {
    if (props.onReset) {
        props.onReset()
    } else if (props.formRef?.resetFields) {
        props.formRef.resetFields()
    } else {
        Logger.warn('[XlDrawer] 自定义重置方法和表单Ref二者必传一个')
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
        Logger.error('[XlDrawer] onConfirm 必传')
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
