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

<script setup>
import { computed } from 'vue'

// ==================== Props 定义 ====================
const props = defineProps({
  /** 当前页码 */
  currentPage: {
    type: Number,
    default: 1,
  },
  /** 每页显示条数 */
  pageSize: {
    type: Number,
    default: 10,
  },
  /** 总条数 */
  total: {
    type: Number,
    default: 0,
  },
  // 向后兼容：支持旧的命名方式
  page: {
    type: Number,
    default: undefined,
  },
  page_size: {
    type: Number,
    default: undefined,
  },
  // 向后兼容：支持函数 props
  pageSizeChange: {
    type: Function,
    default: undefined,
  },
  pageChange: {
    type: Function,
    default: undefined,
  },
})

// ==================== Emits 定义 ====================
const emit = defineEmits(['size-change', 'current-change', 'update:currentPage', 'update:pageSize'])

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
const handleSizeChange = (size) => {
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
const handleCurrentChange = (page) => {
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
