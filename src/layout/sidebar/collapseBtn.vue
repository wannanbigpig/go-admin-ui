<template>
    <div
        class="collapse-btn xl-cursor-pointer"
        :class="{ collapse: settingStore.isCollapse }"
        role="button"
        tabindex="0"
        :aria-label="t('layout.toggleSidebar')"
        :title="settingStore.isCollapse ? t('common.actions.expand') : t('common.actions.collapse')"
        @click="handleToggleCollapse"
        @keydown.enter="handleToggleCollapse"
    >
        <svg class="collapse-btn-bg" viewBox="0 0 10 50" preserveAspectRatio="none">
            <path d="M 0,0 C 0,8 9.5,15 9.5,25 C 9.5,35 0,42 0,50 Z" class="collapse-btn-path" />
        </svg>
        <el-icon class="collapse-btn-icon">
            <i-ant-design-right-outlined v-if="settingStore.isCollapse" />
            <i-ant-design-left-outlined v-else />
        </el-icon>
    </div>
</template>

<script setup lang="ts">
import { useSettingStore } from '@/stores/setting'
import { useI18n } from 'vue-i18n'

// ==================== Store ====================
const settingStore = useSettingStore()
const { t } = useI18n()

// ==================== 方法 ====================
/**
 * 切换侧边栏折叠状态
 */
const handleToggleCollapse = () => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement && activeElement !== document.body) {
        activeElement.blur()
    }
    settingStore.isCollapse = !settingStore.isCollapse
}
</script>

<style lang="scss" scoped>
.collapse-btn {
    position: fixed;
    top: 50px;
    left: calc(var(--xl-aside-width) - 1px);
    width: 10px;
    height: 50px;
    z-index: var(--xl-collapse-btn-z-index, 100);
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding-left: 1px;
    cursor: pointer;
    user-select: none;
    outline: none;
    transition:
        left 320ms cubic-bezier(0.22, 1, 0.36, 1),
        width 200ms ease,
        transform 200ms ease;

    .collapse-btn-bg {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
        filter: drop-shadow(2px 0 4px rgba(0, 0, 0, 0.05));

        .collapse-btn-path {
            fill: var(--el-bg-color-overlay, #ffffff);
            stroke: var(--el-border-color-light);
            stroke-width: 1;
            transition:
                fill 200ms ease,
                stroke 200ms ease;
        }
    }

    .collapse-btn-icon {
        position: relative;
        z-index: 1;
        font-size: 8px;
        width: 8px;
        height: 8px;
        color: var(--el-text-color-secondary);
        transition:
            color 200ms ease,
            transform 200ms ease;
    }

    &:hover,
    &:focus-visible {
        width: 14px;

        .collapse-btn-path {
            fill: var(--el-color-primary);
            stroke: var(--el-color-primary);
        }

        .collapse-btn-icon {
            color: #ffffff;
            transform: scale(1.15);
        }
    }

    &.collapse {
        left: calc(var(--xl-aside-min-width) - 1px);
    }
}
</style>
