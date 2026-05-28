<template>
    <div class="xl-left-content">
        <div class="xl-refresh-btn xl-cursor-pointer" @click="handleRefresh">
            <el-tooltip effect="dark" :content="t('layout.refreshPage')" placement="bottom" :enterable="false">
                <el-icon size="24" :class="{ 'xl-refresh-icon': refreshStore.isRefreshing }">
                    <i-ep-refresh />
                </el-icon>
            </el-tooltip>
        </div>
        <div>
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

const handleRefresh = () => {
    if (!refreshStore.isRefreshing) {
        refreshStore.setKey()
    }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/layout/header.scss' as *;

.xl-left-content {
    height: 100%;
    display: flex;
    align-items: center;

    .xl-refresh-btn {
        width: 24px;
        height: 24px;
        margin-right: 10px;
        .xl-refresh-icon {
            @include rotate-forever(1s);
        }
    }
}
</style>
