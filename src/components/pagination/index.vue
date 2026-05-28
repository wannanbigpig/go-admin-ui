<template>
    <el-pagination
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :current-page="currentPageValue"
        :page-size="pageSizeValue"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        class="xl-pagination"
    />
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ==================== Props 定义 ====================
interface Props {
    /** 当前页码 */
    currentPage?: number
    /** 每页显示条数 */
    pageSize?: number
    /** 总条数 */
    total?: number
    // 向后兼容：支持旧的命名方式
    page?: number
    page_size?: number
    // 向后兼容：支持函数 props
    pageSizeChange?: (size: number) => void
    pageChange?: (page: number) => void
}

const props = withDefaults(defineProps<Props>(), {
    currentPage: undefined,
    pageSize: undefined,
    total: 0,
    page: undefined,
    page_size: undefined,
    pageSizeChange: undefined,
    pageChange: undefined,
})

// ==================== Emits 定义 ====================
const emit = defineEmits<{
    (e: 'size-change', size: number): void
    (e: 'current-change', page: number): void
    (e: 'update:currentPage', page: number): void
    (e: 'update:pageSize', size: number): void
}>()

// ==================== 计算属性 ====================
/** 当前页码（兼容旧属性名） */
const currentPageValue = computed(() => props.currentPage ?? props.page ?? 1)

/** 每页显示条数（兼容旧属性名） */
const pageSizeValue = computed(() => props.pageSize ?? props.page_size ?? 10)

// ==================== 方法 ====================
/**
 * 处理每页显示条数变化
 * @param {number} size - 新的每页显示条数
 */
const handleSizeChange = (size: number) => {
    // 优先使用 emit，其次使用函数 props（向后兼容）
    emit('size-change', size)
    emit('update:pageSize', size)
    if (props.pageSizeChange) {
        props.pageSizeChange(size)
    }
}

/**
 * 处理当前页码变化
 * @param {number} page - 新的页码
 */
const handleCurrentChange = (page: number) => {
    // 优先使用 emit，其次使用函数 props（向后兼容）
    emit('current-change', page)
    emit('update:currentPage', page)
    if (props.pageChange) {
        props.pageChange(page)
    }
}
</script>

<style lang="scss" scoped>
.xl-pagination {
    margin-top: 10px;
    justify-content: flex-end;
}
</style>
