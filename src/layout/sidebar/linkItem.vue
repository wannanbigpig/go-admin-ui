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

<script setup>
import router from '@/router'
import { isExternal } from '@/utils/helper'

// ==================== Props 定义 ====================
const props = defineProps({
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
 * 处理 router-link 点击事件，确保不会触发整页刷新
 * @param {Event} event - 点击事件
 */
const handleRouterLinkClick = (event) => {
    // 如果当前路由和目标路由相同，阻止默认行为
    if (router.currentRoute.value.path === props.to) {
        event.preventDefault()
    }
}

/**
 * 处理外部链接，通过 iframe 方式打开
 * @param {Event} event - 点击事件
 * @param {string} url - 外部链接地址
 */
const handleToIframe = (event, url) => {
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
