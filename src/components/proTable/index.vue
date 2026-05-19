<template>
    <div class="xl-pro-table">
        <div v-if="$slots.search" class="xl-container xl-m-bottom-10">
            <slot name="search" />
        </div>

        <div class="xl-container">
            <div v-if="$slots.actions || $slots.toolbar" class="xl-pro-table__toolbar">
                <div class="xl-pro-table__toolbar-main">
                    <slot name="toolbar" />
                </div>
                <div v-if="$slots.actions" class="xl-table-actions xl-pro-table__toolbar-actions">
                    <slot name="actions" />
                </div>
            </div>

            <xl-table-list
                :loading="loading"
                :data="data"
                :table-title="tableTitle"
                :border="border"
                :row-key="rowKey"
                :lazy="lazy"
                :load="load"
                :tree-props="treeProps"
                :selectable="selectable"
                :pagination="pagination"
                @size-change="(size) => emit('size-change', size)"
                @current-change="(page) => emit('current-change', page)"
                @selection-change="(selection) => emit('selection-change', selection)"
            >
                <template #td="scope">
                    <slot name="td" v-bind="scope" />
                </template>
                <template #operation>
                    <slot name="operation" />
                </template>
            </xl-table-list>
        </div>
    </div>
</template>

<script setup lang="ts" generic="T extends object">
import xlTableList from '@/components/tableList/index.vue'
import type { TableColumn } from '@/types/common'

interface Props {
    loading?: boolean
    data: T[]
    tableTitle: TableColumn<T>[]
    border?: boolean
    rowKey?: string
    lazy?: boolean
    load?: (row: T, treeNode: unknown, resolve: (data: T[]) => void) => void
    treeProps?: { children?: string; hasChildren?: string }
    selectable?: boolean
    pagination?: {
        total: number
        page?: number
        pageSize?: number
        currentPage?: number
        pageSizeChange?: (size: number) => void
        pageChange?: (page: number) => void
    }
}

withDefaults(defineProps<Props>(), {
    loading: false,
    data: () => [],
    tableTitle: () => [],
    border: false,
    rowKey: 'id',
    lazy: false,
    treeProps: () => ({ children: 'children', hasChildren: 'hasChildren' }),
    selectable: false,
    pagination: () => ({}) as NonNullable<Props['pagination']>,
})

const emit = defineEmits<{
    'size-change': [size: number]
    'current-change': [page: number]
    'selection-change': [selection: T[]]
}>()
</script>

<style scoped lang="scss">
.xl-pro-table__toolbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;
}

.xl-pro-table__toolbar-main {
    flex: 1;
    min-width: 0;
}

.xl-pro-table__toolbar-actions {
    flex-shrink: 0;
}

@media (max-width: 960px) {
    .xl-pro-table__toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .xl-pro-table__toolbar-actions {
        width: 100%;
    }
}
</style>
