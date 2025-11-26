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
import { onMounted, reactive, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getUserInfo, updateProfile } from '@/api/auth'
import { uploadAvatar } from '@/api/adminUser'
import { ElMessage } from 'element-plus'
import xlDrawer from '@/components/drawer/index.vue'
import { getImageUrl } from '@/utils/helper'

// ==================== 常量定义 ====================
const STATUS = {
    NORMAL: 1,
    DISABLED: 0,
}

const SUBMIT_DELAY = 3000

/** 头像上传配置 */
const AVATAR_CONFIG = {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    MAX_SIZE: 2 * 1024 * 1024, // 2MB
    UPLOAD_PATH: 'avatar',
}

// ==================== Store ====================
const authStore = useAuthStore()

// ==================== 响应式数据 ====================
const userInfo = ref({})
const loading = ref(false)
const showDrawer = ref(false)
const formDataRef = ref()
const formTitle = ref('编辑资料')
const isSubmitting = ref(false)
const formKey = ref(0)

// 表单初始数据
const initialFormData = {
    id: 0,
    nickname: '',
    username: '',
    phone_number: '',
    email: '',
    avatar: '', // 统一使用 uuid
    password: '',
    confirm_password: '',
}

const formData = reactive({ ...initialFormData })

// ==================== 表单验证规则 ====================
const formRules = {
    nickname: [{ required: true, message: '昵称不能为空', trigger: ['blur', 'change'] }],
    password: [
        {
            validator: (_, value, callback) => {
                if (value && (value.length < 6 || value.length > 20)) {
                    callback(new Error('密码长度6-20个字符'))
                } else {
                    callback()
                }
            },
            trigger: ['blur', 'change'],
        },
    ],
    confirm_password: [
        {
            validator: (_, value, callback) => {
                if (formData.password && value !== formData.password) {
                    callback(new Error('两次输入密码不一致'))
                } else {
                    callback()
                }
            },
            trigger: ['blur', 'change'],
        },
    ],
}

// ==================== 工具函数 ====================
/**
 * 格式化部门信息
 */
const formatDepartments = (departments) => {
    if (!departments || !Array.isArray(departments) || departments.length === 0) {
        return '-'
    }
    return departments.map((dept) => dept.name).join(', ')
}

/**
 * 格式化日期时间
 */
const formatDateTime = (dateTime) => {
    if (!dateTime) return '-'
    return dateTime
}

// ==================== 头像上传相关 ====================
/**
 * 头像上传成功回调
 */
const handleAvatarSuccess = (response) => {
    // 统一保存 uuid
    if (response && response.uuid) {
        formData.avatar = response.uuid
    }
}

/**
 * 头像上传前验证
 */
const beforeAvatarUpload = (rawFile) => {
    if (!AVATAR_CONFIG.ALLOWED_TYPES.includes(rawFile.type)) {
        ElMessage.error('头像图片必须是 JPG、PNG 或 GIF 格式！')
        return false
    }
    if (rawFile.size > AVATAR_CONFIG.MAX_SIZE) {
        ElMessage.error('头像图片大小不能超过 2MB！')
        return false
    }
    return true
}

/**
 * 自定义上传方法
 */
const customUpload = async ({ file, onError }) => {
    try {
        const res = await uploadAvatar(file, { path: AVATAR_CONFIG.UPLOAD_PATH })
        const result = res.data[0]
        if (result.status === 'SUCCESS') {
            ElMessage.success('上传成功')
            handleAvatarSuccess(result)
            return result
        }
        ElMessage.error(result.failure_reason)
        return null
    } catch (err) {
        onError?.(err)
        return null
    }
}

// ==================== 表单操作 ====================
/**
 * 重置表单数据
 */
const resetFormData = () => {
    Object.assign(formData, { ...initialFormData })
    if (formDataRef.value) {
        formDataRef.value.clearValidate()
    }
}

/**
 * 打开编辑抽屉
 */
const openEditDrawer = () => {
    resetFormData()
    formKey.value++

    // 直接使用已有的用户信息填充表单
    if (userInfo.value) {
        Object.assign(formData, {
            id: userInfo.value.id || authStore.userInfo?.id || 0,
            nickname: userInfo.value.nickname || '',
            username: userInfo.value.username || '',
            phone_number: userInfo.value.phone_number || '',
            email: userInfo.value.email || '',
            avatar: userInfo.value.avatar || '',
        })
    }

    showDrawer.value = true
}

/**
 * 提交表单
 */
const editConfirmSubmit = async () => {
    if (isSubmitting.value) return

    isSubmitting.value = true

    try {
        const valid = await formDataRef.value.validate().catch(() => false)
        if (!valid) {
            isSubmitting.value = false
            return
        }

        const submitData = {
            id: formData.id,
            nickname: formData.nickname,
        }

        // 只提交有值的字段
        if (formData.phone_number) {
            submitData.phone_number = formData.phone_number
        }
        if (formData.email) {
            submitData.email = formData.email
        }
        if (formData.avatar) {
            submitData.avatar = formData.avatar
        }
        if (formData.password) {
            submitData.password = formData.password
        }

        await updateProfile(submitData)

        // 刷新用户信息
        await loadUserInfo()

        showDrawer.value = false
        ElMessage.success('更新成功')
    } catch (error) {
        console.error('提交失败:', error)
    } finally {
        setTimeout(() => {
            isSubmitting.value = false
        }, SUBMIT_DELAY)
    }
}

// ==================== 数据加载 ====================
/**
 * 加载用户信息
 */
const loadUserInfo = async () => {
    loading.value = true
    try {
        const res = await getUserInfo()
        userInfo.value = res.data || {}
        // 同步更新 store 中的用户信息
        authStore.userInfo = userInfo.value
    } catch (error) {
        console.error('获取用户信息失败:', error)
        ElMessage.error('获取用户信息失败')
    } finally {
        loading.value = false
    }
}

// ==================== 生命周期 ====================
onMounted(() => {
    // 先从 store 中获取用户信息
    userInfo.value = authStore.userInfo || {}
    // 然后从服务器获取最新信息
    loadUserInfo()
})
</script>
