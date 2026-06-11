<template>
    <component :is="watermarkWrapper" v-bind="watermarkBindings" :class="watermarkClass">
        <!-- Skip Link -->
        <a class="skip-link" href="#main-content">{{ t('layout.skipToMain') }}</a>
        <!-- Global announcement for screen readers -->
        <div class="sr-only" aria-live="polite">{{ notificationStore.latestAnnouncement }}</div>

        <el-container class="common-layout">
            <el-aside id="xl-aside" :class="{ collapse: settingStore.isCollapse }">
                <xl-aside />
            </el-aside>
            <el-container class="right-container">
                <el-header class="xl-header">
                    <xl-head />
                </el-header>
                <el-main class="xl-main">
                    <xl-main-view />
                </el-main>
            </el-container>
        </el-container>
    </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElWatermark } from 'element-plus'
import { useSettingStore } from '@/stores/setting'
import { useI18n } from 'vue-i18n'
import { useNotificationStore } from '@/stores/notification'
import XlAside from '@/layout/sidebar/index.vue'
import XlMainView from '@/layout/main/index.vue'
import XlHead from '@/layout/header/index.vue'

defineOptions({
    name: 'MainLayout',
})

const settingStore = useSettingStore()
const { t } = useI18n()
const notificationStore = useNotificationStore()

const watermarkConfig = computed(() => ({
    content: settingStore.watermarkContent || '',
    font: {
        fontSize: 16,
        color: 'rgba(100, 100, 100, 0.1)',
    },
}))

const watermarkWrapper = computed(() => (settingStore.watermarkEnabled ? ElWatermark : 'div'))
const watermarkBindings = computed(() => (settingStore.watermarkEnabled ? watermarkConfig.value : {}))
const watermarkClass = computed(() => (settingStore.watermarkEnabled ? 'xl-layout-watermark' : ''))
</script>

<style scoped lang="scss">
@use '@/assets/styles/layout/index.scss' as *;

.skip-link {
    position: absolute;
    top: -40px;
    left: 10px;
    background: var(--el-color-primary);
    color: #fff;
    padding: 8px 16px;
    z-index: 9999;
    border-radius: 0 0 4px 4px;
    transition: top 0.2s ease;
    text-decoration: none;
    font-size: 14px;
}
.skip-link:focus-visible {
    top: 0;
    outline: none;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* visually-hidden */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
}

.xl-layout-watermark {
    display: block;
    height: 100%;
    width: 100%;
    position: relative;

    :deep(.el-watermark__content) {
        pointer-events: none;
    }

    :deep(.common-layout) {
        position: relative;
        z-index: 1;
        height: 100%;
        isolation: isolate;
    }

    :deep(.xl-header) {
        position: sticky !important;
        z-index: 10 !important;
        border-bottom: 1px solid var(--el-color-info-light-8) !important;
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
    }

    :deep(.el-watermark__wrapper) {
        pointer-events: none;
    }
}
</style>
