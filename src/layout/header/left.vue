<template>
  <div class="xl-left-content">
    <div>
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">homepage</el-breadcrumb-item>
        <el-breadcrumb-item>
          <a href="/">promotion management</a>
        </el-breadcrumb-item>
        <el-breadcrumb-item>promotion list</el-breadcrumb-item>
        <el-breadcrumb-item>promotion detail</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="refresh-btn">
      <el-tooltip effect="dark" content="刷新页面" placement="bottom" :enterable="false">
        <i-ep-refresh-right style="outline: none" width="24" height="24" @click="handleRefresh()" />
      </el-tooltip>
    </div>
  </div>
</template>
<script setup>
import router from '@/router'
function handleRefresh() {
  router.replace({
    path: '/refresh',
  })
}
</script>

<style lang="scss" scoped>
.xl-left-content {
  height: 100%;
  display: flex;
  align-items: center;

  .refresh-btn {
    width: 24px;
    height: 24px;
    margin-left: 10px;
    cursor: pointer;
  }
}
</style>
