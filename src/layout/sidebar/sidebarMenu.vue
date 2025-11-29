<template>
    <el-scrollbar class="xl-scrollbar">
        <el-menu :default-active="activeMenu" class="el-menu-vertical-demo" :collapse-transition="true" :collapse="settingStore.isCollapse" :router="false" @select="handleMenuSelect">
            <!-- 加载状态 -->
            <div v-if="loading" class="loading-text">菜单加载中...</div>
            <template v-else>
                <!-- 空状态 -->
                <div v-if="visibleRoutes.length === 0" class="empty-text">暂无可用菜单</div>
                <!-- 菜单项列表 -->
                <sidebar-item v-for="route in visibleRoutes" :key="route.name" :route="route" />
            </template>
        </el-menu>
    </el-scrollbar>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import SidebarItem from './sidebarItem.vue'
import { useSettingStore } from '@/stores/setting'
import { useAuthStore } from '@/stores/auth'

// ==================== Store ====================
const settingStore = useSettingStore()
const authStore = useAuthStore()
const route = useRoute()

// ==================== 响应式数据 ====================
/** 当前激活的菜单项 */
const activeMenu = ref('')
/** 菜单加载状态 */
const loading = ref(false)

// ==================== 计算属性 ====================
/** 菜单路由数据 */
const menuRoutes = computed(() => authStore.routerData || [])

/** 可见的路由列表（过滤掉 show: false 的路由） */
const visibleRoutes = computed(() => {
    return menuRoutes.value.filter((route) => {
        const meta = route.meta || {}
        return meta.show !== false
    })
})

// ==================== 方法 ====================
/**
 * 处理菜单选择事件
 * 阻止默认行为，让 router-link 或自定义处理函数来处理导航
 */
const handleMenuSelect = () => {
    // 这里不做任何操作，因为导航已经由 linkItem 组件处理
}

// ==================== 监听器 ====================
/**
 * 监听路由变化，更新激活的菜单项
 */
watch(
    () => route.path,
    (newPath) => {
        activeMenu.value = route.meta?.activeMenu || newPath
    },
    { immediate: true }
)
</script>

<style scoped>
.loading-text,
.empty-text {
    padding: 20px;
    text-align: center;
    color: #999;
}
</style>
