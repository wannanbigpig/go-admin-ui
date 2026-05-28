<template>
    <component :is="watermarkWrapper" v-bind="watermarkBindings" :class="watermarkClass">
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
import XlAside from '@/layout/sidebar/index.vue'
import XlMainView from '@/layout/main/index.vue'
import XlHead from '@/layout/header/index.vue'

defineOptions({
    name: 'MainLayout',
})

const settingStore = useSettingStore()

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
