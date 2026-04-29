<template>
    <div class="xl-right-content">
        <el-dropdown v-if="ENABLE_I18N" size="default" type="default" trigger="click" @command="handleLanguageCommand" class="xl-theme-dropdown" teleported persistent>
            <div class="xl-theme-trigger xl-cursor-pointer" :title="t('layout.language.switch')">
                <el-icon size="20">
                    <i-ant-design-global-outlined />
                </el-icon>
            </div>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item v-for="item in localeOptions" :key="item.value" :command="item.value" :disabled="settingStore.locale === item.value">
                        {{ item.label }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <el-dropdown size="default" type="default" trigger="click" @command="handleThemeCommand" class="xl-theme-dropdown" teleported persistent>
            <div class="xl-theme-trigger xl-cursor-pointer" :title="t('layout.themeSwitch')">
                <el-icon size="20">
                    <i-lucide-sun-moon />
                </el-icon>
            </div>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item :command="THEME_MODE.LIGHT" :disabled="settingStore.theme === THEME_MODE.LIGHT">
                        <el-icon class="el-icon--right">
                            <i-ep-sunny />
                        </el-icon>
                        {{ t('layout.theme.light') }}
                    </el-dropdown-item>
                    <el-dropdown-item :command="THEME_MODE.DARK" :disabled="settingStore.theme === THEME_MODE.DARK">
                        <el-icon class="el-icon--right">
                            <i-ep-moon />
                        </el-icon>
                        {{ t('layout.theme.dark') }}
                    </el-dropdown-item>
                    <el-dropdown-item :command="THEME_MODE.SYSTEM" :disabled="settingStore.theme === THEME_MODE.SYSTEM">
                        <el-icon class="el-icon--right">
                            <i-ep-monitor />
                        </el-icon>
                        {{ t('layout.theme.system') }}
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>

        <el-dropdown size="large" type="default" trigger="click" @command="handleCommand" class="xl-user-dropdown" teleported persistent>
            <div class="xl-user-info xl-cursor-pointer">
                <div class="user-name">
                    <el-text :truncated="true" size="default">{{ authStore.userInfo.nickname }}</el-text>
                    <br />
                    <el-text type="info" size="small" :truncated="true">{{ authStore.userInfo.username }}</el-text>
                </div>
                <div class="user-avatar">
                    <el-avatar :size="AVATAR_CONFIG.SIZE" :src="getImageUrl(authStore.userInfo.avatar || '')" shape="circle">
                        <i-ep-avatar :width="AVATAR_CONFIG.ICON_SIZE" :height="AVATAR_CONFIG.ICON_SIZE" />
                    </el-avatar>
                </div>
            </div>
            <template #dropdown>
                <el-dropdown-menu>
                    <el-dropdown-item :command="COMMAND.USER_DETAIL">
                        <el-icon class="el-icon--right">
                            <i-ep-postcard />
                        </el-icon>
                        {{ t('layout.userDetail') }}
                    </el-dropdown-item>
                    <el-dropdown-item :command="COMMAND.USER_REFRESH">
                        <el-icon class="el-icon--right">
                            <i-ep-refresh />
                        </el-icon>
                        {{ t('layout.userRefresh') }}
                    </el-dropdown-item>
                    <el-dropdown-item divided :command="COMMAND.LOGOUT">
                        <el-icon class="el-icon--right">
                            <i-ant-design-logout-outlined />
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

        await logout()
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
        await authStore.refreshUserInfo()
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

const handleThemeCommand = (mode: ThemeMode) => {
    settingStore.setTheme(mode)
}

const handleLanguageCommand = async (locale: LocaleCode) => {
    if (settingStore.locale === locale) return

    settingStore.setLocale(locale)

    // 菜单标题由后端按请求语言返回，切换语言后需刷新菜单缓存
    if (!authStore.token) return

    try {
        await authStore.refreshUserInfo()
        if (authStore.routerData.length > 0) {
            addDynamicRoutes(authStore.routerData)
        }
    } catch (error) {
        Logger.error('切换语言后刷新菜单失败:', error)
        ElMessage({ type: 'error', message: t(RESULT_MESSAGES.REFRESH_FAILED) })
    }
}
</script>

<style lang="scss" scoped>
@import '@/assets/styles/layout/header.scss';

.xl-right-content {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 100%;

    .xl-theme-dropdown {
        display: flex;
        align-items: center;
        height: 100%;
    }

    .xl-theme-trigger {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--el-border-color);
        border-radius: 6px;
        color: var(--el-text-color-primary);
        transition: all 0.2s ease;

        &:hover {
            color: var(--el-color-primary);
            border-color: var(--el-color-primary-light-5);
            background-color: var(--el-fill-color-light);
        }
    }

    .xl-user-dropdown {
        height: 100%;
        padding-left: 20px;

        .xl-user-info {
            display: flex;
            align-items: center;
            .user-name {
                max-width: 100px;
                margin-right: 10px;
            }
            .user-avatar {
                width: 40px;
                height: 40px;
            }
        }
    }
}
</style>
