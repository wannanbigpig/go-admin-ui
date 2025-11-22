<template>
  <div class="xl-search-btn">
    <el-button type="primary" @click="handleSearch" :disabled="loading">查询</el-button>
    <el-button v-if="withReset" @click="handleReset" :disabled="loading">重置</el-button>
    <el-text v-show="showCollapsible" class="xl-collapsible xl-cursor-pointer" type="primary" @click="toggleCollapse">
      {{ isFolded ? '收起' : '展开' }}
      <el-icon>
        <i-ep-arrow-down v-show="!isFolded" />
        <i-ep-arrow-up v-show="isFolded" />
      </el-icon>
    </el-text>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'

// ==================== Props 定义 ====================
const props = defineProps({
  /** 最大显示的表单项数量，超过此数量将显示折叠/展开按钮 */
  maxShow: {
    type: Number,
    default: 3,
  },
  /** 加载状态，控制按钮是否禁用 */
  loading: {
    type: Boolean,
    default: false,
  },
  /** 表单项选择器，用于查找需要控制的表单项 */
  nodeName: {
    type: String,
    default: '#searchForm > .el-col',
  },
  /** 查询按钮点击回调函数 */
  onSearch: {
    type: Function,
    default: () => {},
  },
  /** 重置按钮点击回调函数，如果不提供则使用 modelRef 的 resetFields 方法 */
  onReset: {
    type: Function,
    default: undefined,
  },
  /** 表单引用对象，用于获取表单元素或调用 resetFields 方法 */
  modelRef: {
    type: Object,
    default: null,
  },
  /** 是否显示重置按钮 */
  withReset: {
    type: Boolean,
    default: true,
  },
})

// ==================== 响应式数据 ====================
const isFolded = ref(false)
const visibleItems = ref([])

// ==================== 计算属性 ====================
const showCollapsible = computed(() => props.maxShow > 0 && visibleItems.value.length > props.maxShow)

// ==================== 方法 ====================
/**
 * 处理查询按钮点击
 */
const handleSearch = () => {
  props.onSearch()
}

/**
 * 切换折叠/展开状态
 */
const toggleCollapse = () => {
  isFolded.value = !isFolded.value
}

/**
 * 重置表单
 * 优先使用 onReset 回调，其次使用 modelRef 的 resetFields 方法
 */
const handleReset = () => {
  if (props.onReset) {
    props.onReset()
  } else if (props.modelRef?.resetFields) {
    props.modelRef.resetFields()
  } else {
    throw new Error('自定义重置方法和表单Ref二者必传一个，否则重置按钮无效')
  }
}

/**
 * 获取表单项元素并初始化可见性
 */
const getFormItems = async () => {
  await nextTick()
  const formItems = props.modelRef ? props.modelRef.$el.querySelectorAll(props.nodeName) : document.querySelectorAll(props.nodeName)

  formItems.forEach((item) => {
    visibleItems.value.push(item)
    // 如果超过最大显示数量，默认隐藏
    if (props.maxShow > 0 && visibleItems.value.length > props.maxShow) {
      item.classList.add('xl-display-none')
    }
  })
}

/**
 * 根据折叠状态和最大显示数量更新表单项的可见性
 */
const updateVisibility = () => {
  visibleItems.value.forEach((item, index) => {
    const shouldShow = isFolded.value || index < props.maxShow
    if (shouldShow) {
      item.classList.remove('xl-display-none')
    } else {
      item.classList.add('xl-display-none')
    }
  })
}

// ==================== 生命周期 ====================
onMounted(() => {
  getFormItems()
})

watch([() => props.maxShow, isFolded], () => {
  updateVisibility()
})
</script>

<style lang="scss" scoped>
.xl-search-btn {
  height: 50px;
  flex: 1;
  text-align: right;
  padding-right: 12px;
  min-width: 200px;
}

.xl-collapsible {
  margin-left: 12px;
}
</style>
