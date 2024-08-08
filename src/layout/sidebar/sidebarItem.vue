<template>
  <!-- If the route has children and should be shown, use el-sub-menu -->
  <el-sub-menu v-if="hasChildren && shouldShow" :index="route.name">
    <template #title>
      <icon-item :icon="route.meta.icon" />
      <span>{{ route.meta.title }}</span>
    </template>
    <!-- Recursively render child routes -->
    <sidebar-item v-for="child in route.children" :key="child.name" :route="child" :basePath="currentRoutePath" />
  </el-sub-menu>

  <!-- Render a single el-menu-item if there are no children -->
  <!-- <template v-else-if="shouldShow"> -->
  <link-item v-else-if="shouldShow" :to="currentRoutePath" :isNewWindow="route.meta.isNewWindow">
    <el-menu-item :index="currentRoutePath">
      <icon-item :icon="route.meta.icon" />
      <template #title>
        <span>{{ route.meta.title }}</span>
      </template>
    </el-menu-item>
  </link-item>
  <!-- </template> -->
</template>

<script setup>
import { computed } from 'vue'
import LinkItem from './linkItem.vue'
import IconItem from './iconItem.vue'
import { isExternal } from '@/utils/helper'

const props = defineProps({
  route: {
    type: Object,
    required: true,
  },
  basePath: {
    type: String,
    default: '/',
  },
})

const currentRoutePath = computed(() => {
  return resolvePath(props.route.path)
})

const hasChildren = computed(() => {
  return props.route.children && props.route.children.length > 0
})

const shouldShow = computed(() => {
  return props.route.meta && props.route.meta.show !== false
})

function resolvePath(routePath) {
  // Check if routePath is undefined or null and handle it appropriately
  if (routePath === undefined || routePath === null) {
    return props.basePath
  }

  if (isExternal(routePath)) {
    return routePath
  }

  if (isExternal(props.basePath)) {
    return props.basePath
  }

  // Check if routePath starts with '/'
  if (routePath.startsWith('/')) {
    return routePath
  }

  if (props.basePath.endsWith('/')) {
    return props.basePath + routePath
  }

  return props.basePath + '/' + routePath
}
</script>

<style scoped>
/* Add custom styles if needed */
</style>
