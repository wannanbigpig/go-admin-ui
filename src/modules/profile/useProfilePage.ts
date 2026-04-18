import { onMounted, reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import { fetchProfile, modifyProfile, uploadProfileAvatar } from '@/modules/profile/service'
import { PROFILE_AVATAR_CONFIG, PROFILE_SUBMIT_DELAY } from '@/modules/profile/model'
import type { UserInfo } from '@/types/auth'

interface UploadResult {
    status: string
    failure_reason?: string
    uuid?: string
}

export function useProfilePage() {
    const authStore = useAuthStore()
    const userInfo = ref<UserInfo>(authStore.userInfo || ({} as UserInfo))
    const loading = ref(false)
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('编辑资料')
    const isSubmitting = ref(false)
    const formKey = ref(0)

    const formData = reactive({
        id: 0,
        nickname: '',
        phone_number: '',
        email: '',
        avatar: '',
        password: '',
    })

    const formRules = {
        nickname: [
            { required: true, message: '昵称不能为空', trigger: 'blur' },
            { min: 2, max: 20, message: '昵称长度应在 2-20 个字符之间', trigger: 'blur' },
        ],
        phone_number: [
            {
                pattern: /^1[3-9]\d{9}$/,
                message: '请输入正确的手机号码',
                trigger: 'blur',
            },
        ],
        email: [
            {
                type: 'email',
                message: '请输入正确的邮箱地址',
                trigger: ['blur', 'change'],
            },
        ],
    }

    const formatDepartments = (departments: Array<{ name: string }>) => {
        if (!departments || !Array.isArray(departments) || departments.length === 0) {
            return '-'
        }
        return departments.map((dept) => dept.name).join(', ')
    }

    const formatDateTime = (dateTime: string) => {
        if (!dateTime) return '-'
        return dateTime
    }

    const handleAvatarSuccess = (response: Record<string, unknown>) => {
        if (response && response.uuid) {
            formData.avatar = response.uuid as string
        }
    }

    const beforeAvatarUpload = (rawFile: File) => {
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

    const customUpload = async ({ file, onError }: { file: File; onError?: (err?: Error) => void }) => {
        try {
            const result = await uploadProfileAvatar(file, { path: PROFILE_AVATAR_CONFIG.UPLOAD_PATH })
            const res = result as unknown as UploadResult
            if (res.status === 'SUCCESS') {
                ElMessage.success('上传成功')
                handleAvatarSuccess(res as unknown as Record<string, unknown>)
                return res
            }
            ElMessage.error(res.failure_reason || '上传失败')
            return null
        } catch (err) {
            onError?.(err as Error)
            return null
        }
    }

    const getProfile = async () => {
        loading.value = true
        try {
            const data = await fetchProfile()
            userInfo.value = data
            // 刷新 Store 中的用户信息
            await authStore.refreshUserInfo()
        } catch (error) {
            console.error('获取个人信息失败:', error)
        } finally {
            loading.value = false
        }
    }

    const openEditDrawer = () => {
        formTitle.value = '编辑个人资料'
        formData.id = userInfo.value.id
        formData.nickname = userInfo.value.nickname
        formData.phone_number = (userInfo.value.phone_number as string) || ''
        formData.email = (userInfo.value.email as string) || ''
        formData.avatar = userInfo.value.avatar || ''
        formData.password = ''

        showDrawer.value = true
        formKey.value++
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return
        isSubmitting.value = true

        try {
            const valid = await formDataRef.value?.validate().catch(() => false)
            if (!valid) {
                isSubmitting.value = false
                return
            }

            const submitData: Record<string, unknown> = {
                id: formData.id,
                nickname: formData.nickname,
            }

            if (formData.phone_number) submitData.phone_number = formData.phone_number
            if (formData.email) submitData.email = formData.email
            if (formData.avatar) submitData.avatar = formData.avatar
            if (formData.password) submitData.password = formData.password

            await modifyProfile(submitData)
            ElMessage.success('修改成功')

            setTimeout(async () => {
                await getProfile()
                showDrawer.value = false
            }, PROFILE_SUBMIT_DELAY)
        } catch (error) {
            console.error('修改失败:', error)
        } finally {
            isSubmitting.value = false
        }
    }

    onMounted(() => {
        getProfile()
    })

    return {
        authStore,
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
