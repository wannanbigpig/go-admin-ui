<template>
  <div>
    <!-- If the icon is an image -->
    <el-icon v-if="isExternal(icon)">
      <img :src="icon" :alt="alt" class="custom-icon" />
    </el-icon>

    <!-- If the icon is an iconify icon -->
    <el-icon v-else>
      <Icon :icon="icon" />
    </el-icon>
  </div>
</template>

<script setup>
import { Icon } from '@iconify/vue'
import { isExternal } from '@/utils/helper'

defineProps({
  icon: {
    type: String,
    default: '',
  },
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
