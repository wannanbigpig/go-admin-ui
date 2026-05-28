<template>
    <header class="file-header">
        <div class="header-left">
            <div class="breadcrumb-nav" v-if="selectedCategory === 'all'">
                <el-breadcrumb separator="/">
                    <el-breadcrumb-item @click="emit('breadcrumb-click', null)">
                        <el-icon><HomeFilled /></el-icon>
                    </el-breadcrumb-item>
                    <el-breadcrumb-item v-for="item in folderPath" :key="item.id" @click="emit('breadcrumb-click', item.id)">
                        {{ item.name }}
                    </el-breadcrumb-item>
                </el-breadcrumb>
            </div>
            <div class="category-title" v-else>
                <span class="title-text">{{ categoryTitle }}</span>
            </div>
        </div>
        <div class="header-right">
            <div class="view-toggle">
                <el-button-group>
                    <el-button :type="viewMode === 'grid' ? 'primary' : ''" @click="emit('update:viewMode', 'grid')">
                        <el-icon><Menu /></el-icon>
                    </el-button>
                    <el-button :type="viewMode === 'list' ? 'primary' : ''" @click="emit('update:viewMode', 'list')">
                        <el-icon><List /></el-icon>
                    </el-button>
                </el-button-group>
            </div>
            <el-input
                :model-value="searchName || ''"
                class="search-input"
                :placeholder="t('system.file.searchFile')"
                :prefix-icon="Search"
                clearable
                @update:model-value="(val: string) => emit('update:searchName', val)"
                @input="emit('search')"
            />
            <xl-action-button v-permission="'file:list'" :text="t('system.file.exportList')" :loading="exporting" @click="emit('export')" />
            <xl-action-button v-permission="'file:create'" :text="t('system.file.selectUploadFolder')" @click="emit('upload-directory')" />
            <xl-action-button v-permission="'file:create'" type="primary" :text="t('system.file.selectUploadFiles')" @click="emit('upload-files')" />
        </div>
    </header>

    <div v-if="selectedCount > 0" class="batch-action-bar">
        <span class="batch-selection-text">{{ t('system.file.batchSelected', { count: selectedCount }) }}</span>
        <div class="batch-actions">
            <xl-action-button v-permission="'file:update'" :text="t('system.file.batchMove')" @click="emit('batch-move')" />
            <xl-action-button v-permission="'file:delete'" type="danger" :loading="batchDeleting" :text="t('system.file.batchDelete')" @click="emit('batch-delete')" />
        </div>
    </div>
</template>

<script setup lang="ts">
import { HomeFilled, Menu, List, Search } from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import xlActionButton from '@/components/actionButton/index.vue'

const { t } = useI18n()

interface Props {
    selectedCategory: string
    folderPath: { id: number | string; name: string }[]
    viewMode: 'grid' | 'list'
    searchName: string | null | undefined
    exporting: boolean
    selectedCount?: number
    batchDeleting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    selectedCount: 0,
    batchDeleting: false,
})

const emit = defineEmits<{
    (e: 'breadcrumb-click', folderId: number | string | null): void
    (e: 'update:viewMode', mode: 'grid' | 'list'): void
    (e: 'update:searchName', val: string | null | undefined): void
    (e: 'search'): void
    (e: 'export'): void
    (e: 'upload-files'): void
    (e: 'upload-directory'): void
    (e: 'batch-move'): void
    (e: 'batch-delete'): void
}>()

const categoryTitle = computed(() => {
    if (props.selectedCategory === 'all') return ''
    return t(`system.file.categoryLabels.${props.selectedCategory}`)
})
</script>

<style scoped lang="scss">
.file-header {
    height: 64px;
    padding: 0 var(--xl-space-5);
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background-color: var(--el-bg-color);
}

.header-left {
    display: flex;
    align-items: center;
    gap: 20px;
}

.header-right {
    display: flex;
    align-items: center;
    gap: var(--xl-space-4);
}

.breadcrumb-nav {
    :deep(.el-breadcrumb__item) {
        cursor: pointer;
        &:hover .el-breadcrumb__inner {
            color: var(--el-color-primary);
        }
    }
}

.breadcrumb-item-content {
    display: inline-flex;
    align-items: center;
    gap: var(--xl-space-1);

    .breadcrumb-text {
        font-size: 14px;
    }
}

.category-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--el-text-color-primary);
}

.search-input {
    width: 240px;
}

.batch-action-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--xl-space-3) var(--xl-space-5);
    background: var(--el-color-primary-light-9);
    border-bottom: 1px solid var(--el-color-primary-light-7);

    .batch-selection-text {
        font-size: 14px;
        color: var(--el-color-primary);
        font-weight: 600;
    }

    .batch-actions {
        display: flex;
        gap: var(--xl-space-3);
    }
}
</style>
