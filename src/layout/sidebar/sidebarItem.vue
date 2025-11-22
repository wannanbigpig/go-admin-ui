<template>
  <!-- 有子路由：渲染为子菜单 -->
  <el-sub-menu v-if="hasChildren && shouldShow" :index="currentRoutePath">
    <template #title>
      <icon-item :icon="route.meta.icon" />
      <span>{{ route.meta.title }}</span>
    </template>
    <!-- 递归渲染子路由 -->
    <sidebar-item
      v-for="child in route.children"
      :key="child.name"
      :route="child"
      :base-path="currentRoutePath"
    />
  </el-sub-menu>

  <!-- 无子路由：渲染为菜单项 -->
  <link-item v-else-if="shouldShow" :to="currentRoutePath" :is-new-window="route.meta.isNewWindow">
    <el-menu-item :index="currentRoutePath">
      <icon-item :icon="route.meta.icon" />
      <template #title>
        <span>{{ route.meta.title }}</span>
      </template>
    </el-menu-item>
  </link-item>
</template>

<script setup>
import { computed } from 'vue'
import LinkItem from './linkItem.vue'
import IconItem from './iconItem.vue'
import { isExternal } from '@/utils/helper'

// ==================== Props 定义 ====================
const props = defineProps({
  /** 路由配置对象 */
  route: {
    type: Object,
    required: true,
  },
  /** 基础路径，用于拼接相对路径 */
  basePath: {
    type: String,
    default: '/',
  },
})

// ==================== 计算属性 ====================
/** 当前路由的完整路径 */
const currentRoutePath = computed(() => {
  return resolvePath(props.route.path)
})

/** 是否有子路由 */
const hasChildren = computed(() => {
  return props.route.children && props.route.children.length > 0
})

/** 是否应该显示该菜单项 */
const shouldShow = computed(() => {
  return props.route.meta && props.route.meta.show !== false
})

// ==================== 方法 ====================
/**
 * 解析路由路径
 * 处理相对路径、绝对路径和外部链接
 * @param {string} routePath - 路由路径
 * @returns {string} 解析后的完整路径
 */
const resolvePath = (routePath) => {
  // 处理 undefined 或 null
  if (routePath === undefined || routePath === null) {
    return props.basePath
  }

  // 外部链接直接返回
  if (isExternal(routePath)) {
    return routePath
  }

  // 如果基础路径是外部链接，返回基础路径
  if (isExternal(props.basePath)) {
    return props.basePath
  }

  // 绝对路径直接返回
  if (routePath.startsWith('/')) {
    return routePath
  }

  // 拼接相对路径
  if (props.basePath.endsWith('/')) {
    return props.basePath + routePath
  }

  return `${props.basePath}/${routePath}`
}
</script>

<style scoped>
/* 自定义样式 */
</style>
