<template>
    <div>
        <div class="xl-container">
            <el-row :gutter="24" class="profile-layout">
                <!-- 左侧个人卡片 -->
                <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="7">
                    <el-card class="profile-card profile-sidebar-card" shadow="never">
                        <!-- 渐变质感背景区 -->
                        <div class="profile-sidebar-bg"></div>
                        <div class="profile-sidebar-content">
                            <div class="profile-avatar-wrapper">
                                <el-avatar :size="110" :src="getImageUrl(String(userInfo.avatar ?? ''))" shape="circle" class="profile-avatar" :alt="userInfo.nickname || ''">
                                    <el-icon size="70">
                                        <i-ep-avatar />
                                    </el-icon>
                                </el-avatar>
                            </div>
                            <div class="profile-basic-info">
                                <h2 class="profile-nickname">{{ userInfo.nickname || userInfo.username || t('profile.notSetNickname') }}</h2>
                                <span class="profile-username">@{{ userInfo.username }}</span>
                                <div class="profile-tag-list">
                                    <el-tag size="small" type="primary" class="role-tag" effect="light">{{ t('common.labels.status') }}</el-tag>
                                    <el-tag :type="userInfo.status === STATUS.NORMAL ? 'success' : 'danger'" size="small" effect="dark" class="status-tag">
                                        {{ userInfo.status === STATUS.NORMAL ? t('common.status.enabled') : t('common.status.disabled') }}
                                    </el-tag>
                                </div>
                            </div>

                            <el-divider border-style="dashed" />

                            <!-- 附带小图标的登录历史信息 -->
                            <div class="profile-history-info">
                                <div class="history-item">
                                    <el-icon class="history-icon"><Clock /></el-icon>
                                    <div class="history-detail">
                                        <span class="history-label">{{ t('profile.lastLoginTime') }}</span>
                                        <span class="history-value">{{ formatDateTime(userInfo.last_login) }}</span>
                                    </div>
                                </div>
                                <div class="history-item">
                                    <el-icon class="history-icon"><Location /></el-icon>
                                    <div class="history-detail">
                                        <span class="history-label">{{ t('profile.lastLoginIp') }}</span>
                                        <span class="history-value">{{ userInfo.last_ip || '-' }}</span>
                                    </div>
                                </div>
                                <div class="history-item">
                                    <el-icon class="history-icon"><Calendar /></el-icon>
                                    <div class="history-detail">
                                        <span class="history-label">{{ t('common.labels.createdAt') }}</span>
                                        <span class="history-value">{{ formatDateTime(userInfo.created_at) }}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="profile-actions-wrapper">
                                <el-button type="primary" class="edit-btn" @click="openEditDrawer" :icon="Edit">
                                    {{ t('profile.editProfile') }}
                                </el-button>
                            </div>
                        </div>
                    </el-card>
                </el-col>

                <!-- 右侧详细信息 -->
                <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="17">
                    <el-card class="profile-card profile-detail-card" shadow="never">
                        <template #header>
                            <div class="card-header-title">
                                <el-icon class="header-icon"><User /></el-icon>
                                <span>{{ t('common.labels.basicInfo') }}</span>
                            </div>
                        </template>
                        <div class="profile-detail-grid">
                            <div class="detail-item-card">
                                <div class="item-icon-box nickname-icon">
                                    <el-icon><User /></el-icon>
                                </div>
                                <div class="item-content">
                                    <span class="item-label">{{ t('common.labels.nickname') }}</span>
                                    <span class="item-value" :title="userInfo.nickname || ''">{{ userInfo.nickname || '-' }}</span>
                                </div>
                            </div>

                            <div class="detail-item-card">
                                <div class="item-icon-box username-icon">
                                    <el-icon><Cpu /></el-icon>
                                </div>
                                <div class="item-content">
                                    <span class="item-label">{{ t('common.labels.username') }}</span>
                                    <span class="item-value" :title="userInfo.username || ''">{{ userInfo.username || '-' }}</span>
                                </div>
                            </div>

                            <div class="detail-item-card">
                                <div class="item-icon-box phone-icon">
                                    <el-icon><Phone /></el-icon>
                                </div>
                                <div class="item-content">
                                    <span class="item-label">{{ t('common.labels.phone') }}</span>
                                    <div class="item-value-wrapper">
                                        <span class="item-value" :title="String(userInfo.phone_number || '')">
                                            {{ phoneVisible ? userInfo.phone_number || '-' : maskPhone(String(userInfo.phone_number || '')) }}
                                        </span>
                                        <el-icon class="eye-icon" @click="phoneVisible = !phoneVisible">
                                            <component :is="phoneVisible ? View : Hide" />
                                        </el-icon>
                                    </div>
                                </div>
                            </div>

                            <div class="detail-item-card">
                                <div class="item-icon-box email-icon">
                                    <el-icon><Message /></el-icon>
                                </div>
                                <div class="item-content">
                                    <span class="item-label">{{ t('common.labels.email') }}</span>
                                    <div class="item-value-wrapper">
                                        <span class="item-value" :title="String(userInfo.email || '')">
                                            {{ emailVisible ? userInfo.email || '-' : maskEmail(String(userInfo.email || '')) }}
                                        </span>
                                        <el-icon class="eye-icon" @click="emailVisible = !emailVisible">
                                            <component :is="emailVisible ? View : Hide" />
                                        </el-icon>
                                    </div>
                                </div>
                            </div>

                            <div class="detail-item-card">
                                <div class="item-icon-box dept-icon">
                                    <el-icon><OfficeBuilding /></el-icon>
                                </div>
                                <div class="item-content">
                                    <span class="item-label">{{ t('profile.departments') }}</span>
                                    <span class="item-value" :title="formatDepartments(userInfo.departments)">{{ formatDepartments(userInfo.departments) }}</span>
                                </div>
                            </div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </div>

        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting">
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" :rules="formRules" :key="formKey">
                <el-row>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.avatar')" prop="avatar">
                            <AvatarUpload v-model="formData.avatar" :max-size="PROFILE_AVATAR_CONFIG.MAX_SIZE" />
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

