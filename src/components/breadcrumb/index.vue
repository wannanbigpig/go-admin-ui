<template>
    <el-breadcrumb separator="/">
        <transition-group name="breadcrumb">
            <el-breadcrumb-item v-for="crumb in breadcrumbs" :key="crumb.name" :to="!crumb.isCurrent ? crumb.path : ''">
                {{ crumb.name }}
            </el-breadcrumb-item>
        </transition-group>
    </el-breadcrumb>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { resolveRouteTitle } from '@/utils/routeTitle'

// ==================== 常量定义 ====================
const HOME_PATH = '/'
const IFRAME_PATH = '/iframe'

// ==================== 响应式数据 ====================
const route = useRoute()
const { t } = useI18n()

// ==================== 计算属性 ====================
/**
 * 计算面包屑导航数据
 * @returns {Array} 面包屑项数组，包含 name、path、isCurrent 属性
 */
const breadcrumbs = computed(() => {
    const matchedRoutes = route.matched
    const query = route.query

    const breadcrumbItems = matchedRoutes.map((matchedRoute) => {
        let name = resolveRouteTitle({
            titleKey: matchedRoute.meta?.titleKey as string,
            title: matchedRoute.meta?.title,
        })

        if (matchedRoute.path === IFRAME_PATH && typeof query.to === 'string') {
            name = query.to
        }

        if (matchedRoute.path === HOME_PATH) {
            name = t('layout.home')
        }

        return {
            name,
            path: matchedRoute.path,
            isCurrent: matchedRoute.path === route.path,
        }
    })

    if (breadcrumbItems.length > 0 && breadcrumbItems[0].path === HOME_PATH) {
        breadcrumbItems.shift()
    }

    return breadcrumbItems
})
</script>

<style scoped>
.breadcrumb-move,
.breadcrumb-enter-active,
.breadcrumb-leave-active {
    transition: all 1s ease;
}

.breadcrumb-enter-from,
.breadcrumb-leave-to {
    opacity: 0;
    transform: translateX(15px);
}

.breadcrumb-leave-active {
    position: absolute;
}
</style>
