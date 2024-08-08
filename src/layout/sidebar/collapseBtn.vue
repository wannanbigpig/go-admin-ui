<template>
  <div class="collapse-btn" :class="{ collapse: settingStore.isCollapse }">
    <i-ant-design-right-outlined class="collapse-btn-icon" v-if="settingStore.isCollapse" @click="settingStore.isCollapse = false" />
    <i-ant-design-left-outlined class="collapse-btn-icon" v-else @click="settingStore.isCollapse = true" />
  </div>
</template>

<script setup>
import { useSettingStore } from '@/stores/setting'
const settingStore = useSettingStore()
</script>

<style lang="scss" scoped>
.collapse-btn {
  box-shadow: 2px 0 3px 0 rgba(0, 0, 0, 0.3);
  width: $--xl-collapse-btn-width;
  height: $--xl-collapse-btn-height;
  border-radius: 50%;
  position: fixed;
  top: 35%;
  left: calc(var(--xl-aside-width) - $--xl-collapse-btn-width / 2);
  z-index: var(--xl-collapse-btn-z-index);
  background: #fff;
  transition: 0.3s left;
  cursor: pointer;
  .collapse-btn-icon {
    width: 100%;
    height: 100%;
  }
}
.collapse-btn:hover {
  box-shadow: 4px 0 6px 0 rgba(0, 0, 0, 0.2);
}
.collapse-btn.collapse {
  left: calc(var(--xl-aside-min-width) - 15px);
}
</style>
