<template>
    <el-config-provider :locale="elementLocale">
        <router-view />
    </el-config-provider>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useSettingStore } from '@/stores/setting'

const settingStore = useSettingStore()

const elementLocale = computed(() => {
    return settingStore.locale === 'en-US' ? en : zhCn
})
</script>

<style lang="scss">
//
</style>