<script setup lang="ts">
import { ref } from 'vue'
import xlDrawer from '@/components/drawer/index.vue'
import AvatarUpload from '@/components/avatarUpload/index.vue'
import { getImageUrl } from '@/utils/helper'
import { PROFILE_AVATAR_CONFIG, PROFILE_STATUS } from '@/modules/profile/model'
import { useProfilePage } from '@/modules/profile/useProfilePage'
import { useI18n } from 'vue-i18n'
import { User, Phone, Message, OfficeBuilding, Calendar, Location, Clock, Edit, Cpu, View, Hide } from '@element-plus/icons-vue'

const STATUS = PROFILE_STATUS
const { t } = useI18n()
const { userInfo, showDrawer, formDataRef, formTitle, isSubmitting, formKey, formData, formRules, formatDepartments, formatDateTime, openEditDrawer, editConfirmSubmit } = useProfilePage()

const phoneVisible = ref(false)
const emailVisible = ref(false)

const maskPhone = (phone?: string) => {
    if (!phone) return '-'
    const p = String(phone).trim()
    if (p.length < 7) return p
    return p.replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2')
}

const maskEmail = (email?: string) => {
    if (!email) return '-'
    const e = String(email).trim()
    const parts = e.split('@')
    if (parts.length !== 2) return e
    const name = parts[0]
    const domain = parts[1]
    if (name.length <= 3) {
        return `${name.substring(0, 1)}***@${domain}`
    }
    return `${name.substring(0, 3)}***${name.substring(name.length - 1)}@${domain}`
}
</script>

<style lang="scss" scoped>
.xl-container {
    padding: 24px;
    background-color: var(--el-fill-color-blank);
    min-height: calc(100vh - 120px);
}

.profile-layout {
    margin-top: 10px;
}

.profile-card {
    border: 1px solid var(--el-border-color-light) !important;
    border-radius: 12px !important;
    overflow: hidden !important;
    background-color: var(--el-bg-color);
    transition:
        transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1),
        box-shadow 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    margin-bottom: 20px;
    height: calc(100% - 20px);
    display: flex;
    flex-direction: column;

    &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06) !important;
    }
}

/* 左侧账号面板 */
.profile-sidebar-card {
    position: relative;
    overflow: hidden;

    :deep(.el-card__body) {
        padding: 0 !important;
        overflow: hidden !important;
        border-radius: 12px !important;
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
    }
}

.profile-sidebar-bg {
    height: 135px;
    background: linear-gradient(135deg, rgba(142, 197, 252, 0.7) 0%, rgba(224, 195, 252, 0.7) 100%);
    opacity: 0.85;
    border-top-left-radius: 11px; /* 减去外层卡片 1px border 宽度 */
    border-top-right-radius: 11px;
    clip-path: ellipse(120% 100% at 50% 0%);
    position: relative;
    z-index: 1;
}

