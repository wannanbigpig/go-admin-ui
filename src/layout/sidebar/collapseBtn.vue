<template>
  <div
    class="collapse-btn xl-cursor-pointer"
    :class="{ collapse: settingStore.isCollapse }"
    @click="handleToggleCollapse"
  >
    <el-icon v-if="settingStore.isCollapse">
      <i-ant-design-right-outlined class="collapse-btn-icon" />
    </el-icon>
    <el-icon v-else>
      <i-ant-design-left-outlined class="collapse-btn-icon" />
    </el-icon>
  </div>
</template>

<script setup>
import { useSettingStore } from '@/stores/setting'

// ==================== Store ====================
const settingStore = useSettingStore()

// ==================== 方法 ====================
/**
 * 切换侧边栏折叠状态
 */
const handleToggleCollapse = () => {
  settingStore.isCollapse = !settingStore.isCollapse
}
</script>

<style lang="scss" scoped>
.collapse-btn {
  width: $--xl-collapse-btn-width;
  height: $--xl-collapse-btn-height;
  border-radius: 40px;
  position: fixed;
  top: 100px;
  left: calc(var(--xl-aside-width) - $--xl-collapse-btn-width / 2);
  z-index: var(--xl-collapse-btn-z-index);
  background: #fff;
  inset-inline-end: -13px;
  transition: left 0.3s, transform 0.3s, width 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(0, 0, 0, 0.25);
  box-shadow:
    0 2px 8px -2px rgba(0, 0, 0, 0.1),
    0 1px 4px -1px rgba(25, 15, 15, 0.2),
    0 0 1px 0 rgba(0, 0, 0, 0.3);

  .collapse-btn-icon {
    width: 14px;
    height: 14px;
  }

  &:hover {
    box-shadow:
      0 4px 16px 2px rgba(0, 0, 0, 0.1),
      0 2px 8px 1px rgba(25, 15, 15, 0.2),
      0 0 2px 0 rgba(0, 0, 0, 0.3);
  }

  &.collapse {
    left: calc(var(--xl-aside-min-width) - 15px);
  }
}
</style>
