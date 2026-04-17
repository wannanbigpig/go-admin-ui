<template>
    <el-skeleton :loading="loading && data.length === 0" animated>
        <template #template>
            <div style="padding: 15px">
                <el-skeleton-item variant="rect" style="width: 100%; height: 40px; margin-bottom: 20px" />
                <el-skeleton-item variant="rect" style="width: 100%; height: 45px; margin-bottom: 10px" v-for="i in 10" :key="i" />
            </div>
        </template>

        <template #default>
            <el-table ref="tableRef" v-loading="loading" :data="data" class="xl-table" style="width: 100%" :border="border" :row-key="rowKey" :lazy="lazy" :load="load" :tree-props="treeProps">
                <template v-if="hasTableTitle">
                    <el-table-column
                        v-for="(item, index) in tableTitle"
                        :key="String(item.prop) || `column-${index}`"
                        :prop="String(item.prop)"
                        :label="item.h_label"
                        :align="item.align || 'left'"
                        :width="item.width"
                        :min-width="item.minWidth"
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
                                    {{ getCellValue(item, scope.row) }}
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

<script setup lang="ts" generic="T extends Record<string, any>">
import { computed, ref } from 'vue'
import xlPagination from '@/components/pagination/index.vue'
import type { TableColumn } from '@/types/common'

// ==================== Props 定义 ====================
interface Props {
    loading?: boolean
    data: T[]
    tableTitle: TableColumn<T>[]
    border?: boolean
    rowKey?: string
    lazy?: boolean
    load?: (row: T, treeNode: any, resolve: (data: T[]) => void) => void
    treeProps?: { children?: string; hasChildren?: string }
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
    pagination: () => ({}) as any,
})

const emit = defineEmits(['size-change', 'current-change'])
const tableRef = ref(null)

const showPagination = computed(() => props.pagination && typeof props.pagination.total === 'number')
const currentPage = computed(() => props.pagination.currentPage ?? props.pagination.page ?? 1)
const pageSize = computed(() => props.pagination.pageSize ?? 10)
const hasTableTitle = computed(() => props.tableTitle.length > 0)

const getCellValue = (item: TableColumn<T>, row: T) => {
    if (typeof item.formatter === 'function') return item.formatter(row)
    return row[item.prop as keyof T] ?? '-'
}

const getTagType = (item: TableColumn<T>, row: T) => {
    if (!item.tag) return 'info'
    const tagValue = item.tagKey ? row[item.tagKey as keyof T] : getCellValue(item, row)
    const tagConfig = item.tag[tagValue as string | number]
    return tagConfig?.type || 'info'
}

const handlePageSizeChange = (size: number) => {
    emit('size-change', size)
    props.pagination.pageSizeChange?.(size)
}

const handlePageChange = (page: number) => {
    emit('current-change', page)
    props.pagination.pageChange?.(page)
}

defineExpose({ tableRef })
</script>