.profile-sidebar-content {
    padding: 0 24px 30px;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    width: 100%;
    box-sizing: border-box;
    position: relative;
    z-index: 2;
}

.profile-avatar-wrapper {
    margin-top: -55px;
    margin-bottom: 16px;
    border-radius: 50%;
    padding: 4px;
    background-color: var(--el-bg-color);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08);
    position: relative;
    z-index: 3;

    .profile-avatar {
        border: 2px solid var(--el-bg-color);
        transition:
            transform 0.4s ease,
            box-shadow 0.4s ease;

        &:hover {
            transform: scale(1.05) rotate(5deg);
            box-shadow: 0 0 0 6px rgba(142, 197, 252, 0.3);
        }
    }
}

.profile-basic-info {
    text-align: center;
    width: 100%;
    margin-bottom: 20px;

    .profile-nickname {
        font-size: 20px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin: 0 0 6px 0;
    }

    .profile-username {
        font-size: 13px;
        color: var(--el-text-color-secondary);
        display: block;
        margin-bottom: 12px;
    }

    .profile-tag-list {
        display: flex;
        justify-content: center;
        gap: 8px;
        margin-bottom: 10px;

        .role-tag {
            border-radius: 4px;
        }
        .status-tag {
            border-radius: 4px;
        }
    }
}

.profile-history-info {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin: 10px 0 24px 0;

    .history-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;

        .history-icon {
            font-size: 16px;
            color: var(--el-color-primary-light-3);
            margin-top: 2px;
        }

        .history-detail {
            display: flex;
            flex-direction: column;
            gap: 2px;

            .history-label {
                font-size: 12px;
                color: var(--el-text-color-secondary);
            }

            .history-value {
                font-size: 13px;
                color: var(--el-text-color-primary);
                word-break: break-all;
            }
        }
    }
}

.profile-actions-wrapper {
    width: 100%;
    margin-top: auto;

    .edit-btn {
        width: 100%;
        height: 38px;
        border-radius: 8px;
        font-weight: 500;
        letter-spacing: 0.5px;
        transition: all 0.2s ease;

        &:hover {
            box-shadow: 0 4px 12px rgba(var(--el-color-primary-rgb), 0.3);
        }
    }
}

/* 右侧基本资料卡片 */
.profile-detail-card {
    height: calc(100% - 20px);
    display: flex;
    flex-direction: column;

    :deep(.el-card__body) {
        flex: 1;
    }

    .card-header-title {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);

        .header-icon {
            color: var(--el-color-primary);
        }
    }

    :deep(.el-card__header) {
        border-bottom: 1px solid var(--el-border-color-lighter);
        padding: 16px 24px;
    }
}

.profile-detail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    padding: 8px 0;
}

.detail-item-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 18px 20px;
    border-radius: 10px;
    background-color: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

    &:hover {
        border-color: var(--el-color-primary-light-5);
        background-color: var(--el-color-primary-light-9);
        transform: translateX(4px);

        .item-icon-box {
            transform: scale(1.1);
        }
    }

    .item-icon-box {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: transform 0.3s ease;

        &.nickname-icon {
            background-color: rgba(64, 158, 255, 0.1);
            color: #409eff;
        }

        &.username-icon {
            background-color: rgba(103, 194, 58, 0.1);
            color: #67c23a;
        }

        &.phone-icon {
            background-color: rgba(230, 162, 60, 0.1);
            color: #e6a23c;
        }

        &.email-icon {
            background-color: rgba(245, 108, 108, 0.1);
            color: #f56c6c;
        }

        &.dept-icon {
            background-color: rgba(144, 147, 153, 0.1);
            color: #909399;
        }
    }

    .item-content {
        display: flex;
        flex-direction: column;
        gap: 4px;
        flex: 1;
        min-width: 0;

        .item-label {
            font-size: 12px;
            color: var(--el-text-color-secondary);
        }

        .item-value-wrapper {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            width: 100%;

            .item-value {
                font-size: 14px;
                color: var(--el-text-color-primary);
                font-weight: 500;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .eye-icon {
                cursor: pointer;
                color: var(--el-text-color-placeholder);
                font-size: 16px;
                transition: all 0.2s ease;
                padding: 4px;
                border-radius: 4px;
                display: inline-flex;
                align-items: center;
                justify-content: center;

                &:hover {
                    color: var(--el-color-primary);
                    background-color: var(--el-fill-color-light);
                }
            }
        }
    }
}
</style>
