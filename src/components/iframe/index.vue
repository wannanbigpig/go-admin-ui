<template>
  <iframe
    :src="iframeSrc"
    frameborder="0"
    width="100%"
    height="100%"
    allowfullscreen
    referrerpolicy="no-referrer-when-downgrade"
  ></iframe>
</template>

<script setup>
import { computed } from 'vue'

// ==================== Props 定义 ====================
const props = defineProps({
  /** iframe 源地址（兼容 to 属性） */
  to: {
    type: String,
    default: '',
  },
  /** iframe 源地址 */
  src: {
    type: String,
    default: '',
  },
})

// ==================== 计算属性 ====================
/** 获取 iframe 源地址，优先使用 src，其次使用 to（向后兼容） */
const iframeSrc = computed(() => props.src || props.to)
</script>
