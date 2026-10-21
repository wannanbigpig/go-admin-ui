<template>
    <div class="xl-left-content">
        <button type="button" class="mobile-nav-toggle" :aria-label="t('layout.toggleSidebar')" :aria-expanded="mobileNavOpen" aria-controls="mobile-navigation" @click="$emit('toggle-navigation')">
            <el-icon size="22"><i-ep-menu /></el-icon>
        </button>
        <button type="button" class="xl-refresh-btn xl-cursor-pointer" :aria-label="t('layout.refreshPage')" :disabled="refreshStore.isRefreshing" @click="handleRefresh">
            <el-tooltip effect="dark" :content="t('layout.refreshPage')" placement="bottom" :enterable="false">
                <el-icon size="24" :class="{ 'xl-refresh-icon': refreshStore.isRefreshing }">
                    <i-ep-refresh />
                </el-icon>
            </el-tooltip>
        </button>
        <div class="header-breadcrumb">
            <xl-breadcrumb />
        </div>
    </div>
</template>

<script setup lang="ts">
import XlBreadcrumb from '@/components/breadcrumb/index.vue'
import { useRefreshStore } from '@/stores/refresh'
import { useI18n } from 'vue-i18n'

const refreshStore = useRefreshStore()
const { t } = useI18n()
defineProps<{ mobileNavOpen?: boolean }>()
defineEmits<{ 'toggle-navigation': [] }>()

const handleRefresh = () => {
    if (!refreshStore.isRefreshing) {
        refreshStore.setKey()
    }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/layout/header.scss' as *;

.xl-left-content {
    min-width: 0;
    height: 100%;
    display: flex;
    align-items: center;

    .xl-refresh-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border: 0;
        background: transparent;
        color: inherit;
        width: 24px;
        height: 24px;
        margin-right: 10px;
        .xl-refresh-icon {
            @include rotate-forever(1s);
        }
    }
}

.mobile-nav-toggle {
    display: none;
}
.header-breadcrumb {
    min-width: 0;
}
@media (max-width: 768px) {
    .mobile-nav-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 32px;
        height: 36px;
        border: 0;
        padding: 0;
        margin-right: 4px;
        background: transparent;
        color: inherit;
        cursor: pointer;
    }
    .header-breadcrumb {
        overflow: hidden;
        :deep(.el-breadcrumb) {
            white-space: nowrap;
        }
        :deep(.el-breadcrumb__item:not(:last-child)) {
            display: none;
        }
        :deep(.el-breadcrumb__inner) {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            max-width: 100%;
        }
    }
}
</style>
