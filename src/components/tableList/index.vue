<template>
    <el-table
        ref="tableRef"
        :data="data"
        class="xl-table"
        style="width: 100%"
        header-cell-class-name="xl-table-cell"
        header-row-class-name="xl-table-header"
        :border="border"
        :default-expand-all="defaultExpandAll"
        :row-key="rowKey"
        :lazy="lazy"
        :load="load"
        :tree-props="treeProps"
    >
        <!-- 使用 tableTitle 渲染表格列 -->
        <template v-if="hasTableTitle">
            <el-table-column
                v-for="(item, index) in tableTitle"
                :key="item.prop || `column-${index}`"
                :prop="item.prop"
                :label="item.h_label"
                :align="item.align || 'left'"
                :width="item.width || 'auto'"
                :min-width="item.minWidth"
                :show-overflow-tooltip="item.overflow"
            >
                <!-- 自定义表头（带提示信息） -->
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

                <!-- 自定义行渲染 -->
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

        <!-- 动态生成表格列（当 tableTitle 为空时，根据数据第一行自动生成） -->
        <template v-else-if="canAutoGenerateColumns">
            <el-table-column v-for="(value, key) in data[0]" :key="key" :prop="key" :label="key" align="center" />
        </template>

        <!-- 操作列插槽 -->
        <slot name="operation"></slot>
    </el-table>

    <!-- 分页组件 -->
    <xl-pagination v-if="showPagination" :current-page="currentPage" :page-size="pageSize" :total="pagination.total" @size-change="handlePageSizeChange" @current-change="handlePageChange" />
</template>

<script setup>
import { computed } from 'vue'
import xlPagination from '@/components/pagination/index.vue'

// ==================== Props 定义 ====================
const props = defineProps({
    /** 表格数据 */
    data: {
        type: Array,
        default: () => [],
    },
    /** 表格列配置 */
    tableTitle: {
        type: Array,
        default: () => [],
    },
    /** 是否显示边框 */
    border: {
        type: Boolean,
        default: false,
    },
    /** 是否默认展开所有行（树形表格） */
    defaultExpandAll: {
        type: Boolean,
        default: false,
    },
    /** 行数据的 Key，用于优化渲染 */
    rowKey: {
        type: String,
        default: '',
    },
    /** 是否懒加载子节点数据（树形表格） */
    lazy: {
        type: Boolean,
        default: true,
    },
    /** 加载子节点数据的函数（树形表格） */
    load: {
        type: Function,
        default: undefined,
    },
    /** 树形表格配置 */
    treeProps: {
        type: Object,
        default: () => ({
            children: 'children',
            hasChildren: 'hasChildren',
        }),
    },
    /** 分页配置对象 */
    pagination: {
        type: Object,
        default: () => ({}),
    },
})

// ==================== Emits 定义 ====================
const emit = defineEmits(['size-change', 'current-change'])

// ==================== 响应式数据 ====================
const tableRef = ref(null)

// ==================== 计算属性 ====================
/**
 * 是否显示分页组件
 */
const showPagination = computed(() => {
    return Object.keys(props.pagination).length > 0
})

/**
 * 当前页码
 */
const currentPage = computed(() => {
    return props.pagination.currentPage ?? props.pagination.page ?? 1
})

/**
 * 每页显示条数
 */
const pageSize = computed(() => {
    return props.pagination.pageSize ?? props.pagination.page_size ?? 10
})

/**
 * 是否有表格列配置
 */
const hasTableTitle = computed(() => {
    return Array.isArray(props.tableTitle) && props.tableTitle.length > 0
})

/**
 * 是否可以自动生成列
 */
const canAutoGenerateColumns = computed(() => {
    return !hasTableTitle.value && Array.isArray(props.data) && props.data.length > 0
})

// ==================== 方法 ====================
/**
 * 递归获取所有行数据（包括子节点）
 * @param {Array} rows - 行数据数组
 * @returns {Array} 所有行数据（扁平化）
 */
const getAllRows = (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
        return []
    }

    const result = []
    rows.forEach((row) => {
        result.push(row)
        if (row.children && row.children.length > 0) {
            result.push(...getAllRows(row.children))
        }
    })
    return result
}

/**
 * 展开/折叠所有行
 * @param {boolean} expand - true 展开，false 折叠
 */
const toggleAllRows = (expand) => {
    if (!tableRef.value || !props.data || props.data.length === 0) return
    const allRows = getAllRows(props.data)
    allRows.forEach((row) => {
        tableRef.value.toggleRowExpansion(row, expand)
    })
}

/**
 * 获取单元格值
 * 如果配置了 formatter 函数，则使用 formatter 处理，否则直接获取属性值
 * @param {Object} item - 列配置项
 * @param {Object} row - 行数据
 * @returns {*} 单元格值
 */
const getCellValue = (item, row) => {
    if (typeof item.formatter === 'function') {
        return item.formatter(row)
    }
    return row?.[item.prop] ?? '-'
}

/**
 * 获取标签类型
 * 如果配置了 tagKey，使用 tagKey 指定的字段值来判断标签；否则使用单元格值
 * @param {Object} item - 列配置项
 * @param {Object} row - 行数据
 * @returns {string} 标签类型
 */
const getTagType = (item, row) => {
    if (!item.tag) return ''

    // 如果配置了 tagKey，使用 tagKey 指定的字段值来判断标签
    const tagValue = item.tagKey ? row[item.tagKey] : getCellValue(item, row)

    if (tagValue !== null && tagValue !== undefined) {
        const tagConfig = item.tag[tagValue]
        if (tagConfig) {
            return tagConfig.type || item.tag['other']?.type || ''
        }
    }

    return ''
}

/**
 * 处理分页大小变化
 * @param {number} size - 新的每页显示条数
 */
const handlePageSizeChange = (size) => {
    emit('size-change', size)
    if (props.pagination?.pageSizeChange) {
        props.pagination.pageSizeChange(size)
    }
}

/**
 * 处理当前页码变化
 * @param {number} page - 新的页码
 */
const handlePageChange = (page) => {
    emit('current-change', page)
    if (props.pagination?.pageChange) {
        props.pagination.pageChange(page)
    }
}

// ==================== 暴露方法 ====================
defineExpose({
    toggleAllRows,
    tableRef,
})
</script>

<style lang="scss" scoped>
.xl-table {
    width: 100%;
}

.xl-tooltip-icon {
    font-size: 17px;
}
</style>
