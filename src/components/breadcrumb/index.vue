<template>
  <el-breadcrumb separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="crumb in breadcrumbs" :key="crumb.name" :to="!crumb.isCurrent ? crumb.path : ''">
        {{ crumb.name }}
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

// ==================== 常量定义 ====================
const HOME_PATH = '/'
const IFRAME_PATH = '/iframe'
const HOME_NAME = '首页'

// ==================== 响应式数据 ====================
const route = useRoute()

// ==================== 计算属性 ====================
/**
 * 计算面包屑导航数据
 * @returns {Array} 面包屑项数组，包含 name、path、isCurrent 属性
 */
const breadcrumbs = computed(() => {
  const matchedRoutes = route.matched
  const query = route.query

  // 将匹配的路由转换为面包屑项
  const breadcrumbItems = matchedRoutes.map((matchedRoute) => {
    let name = matchedRoute.meta?.title || ''

    // 特殊处理 iframe 路由：使用 query.to 作为名称
    if (matchedRoute.path === IFRAME_PATH && query.to) {
      name = query.to
    }

    // 特殊处理首页：使用固定名称
    if (matchedRoute.path === HOME_PATH) {
      name = HOME_NAME
    }

    return {
      name,
      path: matchedRoute.path,
      isCurrent: matchedRoute.path === route.path,
    }
  })

  // 移除第一个首页项（如果存在），避免重复显示
  if (breadcrumbItems.length > 0 && breadcrumbItems[0].path === HOME_PATH) {
    breadcrumbItems.shift()
  }

  return breadcrumbItems
})
</script>

<style scoped>
/* 面包屑过渡动画 */
.breadcrumb-move,
.breadcrumb-enter-active,
.breadcrumb-leave-active {
  transition: all 1s ease;
}

/* 进入和离开的初始/结束状态 */
.breadcrumb-enter-from,
.breadcrumb-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

/* 确保离开的元素从布局流中删除，以便正确计算移动动画 */
.breadcrumb-leave-active {
  position: absolute;
}
</style>
