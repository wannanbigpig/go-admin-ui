<template>
    <el-dialog :model-value="modelValue" :title="title" width="520px" append-to-body @close="emit('update:modelValue', false)">
        <div class="confirm-delete-content">
            <el-alert :title="warningMessage" type="warning" :closable="false" show-icon class="warning-alert" />

            <div v-if="references && references.length > 0" class="references-section">
                <div class="references-title">{{ t('system.file.references') }}</div>
                <el-table :data="references" border size="small" max-height="200" class="references-table">
                    <el-table-column prop="source_name" :label="t('system.file.referenceSource')" min-width="120" show-overflow-tooltip />
                    <el-table-column prop="field_name" :label="t('system.file.referenceField')" min-width="140">
                        <template #default="{ row }">
                            <span class="field-label">{{ row.owner_field }}</span>
                            <span v-if="row.field_name" class="field-remark">({{ row.field_name }})</span>
                        </template>
                    </el-table-column>
                </el-table>
            </div>

            <div class="confirm-input-section">
                <div class="confirm-label">{{ t('system.file.typeNameToConfirm', { name: confirmName }) }}</div>
                <el-input v-model="typedName" :placeholder="confirmName" clearable @keyup.enter="handleConfirm" />
            </div>
        </div>

        <template #footer>
            <el-button @click="emit('update:modelValue', false)">{{ t('common.actions.cancel') }}</el-button>
            <el-button type="danger" :disabled="typedName !== confirmName" :loading="loading" @click="handleConfirm">
                {{ t('common.actions.delete') }}
            </el-button>
        </template>
    </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SystemFileReference } from '@/types/system'

const { t } = useI18n()

interface Props {
    modelValue: boolean
    title: string
    warningMessage: string
    confirmName: string
    references?: SystemFileReference[]
    loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    references: () => [],
    loading: false,
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm'): void
}>()

const typedName = ref('')

// 弹窗打开时清空输入
watch(
    () => props.modelValue,
    (val) => {
        if (val) typedName.value = ''
    }
)

const handleConfirm = () => {
    if (typedName.value === props.confirmName) {
        emit('confirm')
    }
}
</script>

<style scoped lang="scss">
.confirm-delete-content {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.warning-alert {
    :deep(.el-alert__title) {
        line-height: 1.6;
    }
}

.references-section {
    .references-title {
        font-size: 14px;
        font-weight: 600;
        margin-bottom: 8px;
        color: var(--el-text-color-primary);
    }
}

.field-label {
    font-family: monospace;
    color: var(--el-color-primary);
}

.field-remark {
    font-size: 12px;
    color: var(--el-text-color-secondary);
    margin-left: 4px;
}

.confirm-input-section {
    .confirm-label {
        font-size: 14px;
        margin-bottom: 8px;
        color: var(--el-text-color-regular);
    }
}
</style>
