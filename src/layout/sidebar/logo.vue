<template>
  <div class="sidebar-logo-container" :class="{ collapse: settingStore.isCollapse }">
    <router-link class="sidebar-logo-link" to="/">
      <img src="@/assets/images/logo-frontend.png" class="sidebar-logo" alt="Logo" />
      <span
        class="sidebar-title animate__animated"
        :class="{ animate__bounceInLeft: !settingStore.isCollapse }"
      >
        X-L-Admin
      </span>
    </router-link>
  </div>
</template>

<script setup>
import { useSettingStore } from '@/stores/setting'

// ==================== Store ====================
const settingStore = useSettingStore()
</script>

<style lang="scss" scoped>
.sidebar-logo-container {
  box-sizing: border-box;
  border-bottom: 1px solid var(--el-color-info-light-8);
  height: calc($--xl-side-logo-height);

  .sidebar-logo-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: $--xl-side-logo-height;

    .sidebar-logo {
      width: 32px;
      height: 32px;
      padding: 0 15px;
    }

    .sidebar-title {
      line-height: $--xl-side-logo-height;
      font-weight: 600;
      font-size: 20px;
      white-space: nowrap;
      font-family: Inter, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB',
        'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
      color: #000;
    }
  }

  /* 折叠状态样式 */
  &.collapse {
    justify-content: center;

    .sidebar-title {
      overflow: hidden;
      visibility: hidden;
    }
  }
}
</style>
