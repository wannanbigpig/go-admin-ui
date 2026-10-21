<template>
    <header class="xl-container page-heading">
        <h2>{{ title }}</h2>
        <p>{{ description }}</p>
    </header>
</template>

<script setup lang="ts">
defineProps<{ title: string; description: string }>()
</script>

<style scoped lang="scss">
.page-heading {
    margin-bottom: var(--xl-space-4);
    padding: var(--xl-space-4) var(--xl-space-5);

    h2 {
        margin: 0;
        color: var(--el-text-color-primary);
        font-size: var(--xl-font-xl);
        font-weight: 600;
        line-height: 1.5;
    }

    p {
        margin: 6px 0 0;
        color: var(--el-text-color-secondary);
        font-size: var(--xl-font-sm);
        line-height: 1.5;
        overflow-wrap: anywhere;
    }
}
</style>
