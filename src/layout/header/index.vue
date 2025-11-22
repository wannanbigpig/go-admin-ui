<template>
  <div class="xl-header-content">
    <!-- 左侧：刷新按钮和面包屑导航 -->
    <div class="xl-header-left">
      <xl-left />
    </div>
    <!-- 右侧：用户信息和操作菜单 -->
    <div class="xl-header-right">
      <xl-right />
    </div>
  </div>
</template>

<script setup>
import XlLeft from './left.vue'
import XlRight from './right.vue'
</script>
