<template>
    <div>
        <div class="xl-container">
            <div class="xl-profile-header">
                <div class="xl-profile-avatar">
                    <el-avatar :size="120" :src="getImageUrl(String(userInfo.avatar ?? ''))" shape="circle">
                        <el-icon size="80">
                            <i-ep-avatar />
                        </el-icon>
                    </el-avatar>
                    <div class="xl-profile-name">
                        <h2>{{ userInfo.nickname || userInfo.username || t('profile.notSetNickname') }}</h2>
                        <p class="xl-text-secondary">{{ userInfo.username }}</p>
                    </div>
                </div>
                <div class="xl-profile-actions">
                    <el-button type="primary" @click="openEditDrawer">{{ t('profile.editProfile') }}</el-button>
                </div>
            </div>

            <el-card class="xl-profile-card" shadow="never">
                <div class="xl-info-list">
                    <div class="xl-info-item">
                        <span class="xl-info-label">{{ t('common.labels.nickname') }}</span>
                        <span class="xl-info-value">{{ userInfo.nickname || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">{{ t('common.labels.username') }}</span>
                        <span class="xl-info-value">{{ userInfo.username || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">{{ t('common.labels.phone') }}</span>
                        <span class="xl-info-value">{{ userInfo.phone_number || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">{{ t('common.labels.email') }}</span>
                        <span class="xl-info-value">{{ userInfo.email || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">{{ t('common.labels.status') }}</span>
                        <el-tag :type="userInfo.status === STATUS.NORMAL ? 'success' : 'danger'" size="small">
                            {{ userInfo.status === STATUS.NORMAL ? t('common.status.enabled') : t('common.status.disabled') }}
                        </el-tag>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">{{ t('profile.departments') }}</span>
                        <span class="xl-info-value">{{ formatDepartments(userInfo.departments) }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">{{ t('profile.lastLoginTime') }}</span>
                        <span class="xl-info-value">{{ formatDateTime(userInfo.last_login) }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">{{ t('profile.lastLoginIp') }}</span>
                        <span class="xl-info-value">{{ userInfo.last_ip || '-' }}</span>
                    </div>
                    <div class="xl-info-item">
                        <span class="xl-info-label">{{ t('common.labels.createdAt') }}</span>
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
                        <el-form-item :label="t('common.labels.avatar')" prop="avatar">
                            <FilePicker v-model="formData.avatar" accept="image/*" :max-size="PROFILE_AVATAR_CONFIG.MAX_SIZE" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.nickname')" prop="nickname">
                            <el-input v-model.trim="formData.nickname" :placeholder="t('common.placeholders.inputNickname')"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.username')" prop="username">
                            <el-input v-model.trim="formData.username" :placeholder="t('common.placeholders.inputUsername')" disabled></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.phone')" prop="phone_number">
                            <el-input v-model.trim="formData.phone_number" :placeholder="t('common.placeholders.inputPhone')" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.email')" prop="email">
                            <el-input v-model.trim="formData.email" :placeholder="t('common.placeholders.inputEmail')"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-divider />
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('profile.newPassword')" prop="password">
                            <el-input v-model.trim="formData.password" :placeholder="t('profile.newPasswordPlaceholder')" type="password" show-password></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.confirmPassword')" prop="confirm_password">
                            <el-input v-model.trim="formData.confirm_password" :placeholder="t('profile.confirmNewPasswordPlaceholder')" type="password" show-password></el-input>
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
                margin: 0 0 var(--xl-space-2) 0;
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
    border-radius: var(--xl-radius-md);
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
    color: var(--el-text-color-secondary);
    width: 98px;
    height: 98px;
    text-align: center;
}
</style>

<script setup lang="ts">
import xlDrawer from '@/components/drawer/index.vue'
import FilePicker from '@/components/filePicker/index.vue'
import { getImageUrl } from '@/utils/helper'
import { PROFILE_AVATAR_CONFIG, PROFILE_STATUS } from '@/modules/profile/model'
import { useProfilePage } from '@/modules/profile/useProfilePage'
import { useI18n } from 'vue-i18n'

const STATUS = PROFILE_STATUS
const { t } = useI18n()
const { userInfo, showDrawer, formDataRef, formTitle, isSubmitting, formKey, formData, formRules, formatDepartments, formatDateTime, openEditDrawer, editConfirmSubmit } = useProfilePage()
</script>
