<template>
    <el-scrollbar class="xl-scrollbar">
        <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" :collapse-transition="false" :collapse="settingStore.isCollapse" :router="false" @select="handleMenuSelect">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-text">菜单加载中...</div>
            <template v-else>
                <!-- 空状态 -->
                <div v-if="visibleRoutes.length === 0" class="empty-text">暂无可用菜单</div>
                <!-- 菜单项列表 -->
                <sidebar-item v-for="routeItem in visibleRoutes" :key="String(routeItem.name || routeItem.path)" :route="routeItem" />
            </template>
        </el-menu>
    </el-scrollbar>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import SidebarItem from './sidebarItem.vue'
import { useSettingStore } from '@/stores/setting'
import { useAuthStore } from '@/stores/auth'

const settingStore = useSettingStore()
const authStore = useAuthStore()
const route = useRoute()

/** 当前激活的菜单项 */
const activeMenu = ref('')
/** 菜单加载状态 */
const loading = ref(false)

/** 菜单路由数据 */
const menuRoutes = computed(() => authStore.routerData || [])

/** 可见的路由列表（过滤掉 show: false 的路由） */
const visibleRoutes = computed(() => {
    return menuRoutes.value.filter((routeItem) => {
        const meta = routeItem.meta || {}
        return meta.show !== false
    })
})

const handleMenuSelect = () => {
    // 导航由 linkItem 处理
}

watch(
    () => route.path,
    (newPath) => {
        activeMenu.value = (route.meta?.activeMenu as string) || newPath
    },
    { immediate: true }
)
</script>

<style scoped lang="scss">
@import '@/assets/styles/layout/sidebar.scss';

.loading-text,
.empty-text {
    padding: 20px;
    text-align: center;
    color: #999;
}
</style>
