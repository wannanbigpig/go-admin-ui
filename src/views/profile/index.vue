<template>
    <div>
        <div class="xl-container">
            <div class="xl-profile-header">
                <div class="xl-profile-avatar">
                    <el-avatar :size="120" :src="getImageUrl(userInfo.avatar)" shape="circle">
                        <el-icon size="80">
                            <i-ep-avatar />
                        </el-icon>
                    </el-avatar>
                    <div class="xl-profile-name">
                        <h2>{{ userInfo.nickname || userInfo.username || '未设置昵称' }}</h2>
                        <p class="xl-text-secondary">{{ userInfo.username }}</p>
                    </div>
                </div>
                <div class="xl-profile-actions">
                    <el-button type="primary" @click="openEditDrawer">编辑资料</el-button>
                </div>
            </div>

            <el-card class="xl-profile-card" shadow="never">
                <div class="xl-info-list">
                    <div class="xl-info-item">
                        <span class="xl-info-label">昵称</span>
                        <span class="xl-info-value">{{ userInfo.nickname || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">用户名</span>
                        <span class="xl-info-value">{{ userInfo.username || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">手机号</span>
                        <span class="xl-info-value">{{ userInfo.phone_number || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">邮箱</span>
                        <span class="xl-info-value">{{ userInfo.email || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">状态</span>
                        <el-tag :type="userInfo.status === STATUS.NORMAL ? 'success' : 'danger'" size="small">
                            {{ userInfo.status === STATUS.NORMAL ? '正常' : '禁用' }}
                        </el-tag>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">部门</span>
                        <span class="xl-info-value">{{ formatDepartments(userInfo.departments) }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">最后登录时间</span>
                        <span class="xl-info-value">{{ formatDateTime(userInfo.last_login) }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">最后登录IP</span>
                        <span class="xl-info-value">{{ userInfo.last_ip || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">创建时间</span>
                        <span class="xl-info-value">{{ formatDateTime(userInfo.created_at) }}</span>
                    </div>
                </div>
            </el-card>
        </div>

        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting">
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" :rules="formRules" :key="formKey">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="头像" prop="avatar">
                            <el-upload class="avatar-uploader" :show-file-list="false" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload" :http-request="customUpload">
                                <img w-full v-if="formData.avatar" :src="getImageUrl(formData.avatar)" class="avatar" />
                                <el-icon v-else class="avatar-uploader-icon"><i-ep-plus /></el-icon>
                            </el-upload>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="昵称" prop="nickname">
                            <el-input v-model.trim="formData.nickname" placeholder="请输入昵称"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="用户名" prop="username">
                            <el-input v-model.trim="formData.username" placeholder="请输入用户名" disabled></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="手机号" prop="phone_number">
                            <el-input v-model.trim="formData.phone_number" placeholder="请输入手机号" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="邮箱" prop="email">
                            <el-input v-model.trim="formData.email" placeholder="请输入邮箱"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-divider />
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="新密码" prop="password">
                            <el-input v-model.trim="formData.password" placeholder="留空则不修改密码" type="password" show-password></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="确认密码" prop="confirm_password">
                            <el-input v-model.trim="formData.confirm_password" placeholder="请再次输入新密码" type="password" show-password></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </xl-drawer>
    </div>
</template>

<style lang="scss" scoped>
.xl-container {
    padding: 20px;
}

.xl-profile-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30px 0;
    margin-bottom: 20px;

    .xl-profile-avatar {
        display: flex;
        align-items: center;
        gap: 20px;

        .xl-profile-name {
            h2 {
                margin: 0 0 8px 0;
                font-size: 24px;
                font-weight: 500;
            }

            p {
                margin: 0;
                font-size: 14px;
            }
        }
    }
}

.xl-profile-card {
    margin-bottom: 20px;
}

.xl-info-list {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 10px 0;

    .xl-info-item {
        display: flex;
        align-items: center;
        gap: 20px;

        .xl-info-label {
            min-width: 100px;
            color: var(--el-text-color-secondary);
            font-size: 14px;
        }

        .xl-info-value {
            flex: 1;
            color: var(--el-text-color-primary);
            font-size: 14px;
        }
    }
}

.xl-text-secondary {
    color: var(--el-text-color-secondary);
}

.avatar-uploader .avatar {
    width: 98px;
    height: 98px;
    display: block;
}
</style>

<style>
.avatar-uploader .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
    border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 98px;
    height: 98px;
    text-align: center;
}
</style>

<script setup>
import xlDrawer from '@/components/drawer/index.vue'
import { getImageUrl } from '@/utils/helper'
import { PROFILE_STATUS } from '@/modules/profile/model'
import { useProfilePage } from '@/modules/profile/useProfilePage'

const STATUS = PROFILE_STATUS
const { userInfo, showDrawer, formDataRef, formTitle, isSubmitting, formKey, formData, formRules, formatDepartments, formatDateTime, handleAvatarSuccess, beforeAvatarUpload, customUpload, openEditDrawer, editConfirmSubmit } =
    useProfilePage()
</script>
