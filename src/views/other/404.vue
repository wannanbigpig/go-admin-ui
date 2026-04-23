<template>
    <div class="not-found">
        <i-custom-404 class="svg-404-icon" />
        <div class="not-found-desc">{{ t('other.notFound.pageNotFound') }}</div>
        <router-link to="/" class="home-link">{{ t('other.notFound.backHome') }}</router-link>
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
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
    text-align: center;
    background-color: var(--xl-main-bg-color);
    color: var(--el-text-color-primary);

    .svg-404-icon {
        width: min(80%, 400px);
        height: auto;
        margin-bottom: 30px;
        opacity: 0.9;
    }

    .not-found-desc {
        font-size: clamp(18px, 4vw, 24px);
        color: var(--el-text-color-secondary);
        line-height: 1.6;
        margin-bottom: 30px;
        font-weight: 500;
    }

    .home-link {
        padding: 12px 24px;
        background-color: #4a6bdf;
        color: var(--el-color-white);
        border-radius: 6px;
        text-decoration: none;
        font-size: 16px;
        transition: all 0.3s ease;

        &:hover {
            background-color: #3a5bd9;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
    }
}
</style>
