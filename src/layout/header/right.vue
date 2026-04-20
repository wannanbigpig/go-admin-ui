<template>
    <div class="xl-right-content">
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
                        个人中心
                    </el-dropdown-item>
                    <el-dropdown-item :command="COMMAND.USER_REFRESH">
                        <el-icon class="el-icon--right">
                            <i-ep-refresh />
                        </el-icon>
                        刷新缓存
                    </el-dropdown-item>
                    <el-dropdown-item divided :command="COMMAND.LOGOUT">
                        <el-icon class="el-icon--right">
                            <i-ant-design-logout-outlined />
                        </el-icon>
                        退出登录
                    </el-dropdown-item>
                </el-dropdown-menu>
            </template>
        </el-dropdown>
    </div>
</template>

<script setup lang="ts">
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import { logout } from '@/api/auth'
import { ElMessage, ElMessageBox } from 'element-plus'
import { CANCEL_BUTTON_TEXT, CONFIRM_BUTTON_TEXT, CONFIRM_DIALOG_TITLE, CONFIRM_MESSAGES, RESULT_MESSAGES } from '@/constants/messages'
import { getImageUrl } from '@/utils/helper'
import { Logger } from '@/utils/logger'

enum COMMAND {
    USER_DETAIL = 'user-detail',
    USER_REFRESH = 'user-refresh',
    LOGOUT = 'logout',
}

const AVATAR_CONFIG = {
    SIZE: 40,
    ICON_SIZE: 30,
}

const authStore = useAuthStore()

const handleLogout = async () => {
    try {
        await ElMessageBox.confirm(CONFIRM_MESSAGES.LOGOUT, CONFIRM_DIALOG_TITLE, {
            confirmButtonText: CONFIRM_BUTTON_TEXT,
            cancelButtonText: CANCEL_BUTTON_TEXT,
            autofocus: false,
            type: 'warning',
        })

        await logout()
        authStore.logout(router.currentRoute.value.fullPath)
        ElMessage({ type: 'success', message: RESULT_MESSAGES.LOGOUT_SUCCESS })
    } catch (error) {
        if (error !== 'cancel') {
            Logger.error('退出登录失败:', error)
        } else {
            ElMessage({ type: 'info', message: RESULT_MESSAGES.LOGOUT_CANCEL })
        }
    }
}

const handleRefresh = async () => {
    try {
        await authStore.refreshUserInfo()
        ElMessage({ type: 'success', message: RESULT_MESSAGES.REFRESH_SUCCESS })
    } catch (error) {
        Logger.error('刷新缓存失败:', error)
        ElMessage({ type: 'error', message: RESULT_MESSAGES.REFRESH_FAILED })
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
</script>

<style lang="scss" scoped>
@import '@/assets/styles/layout/header.scss';

.xl-right-content {
    display: flex;
    align-items: center;
    height: 100%;
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
