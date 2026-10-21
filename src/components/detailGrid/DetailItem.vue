<template>
    <div class="detail-item" :class="{ 'is-wide': span === 2 }">
        <dt class="detail-item__label">{{ label }}</dt>
        <dd class="detail-item__value"><slot /></dd>
    </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ label: string; span?: 1 | 2 }>(), { span: 1 })
</script>

<style scoped lang="scss">
.detail-item {
    min-width: 0;

    &.is-wide {
        grid-column: 1 / -1;
    }
}

.detail-item__label {
    margin-bottom: var(--xl-space-2);
    color: var(--el-text-color-secondary);
    font-size: var(--xl-font-sm);
    line-height: 1.5;
    overflow-wrap: anywhere;
}

.detail-item__value {
    margin: 0;
    color: var(--el-text-color-primary);
    font-size: var(--xl-font-md);
    line-height: 1.65;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
}
</style>
