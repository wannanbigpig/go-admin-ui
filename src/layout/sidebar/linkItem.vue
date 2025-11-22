<template>
  <!-- 内部路由链接 -->
  <router-link v-if="!isExternal(to)" class="linkStyle" :to="to">
    <slot />
  </router-link>
  <!-- 外部链接（新窗口打开） -->
  <a
    v-else-if="isNewWindow"
    class="linkStyle"
    rel="noopener noreferrer"
    target="_blank"
    :href="to"
  >
    <slot />
  </a>
  <!-- 外部链接（iframe 方式打开） -->
  <a v-else class="linkStyle" @click="handleToIframe(to)">
    <slot />
  </a>
</template>

<script setup>
import router from '@/router'
import { isExternal } from '@/utils/helper'

// ==================== Props 定义 ====================
defineProps({
  /** 链接地址 */
  to: {
    type: String,
    required: true,
  },
  /** 是否在新窗口打开（仅外部链接有效） */
  isNewWindow: {
    type: Boolean,
    default: true,
  },
})

// ==================== 方法 ====================
/**
 * 处理外部链接，通过 iframe 方式打开
 * @param {string} url - 外部链接地址
 */
const handleToIframe = (url) => {
  router.push({
    path: '/iframe',
    query: {
      to: url,
    },
  })
}
</script>
