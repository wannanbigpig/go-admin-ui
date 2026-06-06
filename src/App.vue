<template>
    <el-config-provider :locale="elementLocale">
        <ErrorBoundary>
            <router-view />
        </ErrorBoundary>
    </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useSettingStore } from '@/stores/setting'
import ErrorBoundary from '@/components/errorBoundary/index.vue'

const settingStore = useSettingStore()

const elementLocale = computed(() => {
    return settingStore.locale === 'en-US' ? en : zhCn
})
</script>

<style lang="scss">
//
</style>
