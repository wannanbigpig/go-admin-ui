<template>
    <!-- 内部路由链接 -->
    <router-link v-if="!isExternal(to)" class="linkStyle" :to="to" @click="handleRouterLinkClick">
        <slot />
    </router-link>
    <!-- 外部链接（新窗口打开） -->
    <a v-else-if="isNewWindow" class="linkStyle" rel="noopener noreferrer" target="_blank" :href="to">
        <slot />
    </a>
    <!-- 外部链接（iframe 方式打开） -->
    <a v-else class="linkStyle" href="javascript:void(0)" @click="(e) => handleToIframe(e, to)">
        <slot />
    </a>
</template>

<script setup lang="ts">
import router from '@/router'
import { isExternal } from '@/utils/helper'

// ==================== Props 定义 ====================
interface Props {
    /** 链接地址 */
    to: string
    /** 是否在新窗口打开（仅外部链接有效） */
    isNewWindow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isNewWindow: true,
})

// ==================== 方法 ====================
const handleRouterLinkClick = (event: MouseEvent) => {
    if (router.currentRoute.value.path === props.to) {
        event.preventDefault()
    }
}

const handleToIframe = (event: MouseEvent, url: string) => {
    event.preventDefault()
    event.stopPropagation()
    router.push({
        path: '/iframe',
        query: {
            to: url,
        },
    })
}
</script>
