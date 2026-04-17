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

<script setup lang="ts">
import { Icon as XlIcon } from '@iconify/vue'
import { isExternal } from '@/utils/helper'

// ==================== Props 定义 ====================
interface Props {
    /** 图标路径或名称 */
    icon?: string
    /** 图片图标的 alt 文本 */
    alt?: string
}

withDefaults(defineProps<Props>(), {
    icon: '',
    alt: '',
})
</script>

<style scoped>
.custom-icon {
    height: 100%;
}
</style>
