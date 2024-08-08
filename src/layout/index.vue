<template>
  <el-container class="common-layout">
    <el-aside id="xl-aside" :class="{ collapse: settingStore.isCollapse }">
      <xl-aside />
    </el-aside>

    <el-container class="right-container">
      <el-header class="xl-header">
        <xl-head />
      </el-header>

      <el-main class="xl-main">
        <xl-main />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
defineOptions({
  name: 'MainIndex',
})
import XlAside from '@/layout/sidebar/index.vue'
import XlMain from '@/layout/main/index.vue'
import XlHead from '@/layout/header/index.vue'

import { useSettingStore } from '@/stores/setting'
const settingStore = useSettingStore()
</script>

<style scoped lang="scss"></style>
