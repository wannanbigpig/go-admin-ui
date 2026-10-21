<template>
    <!-- Logo 区域 -->
    <xl-logo :collapsed="mobile ? false : undefined" />
    <!-- 折叠按钮 -->
    <xl-collapse-btn v-if="!mobile" />
    <!-- 侧边栏菜单 -->
    <xl-sidebar-menu :collapsed="mobile ? false : undefined" @navigate="$emit('navigate')" />
</template>

<script setup>
import XlLogo from './logo.vue'
import XlCollapseBtn from './collapseBtn.vue'
import XlSidebarMenu from './sidebarMenu.vue'

defineProps({ mobile: Boolean })
defineEmits(['navigate'])
</script>
