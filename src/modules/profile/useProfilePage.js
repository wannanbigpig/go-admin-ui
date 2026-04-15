import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { fetchProfileDetail, updateProfileDetail, uploadProfileAvatar } from '@/modules/profile/service'
import { createProfileForm, PROFILE_AVATAR_CONFIG, PROFILE_SUBMIT_DELAY } from '@/modules/profile/model'

export function useProfilePage() {
    const authStore = useAuthStore()
    const userInfo = ref({})
    const loading = ref(false)
    const showDrawer = ref(false)
    const formDataRef = ref()
    const formTitle = ref('编辑资料')
    const isSubmitting = ref(false)
    const formKey = ref(0)
    const initialFormData = createProfileForm()
    const formData = reactive({ ...initialFormData })

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

    const formatDepartments = (departments) => {
        if (!departments || !Array.isArray(departments) || departments.length === 0) {
            return '-'
        }

        return departments.map((dept) => dept.name).join(', ')
    }

    const formatDateTime = (dateTime) => {
        if (!dateTime) return '-'
        return dateTime
    }

    const handleAvatarSuccess = (response) => {
        if (response && response.uuid) {
            formData.avatar = response.uuid
        }
    }

    const beforeAvatarUpload = (rawFile) => {
        if (!PROFILE_AVATAR_CONFIG.ALLOWED_TYPES.includes(rawFile.type)) {
            ElMessage.error('头像图片必须是 JPG、PNG 或 GIF 格式！')
            return false
        }
        if (rawFile.size > PROFILE_AVATAR_CONFIG.MAX_SIZE) {
            ElMessage.error('头像图片大小不能超过 2MB！')
            return false
        }
        return true
    }

    const customUpload = async ({ file, onError }) => {
        try {
            const result = await uploadProfileAvatar(file, { path: PROFILE_AVATAR_CONFIG.UPLOAD_PATH })
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

    const resetFormData = () => {
        Object.assign(formData, { ...initialFormData })
        formDataRef.value?.clearValidate()
    }

    const openEditDrawer = () => {
        resetFormData()
        formKey.value += 1

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

    const loadUserInfo = async () => {
        loading.value = true
        try {
            userInfo.value = await fetchProfileDetail()
            authStore.userInfo = userInfo.value
        } catch (error) {
            console.error('获取用户信息失败:', error)
            ElMessage.error('获取用户信息失败')
        } finally {
            loading.value = false
        }
    }

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

            if (formData.phone_number) submitData.phone_number = formData.phone_number
            if (formData.email) submitData.email = formData.email
            if (formData.avatar) submitData.avatar = formData.avatar
            if (formData.password) submitData.password = formData.password

            await updateProfileDetail(submitData)
            await loadUserInfo()
            showDrawer.value = false
            ElMessage.success('更新成功')
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            setTimeout(() => {
                isSubmitting.value = false
            }, PROFILE_SUBMIT_DELAY)
        }
    }

    onMounted(() => {
        userInfo.value = authStore.userInfo || {}
        loadUserInfo()
    })

    return {
        userInfo,
        loading,
        showDrawer,
        formDataRef,
        formTitle,
        isSubmitting,
        formKey,
        formData,
        formRules,
        formatDepartments,
        formatDateTime,
        handleAvatarSuccess,
        beforeAvatarUpload,
        customUpload,
        openEditDrawer,
        editConfirmSubmit,
    }
}
