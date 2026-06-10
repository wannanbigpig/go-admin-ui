<template>
    <div class="not-found">
        <i-custom-not_found class="svg-icon" />
        <div class="not-found-desc">{{ t('other.notFound.componentNotFound') }}</div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<style lang="scss" scoped>
.not-found {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem;
    text-align: center;

    .svg-icon {
        width: min(400px, 80%);
        height: auto;
        margin: 2rem 0;
        opacity: 0.8;
        transition: transform 0.3s ease;

        &:hover {
            transform: scale(1.05);
        }
    }

    .not-found-desc {
        font-size: clamp(1.125rem, 4vw, 1.375rem);
        color: var(--el-text-color-primary);
        line-height: 1.6;
        margin-top: 1rem;
        font-weight: 500;
        max-width: 80%;
    }
}
</style>
