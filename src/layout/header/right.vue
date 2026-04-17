<template>
    <div class="xl-right-content">
        <el-dropdown size="large" type="default" trigger="hover" @command="handleCommand" class="xl-user-dropdown">
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
import { getImageUrl } from '@/utils/helper'

enum COMMAND {
    USER_DETAIL = 'user-detail',
    USER_REFRESH = 'user-refresh',
    LOGOUT = 'logout',
}

const MESSAGE = {
    LOGOUT_CONFIRM_TITLE: '温馨提示',
    LOGOUT_CONFIRM_CONTENT: '确定退出系统当前登录账号吗?',
    LOGOUT_SUCCESS: '退出成功',
    LOGOUT_CANCEL: '已取消操作',
    REFRESH_SUCCESS: '刷新成功',
}

const AVATAR_CONFIG = {
    SIZE: 40,
    ICON_SIZE: 30,
}

const authStore = useAuthStore()

const handleLogout = async () => {
    try {
        await ElMessageBox.confirm(MESSAGE.LOGOUT_CONFIRM_CONTENT, MESSAGE.LOGOUT_CONFIRM_TITLE, {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            autofocus: false,
            type: 'warning',
        })

        await logout()
        authStore.logout(router.currentRoute.value.fullPath)
        ElMessage({ type: 'success', message: MESSAGE.LOGOUT_SUCCESS })
    } catch (error) {
        if (error !== 'cancel') {
            console.error('退出登录失败:', error)
        } else {
            ElMessage({ type: 'info', message: MESSAGE.LOGOUT_CANCEL })
        }
    }
}

const handleRefresh = async () => {
    try {
        await authStore.refreshUserInfo()
        ElMessage({ type: 'success', message: MESSAGE.REFRESH_SUCCESS })
    } catch (error) {
        console.error('刷新缓存失败:', error)
        ElMessage({ type: 'error', message: '刷新失败，请稍后重试' })
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
            console.warn('未知的命令类型:', command)
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
