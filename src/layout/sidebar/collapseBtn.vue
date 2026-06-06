<template>
    <div
        class="collapse-btn xl-cursor-pointer"
        :class="{ collapse: settingStore.isCollapse }"
        role="button"
        tabindex="0"
        :aria-label="t('layout.toggleSidebar')"
        @click="handleToggleCollapse"
        @keydown.enter="handleToggleCollapse"
    >
        <el-icon v-if="settingStore.isCollapse">
            <i-ant-design-right-outlined class="collapse-btn-icon" />
        </el-icon>
        <el-icon v-else>
            <i-ant-design-left-outlined class="collapse-btn-icon" />
        </el-icon>
    </div>
</template>

<script setup>
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
    width: $xl-collapse-btn-width;
    height: $xl-collapse-btn-height;
    border-radius: 40px;
    position: fixed;
    top: 100px;
    left: calc(var(--xl-aside-width) - $xl-collapse-btn-width / 2);
    z-index: var(--xl-collapse-btn-z-index);
    background: var(--xl-bg-color);
    inset-inline-end: -13px;
    transition:
        left 320ms cubic-bezier(0.22, 1, 0.36, 1),
        transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
        width 320ms cubic-bezier(0.22, 1, 0.36, 1),
        box-shadow 220ms ease;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--el-text-color-secondary);
    box-shadow:
        0 2px 8px -2px rgba(0, 0, 0, 0.1),
        0 1px 4px -1px rgba(25, 15, 15, 0.2),
        0 0 1px 0 rgba(0, 0, 0, 0.3);

    .collapse-btn-icon {
        width: 14px;
        height: 14px;
    }

    &:hover {
        box-shadow:
            0 4px 16px 2px rgba(0, 0, 0, 0.1),
            0 2px 8px 1px rgba(25, 15, 15, 0.2),
            0 0 2px 0 rgba(0, 0, 0, 0.3);
    }

    &.collapse {
        left: calc(var(--xl-aside-min-width) - 15px);
    }
}
</style>
