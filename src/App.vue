<template>
    <el-config-provider :locale="elementLocale">
        <router-view />
    </el-config-provider>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { ElConfigProvider } from 'element-plus'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import en from 'element-plus/es/locale/lang/en'
import { useSettingStore } from '@/stores/setting'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { resolveRouteTitle } from '@/utils/routeTitle'

const settingStore = useSettingStore()
const route = useRoute()
const { t } = useI18n()

const elementLocale = computed(() => {
    return settingStore.locale === 'en-US' ? en : zhCn
})

const appTitle = computed(() => (import.meta.env.VITE_APP_TITLE as string) || t('common.appName'))
watch(
    () => [settingStore.locale, route.fullPath],
    () => {
        const routeTitle = resolveRouteTitle({
            titleKey: route.meta?.titleKey as string,
            title: route.meta?.title as string,
            name: typeof route.name === 'string' ? route.name : '',
            path: route.path,
        })
        document.title = routeTitle ? `${routeTitle} - ${appTitle.value}` : appTitle.value
    },
    { immediate: true }
)
</script>

<style lang="scss">
//
</style>
