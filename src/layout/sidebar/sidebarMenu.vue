<template>
  <el-scrollbar class="xl-scrollbar">
    <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" :collapse-transition="true" :collapse="settingStore.isCollapse">
      <sidebar-item v-for="route in visibleRoutes" :key="route.name" :route="route" />
    </el-menu>
  </el-scrollbar>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import SidebarItem from './sidebarItem.vue'
import router from '@/router/index.js'
import { useSettingStore } from '@/stores/setting'
const settingStore = useSettingStore()
const route = useRoute()

const activeMenu = route.path

const routes = router.options.routes.find((r) => r.path === '/').children

const visibleRoutes = computed(() => {
  return routes.filter((route) => route.meta && route.meta.show !== false)
})
</script>
