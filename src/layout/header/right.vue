<template>
    <div class="xl-right-content">
        <div class="xl-action-item">
            <notification-center />
        </div>

        <div class="xl-action-item" @click="openExportCenter">
            <div class="xl-theme-trigger xl-cursor-pointer" role="button" tabindex="0" :aria-label="t('layout.exportCenter')" @keydown.enter="openExportCenter">
                <el-tooltip :content="t('layout.exportCenter')" placement="bottom" :show-after="200">
                    <div class="tooltip-trigger-area">
                        <el-icon size="20">
                            <i-lucide-inbox />
                        </el-icon>
                    </div>
                </el-tooltip>
            </div>
        </div>

        <el-dropdown v-if="ENABLE_I18N" size="default" type="default" trigger="click" @command="handleLanguageCommand" class="xl-action-item" teleported persistent>
            <div class="xl-theme-trigger xl-cursor-pointer" :aria-label="t('layout.language.switch')">
                <el-tooltip :content="t('layout.language.switch')" placement="bottom" :show-after="200">
                    <div class="tooltip-trigger-area">
                        <el-icon size="20">
                            <i-lucide-languages />
                        </el-icon>
                    </div>
                </el-tooltip>
            </div>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item v-for="item in localeOptions" :key="item.value" :command="item.value" :disabled="settingStore.locale === item.value">
                        {{ item.label }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <el-dropdown size="default" type="default" trigger="click" @command="handleThemeCommand" class="xl-action-item" teleported persistent>
            <div class="xl-theme-trigger xl-cursor-pointer" :aria-label="t('layout.themeSwitch')">
                <el-tooltip :content="t('layout.themeSwitch')" placement="bottom" :show-after="200">
                    <div class="tooltip-trigger-area">
                        <el-icon size="20">
                            <i-lucide-sun-moon />
                        </el-icon>
                    </div>
                </el-tooltip>
            </div>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item :command="THEME_MODE.LIGHT" :disabled="settingStore.theme === THEME_MODE.LIGHT">
                        <el-icon class="el-icon--right">
                            <i-lucide-sun />
                        </el-icon>
                        {{ t('layout.theme.light') }}
                    </el-dropdown-item>
                    <el-dropdown-item :command="THEME_MODE.DARK" :disabled="settingStore.theme === THEME_MODE.DARK">
                        <el-icon class="el-icon--right">
                            <i-lucide-moon />
                        </el-icon>
                        {{ t('layout.theme.dark') }}
                    </el-dropdown-item>
                    <el-dropdown-item :command="THEME_MODE.SYSTEM" :disabled="settingStore.theme === THEME_MODE.SYSTEM">
                        <el-icon class="el-icon--right">
                            <i-lucide-monitor />
                        </el-icon>
                        {{ t('layout.theme.system') }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <div class="divider"></div>

        <el-dropdown size="large" type="default" trigger="click" @command="handleCommand" class="xl-user-dropdown" teleported persistent>
            <div class="xl-user-info xl-cursor-pointer">
                <div class="user-name">
                    <el-text :truncated="true" size="default">{{ authStore.userInfo.nickname }}</el-text>
                    <el-text type="info" size="small" :truncated="true">{{ authStore.userInfo.username }}</el-text>
                </div>
                <div class="user-avatar">
                    <el-avatar :size="AVATAR_CONFIG.SIZE" :src="getImageUrl(authStore.userInfo.avatar || '')" shape="circle" :alt="authStore.userInfo.nickname || ''">
                        <i-lucide-user :width="AVATAR_CONFIG.ICON_SIZE" :height="AVATAR_CONFIG.ICON_SIZE" />
                    </el-avatar>
                </div>
            </div>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item :command="COMMAND.USER_DETAIL">
                        <el-icon class="el-icon--right">
                            <i-lucide-user-cog />
                        </el-icon>
                        {{ t('layout.userDetail') }}
                    </el-dropdown-item>
                    <el-dropdown-item :command="COMMAND.USER_REFRESH">
                        <el-icon class="el-icon--right">
                            <i-lucide-refresh-cw />
                        </el-icon>
                        {{ t('layout.userRefresh') }}
                    </el-dropdown-item>
                    <el-dropdown-item divided :command="COMMAND.LOGOUT">
                        <el-icon class="el-icon--right">
                            <i-lucide-log-out />
                        </el-icon>
                        {{ t('layout.logout') }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>

<script setup lang="ts">
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { useSettingStore, type ThemeMode } from '@/stores/setting'
import { logout } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CANCEL_BUTTON_TEXT, CONFIRM_BUTTON_TEXT, CONFIRM_DIALOG_TITLE, CONFIRM_MESSAGES, RESULT_MESSAGES } from '@/constants/messages'
import { getImageUrl } from '@/utils/helper'
import { Logger } from '@/utils/logger'
import { useI18n } from 'vue-i18n'
import type { LocaleCode } from '@/types/i18n'
import { LOCALE_OPTIONS, ENABLE_I18N } from '@/locales'
import { addDynamicRoutes } from '@/router/dynamicRoutes'
import { resolveRouteTitle } from '@/utils/routeTitle'
import NotificationCenter from './notificationCenter.vue'

enum COMMAND {
    USER_DETAIL = 'user-detail',
    USER_REFRESH = 'user-refresh',
    LOGOUT = 'logout',
}

const AVATAR_CONFIG = {
    SIZE: 40,
    ICON_SIZE: 30,
}

const THEME_MODE = {
    LIGHT: 'light' as ThemeMode,
    DARK: 'dark' as ThemeMode,
    SYSTEM: 'system' as ThemeMode,
}

const authStore = useAuthStore()
const settingStore = useSettingStore()
const { t } = useI18n()

const localeOptions = LOCALE_OPTIONS

const handleLogout = async () => {
    try {
        await ElMessageBox.confirm(t(CONFIRM_MESSAGES.LOGOUT), t(CONFIRM_DIALOG_TITLE), {
            confirmButtonText: t(CONFIRM_BUTTON_TEXT),
            cancelButtonText: t(CANCEL_BUTTON_TEXT),
            autofocus: false,
            type: 'warning',
        })

        await logout(authStore.refreshToken)
        authStore.logout(router.currentRoute.value.fullPath)
        ElMessage({ type: 'success', message: t(RESULT_MESSAGES.LOGOUT_SUCCESS) })
    } catch (error) {
        if (error !== 'cancel') {
            Logger.error('退出登录失败:', error)
        } else {
            ElMessage({ type: 'info', message: t(RESULT_MESSAGES.LOGOUT_CANCEL) })
        }
    }
}

const handleRefresh = async () => {
    try {
        await authStore.refreshUserInfo({ force: true })
        ElMessage({ type: 'success', message: t(RESULT_MESSAGES.REFRESH_SUCCESS) })
    } catch (error) {
        Logger.error('刷新缓存失败:', error)
        ElMessage({ type: 'error', message: t(RESULT_MESSAGES.REFRESH_FAILED) })
    }
}

const handleCommand = (command: COMMAND) => {
    switch (command) {
        case COMMAND.LOGOUT:
            handleLogout()
            break
        case COMMAND.USER_REFRESH:
            handleRefresh()
            break
        case COMMAND.USER_DETAIL:
            router.push({ name: 'Profile' })
            break
        default:
            Logger.warn('未知的命令类型:', command)
    }
}

const openExportCenter = () => {
    router.push({ path: '/task/center', query: { tab: 'export' } })
}

const handleThemeCommand = (mode: ThemeMode) => {
    settingStore.setTheme(mode)
}

const updateDocumentTitle = () => {
    const currentRoute = router.currentRoute.value
    const title = resolveRouteTitle({
        titleKey: currentRoute.meta?.titleKey as string,
        title: currentRoute.meta?.title as string,
        name: typeof currentRoute.name === 'string' ? currentRoute.name : '',
        path: currentRoute.path,
    })
    const appTitle = (import.meta.env.VITE_APP_TITLE as string) || ''
    if (title) {
        document.title = appTitle ? `${title} - ${appTitle}` : title
    } else if (appTitle) {
        document.title = appTitle
    }
}

const handleLanguageCommand = async (locale: LocaleCode) => {
    if (settingStore.locale === locale) return

    settingStore.setLocale(locale)

    // 语言切换后，立即为本地静态路由标题触发一次更新
    updateDocumentTitle()

    // 菜单标题由后端按请求语言返回，切换语言后需刷新菜单缓存
    if (!authStore.token) return

    try {
        await authStore.refreshUserInfo()
        if (authStore.routerData.length > 0) {
            addDynamicRoutes(authStore.routerData)
        }
        // 动态路由和用户信息刷新后，再次更新一次标题，确保动态标题和后端翻译一致
        updateDocumentTitle()
    } catch (error) {
        Logger.error('切换语言后刷新菜单失败:', error)
        ElMessage({ type: 'error', message: t(RESULT_MESSAGES.REFRESH_FAILED) })
    }
}
</script>

<style lang="scss" scoped>
@use '@/assets/styles/layout/header.scss' as *;

.xl-right-content {
    display: flex;
    align-items: center;
    gap: 12px;
    height: 100%;

    .xl-action-item {
        display: flex;
        align-items: center;
        height: 100%;
    }

    :deep(.xl-theme-trigger) {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 8px;
        color: var(--el-text-color-regular);
        transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
        background-color: transparent;

        /* 强制覆盖内部元素的对齐，解决不同图标库基线不一致导致的高低不平 */
        .el-icon {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .el-badge {
            display: flex;
            align-items: center;
            justify-content: center;
        }

        &:hover {
            color: var(--el-color-primary);
            background-color: var(--el-fill-color);
        }
    }

    .divider {
        width: 1px;
        height: 20px;
        background-color: var(--el-border-color-light);
        margin: 0 4px;
    }

    .xl-user-dropdown {
        height: 100%;
        margin-left: 4px;

        .xl-user-info {
            display: flex;
            align-items: center;
            .user-name {
                max-width: 100px;
                margin-right: 12px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: flex-end;
            }
            .user-avatar {
                width: 40px;
                height: 40px;
            }
        }
    }

    .tooltip-trigger-area {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
    }
}
</style>
