<template>
    <section class="detail-grid">
        <h3 v-if="title" class="detail-grid__title">{{ title }}</h3>
        <dl class="detail-grid__list" :class="{ 'is-single-column': columns === 1 }" :aria-label="title">
            <slot />
        </dl>
    </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title?: string; columns?: 1 | 2 }>(), { columns: 2 })
</script>

<style scoped lang="scss">
.detail-grid {
    min-width: 0;
    container-type: inline-size;
}

.detail-grid__title {
    margin: 0 0 var(--xl-space-3);
    font-size: var(--xl-font-md);
    font-weight: 600;
    line-height: 1.5;
    color: var(--el-text-color-primary);
}

.detail-grid__list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: var(--xl-space-5) var(--xl-space-6);
    margin: 0;
    padding: var(--xl-space-5);
    background: var(--el-fill-color-extra-light);
    border-radius: var(--xl-radius-lg);

    &.is-single-column {
        grid-template-columns: minmax(0, 1fr);
    }
}

@container (max-width: 480px) {
    .detail-grid__list {
        grid-template-columns: minmax(0, 1fr);
        gap: var(--xl-space-4);
        padding: var(--xl-space-4);
    }
}
</style>
