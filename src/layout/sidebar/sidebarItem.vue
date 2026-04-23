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
    <link-item v-else-if="shouldShow" :to="currentRoutePath" :is-new-window="route.meta?.isNewWindow as boolean">
        <el-menu-item :index="currentRoutePath">
            <icon-item :icon="route.meta?.icon as string" />
            <template #title>
                <span>{{ displayTitle }}</span>
            </template>
        </el-menu-item>
    </link-item>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import LinkItem from './linkItem.vue'
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
</script>
