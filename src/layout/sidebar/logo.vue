<template>
  <div class="sidebar-logo-container" :class="{ collapse: settingStore.isCollapse }">
    <router-link class="sidebar-logo-link" to="/">
      <img src="@/assets/images/logo-frontend.png" class="sidebar-logo" />
      <span class="sidebar-title">X-L-Admin</span>
    </router-link>
  </div>
</template>

<script setup>
import { useSettingStore } from "@/stores/setting";
const settingStore = useSettingStore();
</script>

<style lang="scss" scoped>
.sidebar-logo-container {
  border-bottom: 1px solid var(--el-border-color-extra-light);
  height: calc($--xl-side-logo - 1px);
  overflow: hidden;
  .sidebar-logo-link {
    display: flex;
    // justify-content: center;
    align-items: center;
    width: 100%;
    height: $--xl-side-logo;
    .sidebar-logo {
      width: 32px;
      height: 32px;
      padding: 0 15px;
    }
    .sidebar-title {
      line-height: $--xl-side-logo;
      font-weight: 600;
      font-size: 20px;
      font-family: Inter, "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;

      transition:
        opacity 1s ease-in-out,
        transform 1s ease-in-out;
      opacity: 1;
      transform: translateX(0);
      color: #000;
    }
  }
}
/* 添加一个类来表示折叠状态 */
.sidebar-logo-container.collapse {
  justify-content: center; /* 水平居中 */
  .sidebar-title {
    opacity: 0;
    transform: translateX(-100%);
    overflow: hidden;
    visibility: hidden;
  }
}
</style>
