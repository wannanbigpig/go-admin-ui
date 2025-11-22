<template>
  <div class="xl-left-content">
    <!-- 刷新按钮 -->
    <div class="xl-refresh-btn xl-cursor-pointer" @click="handleRefresh">
      <el-tooltip effect="dark" content="刷新页面" placement="bottom" :enterable="false">
        <el-icon size="24" :class="{ 'xl-refresh-icon': refreshStore.isRefreshing }">
          <i-ep-refresh />
        </el-icon>
      </el-tooltip>
    </div>
    <!-- 面包屑导航 -->
    <div>
      <xl-breadcrumb />
    </div>
  </div>
</template>

<script setup>
import XlBreadcrumb from '@/components/breadcrumb/index.vue'
import { useRefreshStore } from '@/stores/refresh'

// ==================== Store ====================
const refreshStore = useRefreshStore()

// ==================== 方法 ====================
/**
 * 处理页面刷新
 * 如果当前不在刷新状态，则触发刷新
 */
const handleRefresh = () => {
  if (!refreshStore.isRefreshing) {
    refreshStore.setKey()
  }
}
</script>

<style lang="scss" scoped>
.xl-left-content {
  height: 100%;
  display: flex;
  align-items: center;

  .xl-refresh-btn {
    width: 24px;
    height: 24px;
    margin-right: 10px;
    .xl-refresh-icon {
      @include rotate-forever(1s);
    }
  }
}
</style>
