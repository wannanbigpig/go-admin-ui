<template>
  <div>
    <!-- 外部图片图标 -->
    <el-icon v-if="isExternal(icon)">
      <img :src="icon" :alt="alt" class="custom-icon" />
    </el-icon>

    <!-- Iconify 图标 -->
    <el-icon v-else>
      <xl-icon :icon="icon" />
    </el-icon>
  </div>
</template>

<script setup>
import { Icon as XlIcon } from '@iconify/vue'
import { isExternal } from '@/utils/helper'

// ==================== Props 定义 ====================
defineProps({
  /** 图标路径或名称 */
  icon: {
    type: String,
    default: '',
  },
  /** 图片图标的 alt 文本 */
  alt: {
    type: String,
    default: '',
  },
})
</script>

<style scoped>
.custom-icon {
  height: 100%;
}
</style>
