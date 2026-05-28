<template>
    <!-- 有子路由：渲染为子菜单 -->
    <el-sub-menu v-if="hasChildren && shouldShow" :index="currentRoutePath">
        <template #title>
            <icon-item :icon="route.meta?.icon as string" />
            <span>{{ displayTitle }}</span>
        </template>
        <!-- 递归渲染子路由 -->
        <sidebar-item v-for="child in route.children" :key="String(child.name || child.path)" :route="child" :base-path="currentRoutePath" />
    </el-sub-menu>

    <!-- 无子路由：渲染为菜单项 -->
    <el-menu-item v-else-if="shouldShow" :index="currentRoutePath" @click="handleMenuClick">
        <icon-item :icon="route.meta?.icon as string" />
        <template #title>
            <span>{{ displayTitle }}</span>
        </template>
    </el-menu-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import router from '@/router'
import IconItem from './iconItem.vue'
import { isExternal } from '@/utils/helper'
import { resolveRouteTitle } from '@/utils/routeTitle'

defineOptions({
    name: 'SidebarItem',
})

// ==================== Props 定义 ====================
interface Props {
    /** 路由配置对象 */
    route: RouteRecordRaw
    /** 基础路径，用于拼接相对路径 */
    basePath?: string
}

const props = withDefaults(defineProps<Props>(), {
    basePath: '/',
})

// ==================== 计算属性 ====================
/** 当前路由的完整路径 */
const currentRoutePath = computed(() => {
    return resolvePath(props.route.path)
})

/** 是否有子路由 */
const hasChildren = computed(() => {
    return !!(props.route.children && props.route.children.length > 0)
})

/** 是否应该显示该菜单项 */
const shouldShow = computed(() => {
    return !!(props.route.meta && props.route.meta.show !== false)
})

const displayTitle = computed(() => {
    return resolveRouteTitle({
        titleKey: props.route.meta?.titleKey as string,
        title: props.route.meta?.title as string,
        name: typeof props.route.name === 'string' ? props.route.name : '',
        path: props.route.path,
    })
})

// ==================== 方法 ====================
/**
 * 解析路由路径
 */
const resolvePath = (routePath: string): string => {
    if (routePath === undefined || routePath === null) {
        return props.basePath
    }

    if (isExternal(routePath)) {
        return routePath
    }

    if (isExternal(props.basePath)) {
        return props.basePath
    }

    if (routePath.startsWith('/')) {
        return routePath
    }

    if (props.basePath.endsWith('/')) {
        return props.basePath + routePath
    }

    return `${props.basePath}/${routePath}`
}

/**
 * 处理菜单项点击事件，支持内链、新窗口外链 and iframe 外链
 */
const handleMenuClick = () => {
    const routePath = currentRoutePath.value
    const meta = props.route.meta || {}

    // 判断是否是外部链接
    const isExternalLink = Number(meta.isExternalLinks ?? 0) === 1 || isExternal(routePath)
    // 是否在新窗口打开
    const isNewWindow = Number(meta.isNewWindow ?? 0) === 1

    if (isExternalLink) {
        if (isNewWindow) {
            window.open(routePath, '_blank', 'noopener,noreferrer')
        } else {
            router.push({
                path: '/iframe',
                query: { to: routePath },
            })
        }
    } else {
        if (router.currentRoute.value.path !== routePath) {
            router.push(routePath)
        }
    }
}
</script>
