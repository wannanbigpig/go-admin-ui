<template>
    <iframe :src="iframeSrc" frameborder="0" width="100%" height="100%" allowfullscreen sandbox="allow-scripts allow-same-origin allow-forms" referrerpolicy="no-referrer-when-downgrade"></iframe>
</template>

<script setup lang="ts">
import { computed } from 'vue'

// ==================== Props 定义 ====================
interface Props {
    /** iframe 源地址（兼容 to 属性） */
    to?: string
    /** iframe 源地址 */
    src?: string
}

const props = withDefaults(defineProps<Props>(), {
    to: '',
    src: '',
})

// ==================== 计算属性 ====================
/** 获取 iframe 源地址，优先使用 src，其次使用 to（向后兼容） */
const iframeSrc = computed(() => props.src || props.to)
</script>
