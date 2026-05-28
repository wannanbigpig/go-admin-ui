<template>
    <div class="sidebar-logo-container" :class="{ collapse: settingStore.isCollapse }">
        <router-link class="sidebar-logo-link" to="/">
            <img src="@/assets/images/logo-frontend.png" class="sidebar-logo" alt="Logo" />
            <span class="sidebar-title animate__animated" :class="{ animate__bounceInLeft: !settingStore.isCollapse }"> X-L-Admin </span>
        </router-link>
    </div>
</template>

<script setup>
import { useSettingStore } from '@/stores/setting'

// ==================== Store ====================
const settingStore = useSettingStore()
</script>

<style lang="scss" scoped>
.sidebar-logo-container {
    box-sizing: border-box;
    border-bottom: 1px solid var(--el-color-info-light-8);
    height: calc($xl-side-logo-height);
    overflow: hidden;
    position: relative;

    .sidebar-logo-link {
        display: grid;
        grid-template-columns: 32px minmax(0, 1fr);
        align-items: center;
        justify-content: flex-start;
        width: 100%;
        height: $xl-side-logo-height;
        padding: 0 18px;
        gap: 12px;
        transition: padding 320ms cubic-bezier(0.22, 1, 0.36, 1);

        .sidebar-logo {
            width: 32px;
            height: 32px;
            display: block;
            margin: 0;
            align-self: center;
        }

        .sidebar-title {
            line-height: $xl-side-logo-height;
            font-weight: 600;
            font-size: 20px;
            white-space: nowrap;
            font-family: Inter, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
            color: var(--el-text-color-primary);
            transform-origin: left center;
            transition:
                opacity 220ms ease,
                transform 320ms cubic-bezier(0.22, 1, 0.36, 1),
                max-width 320ms cubic-bezier(0.22, 1, 0.36, 1);
            max-width: 160px;
            overflow: hidden;
        }
    }

    /* 折叠状态样式 */
    &.collapse {
        display: flex;
        align-items: center;
        justify-content: center;

        .sidebar-logo-link {
            display: flex;
            width: 32px;
            height: 32px;
            padding: 0;
            align-items: center;
            justify-content: center;
            gap: 0;
        }

        .sidebar-logo {
            width: 32px;
            height: 32px;
            margin: 0;
        }

        .sidebar-title {
            display: none;
            opacity: 0;
            transform: translateX(-10px) scaleX(0.92);
            max-width: 0;
        }
    }
}
</style>
