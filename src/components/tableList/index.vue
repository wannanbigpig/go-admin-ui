<template>
    <el-skeleton :loading="loading && data.length === 0" animated>
        <template #template>
            <div style="padding: 15px">
                <el-skeleton-item variant="rect" style="width: 100%; height: 40px; margin-bottom: 20px" />
                <el-skeleton-item variant="rect" style="width: 100%; height: 45px; margin-bottom: 10px" v-for="i in 10" :key="i" />
            </div>
        </template>

        <template #default>
            <el-table
                ref="tableRef"
                v-loading="loading"
                :data="data"
                class="xl-table"
                style="width: 100%"
                :border="border"
                :row-key="rowKey"
                :lazy="lazy"
                :load="load"
                :tree-props="treeProps"
                :default-expand-all="defaultExpandAll"
                :height="height"
                @selection-change="handleSelectionChange"
                @sort-change="handleSortChange"
            >
                <el-table-column v-if="selectable" type="selection" width="48" align="center" />
                <template v-if="hasTableTitle">
                    <el-table-column
                        v-for="(item, index) in tableTitle"
                        :key="String(item.prop) || `column-${index}`"
                        :prop="String(item.prop)"
                        :label="item.h_label"
                        :align="item.align || 'left'"
                        :width="item.width"
                        :min-width="item.minWidth"
                        :sortable="item.sortable"
                        :show-overflow-tooltip="item.overflow"
                    >
                        <template v-if="item.h_tip" #header>
                            <span class="xl-label-with-icon">
                                {{ item.h_label }}
                                <el-tooltip effect="dark" :content="item.h_tip" placement="top">
                                    <el-icon class="xl-cursor-pointer xl-tooltip-icon">
                                        <i-ep-warning />
                                    </el-icon>
                                </el-tooltip>
                            </span>
                        </template>

                        <template #default="scope">
                            <slot v-if="item.customRow" name="td" :item="item" :val="getCellValue(item, scope.row)" :row="scope.row" />
                            <template v-else-if="item.tag">
                                <el-tag :type="getTagType(item, scope.row)">
                                    {{ getTagText(item, scope.row) }}
                                </el-tag>
                            </template>
                            <span v-else>{{ getCellValue(item, scope.row) }}</span>
                        </template>
                    </el-table-column>
                </template>
                <slot name="operation"></slot>
            </el-table>

            <xl-pagination v-if="showPagination" :current-page="currentPage" :page-size="pageSize" :total="pagination.total" @size-change="handlePageSizeChange" @current-change="handlePageChange" />
        </template>
    </el-skeleton>
</template>

<script setup lang="ts" generic="T extends object">
import { computed, ref } from 'vue'
import type { TableInstance } from 'element-plus'
import xlPagination from '@/components/pagination/index.vue'
import type { TableColumn } from '@/types/common'

interface SortChangePayload {
    column: unknown
    prop: string
    order: 'ascending' | 'descending' | null
}

// ==================== Props 定义 ====================
interface Props {
    loading?: boolean
    data: T[]
    tableTitle: TableColumn<T>[]
    border?: boolean
    rowKey?: string
    lazy?: boolean
    load?: (row: T, treeNode: unknown, resolve: (data: T[]) => void) => void
    treeProps?: { children?: string; hasChildren?: string }
    defaultExpandAll?: boolean
    selectable?: boolean
    height?: string | number
    pagination?: {
        total: number
        page?: number
        pageSize?: number
        currentPage?: number
        pageSizeChange?: (size: number) => void
        pageChange?: (page: number) => void
    }
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    data: () => [],
    tableTitle: () => [],
    border: false,
    rowKey: 'id',
    lazy: false,
    treeProps: () => ({ children: 'children', hasChildren: 'hasChildren' }),
    defaultExpandAll: false,
    selectable: false,
    pagination: () => ({}) as NonNullable<Props['pagination']>,
})

const emit = defineEmits(['size-change', 'current-change', 'selection-change', 'sort-change'])
const tableRef = ref<TableInstance>()

const showPagination = computed(() => props.pagination && typeof props.pagination.total === 'number')
const currentPage = computed(() => props.pagination.currentPage ?? props.pagination.page ?? 1)
const pageSize = computed(() => props.pagination.pageSize ?? 10)
const hasTableTitle = computed(() => props.tableTitle.length > 0)

const getCellValue = (item: TableColumn<T>, row: T) => {
    if (typeof item.formatter === 'function') return item.formatter(row)
    const propStr = item.prop as string
    if (!propStr) return '-'
    if (propStr.includes('.')) {
        const val = propStr.split('.').reduce((acc: unknown, part: string) => {
            if (acc && typeof acc === 'object') {
                return (acc as Record<string, unknown>)[part]
            }
            return undefined
        }, row)
        return val ?? '-'
    }
    return (row as Record<string, unknown>)[propStr] ?? '-'
}

const getTagType = (item: TableColumn<T>, row: T) => {
    if (!item.tag) return 'info'
    const tagValue = item.tagKey ? (row as Record<string, unknown>)[item.tagKey as string] : getCellValue(item, row)
    const tagConfig = item.tag[tagValue as string | number]
    return tagConfig?.type || 'info'
}

const getTagText = (item: TableColumn<T>, row: T) => {
    const cellValue = getCellValue(item, row)
    if (!item.tag) return cellValue
    const tagValue = item.tagKey ? (row as Record<string, unknown>)[item.tagKey as string] : cellValue
    const tagConfig = item.tag[tagValue as string | number]
    return tagConfig?.text ?? cellValue
}

const handlePageSizeChange = (size: number) => {
    emit('size-change', size)
    props.pagination?.pageSizeChange?.(size)
}

const handlePageChange = (page: number) => {
    emit('current-change', page)
    props.pagination?.pageChange?.(page)
}

const handleSelectionChange = (selection: T[]) => {
    emit('selection-change', selection)
}

const handleSortChange = (payload: SortChangePayload) => {
    emit('sort-change', payload)
}

const toggleRowExpansion = (row: T, expanded?: boolean) => {
    tableRef.value?.toggleRowExpansion(row, expanded)
}

defineExpose({
    tableRef,
    toggleRowExpansion,
})
</script>
