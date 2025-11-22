<template>
    <el-watermark v-if="settingStore.watermarkEnabled" :content="watermarkConfig.content" :font="watermarkConfig.font" class="xl-layout-watermark">
        <el-container class="common-layout">
            <!-- 侧边栏 -->
            <el-aside id="xl-aside" :class="{ collapse: settingStore.isCollapse }">
                <xl-aside />
            </el-aside>

            <!-- 右侧主容器 -->
            <el-container class="right-container">
                <!-- 顶部导航栏 -->
                <el-header class="xl-header">
                    <xl-head />
                </el-header>

                <!-- 主内容区 -->
                <el-main class="xl-main">
                    <xl-main />
                </el-main>
            </el-container>
        </el-container>
    </el-watermark>
    <el-container v-else class="common-layout">
        <!-- 侧边栏 -->
        <el-aside id="xl-aside" :class="{ collapse: settingStore.isCollapse }">
            <xl-aside />
        </el-aside>

        <!-- 右侧主容器 -->
        <el-container class="right-container">
            <!-- 顶部导航栏 -->
            <el-header class="xl-header">
                <xl-head />
            </el-header>

            <!-- 主内容区 -->
            <el-main class="xl-main">
                <xl-main />
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useSettingStore } from '@/stores/setting'
import XlAside from '@/layout/sidebar/index.vue'
import XlMain from '@/layout/main/index.vue'
import XlHead from '@/layout/header/index.vue'

// ==================== 组件选项 ====================
defineOptions({
    name: 'MainIndex',
})

// ==================== Store ====================
const settingStore = useSettingStore()

// ==================== 计算属性 ====================
/** 水印配置 */
const watermarkConfig = computed(() => ({
    content: settingStore.watermarkContent,
    font: {
        fontSize: 16,
        color: 'rgba(100, 100, 100, 0.1)',
    },
}))
</script>
<style scoped lang="scss">
.xl-layout-watermark {
    display: block;
    height: 100%;
    width: 100%;
    position: relative;

    // 确保水印不影响子元素的定位和边框
    :deep(.el-watermark__content) {
        pointer-events: none;
    }

    // 确保布局容器正常显示，不影响子元素的定位和边框
    :deep(.common-layout) {
        position: relative;
        z-index: 1;
        height: 100%;
        isolation: isolate; // 创建新的层叠上下文，但不影响子元素
    }

    // 确保导航栏的 sticky 定位、边框和 backdrop-filter 正常显示
    :deep(.xl-header) {
        position: sticky !important;
        z-index: var(--xl-head-z-index) !important;
        border-bottom: 1px solid var(--el-color-info-light-8) !important;
        backdrop-filter: blur(4px) !important;
        -webkit-backdrop-filter: blur(4px) !important;
    }

    // 确保水印不会覆盖边框和交互元素
    :deep(.el-watermark__wrapper) {
        pointer-events: none;
    }
}
</style>
