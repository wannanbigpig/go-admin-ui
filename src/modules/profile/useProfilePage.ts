import { onMounted, reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { useAuthStore } from '@/stores/auth'
import { createEmptyUserInfo } from '@/modules/auth/model'
import { fetchProfile, modifyProfile, uploadProfileAvatar } from '@/modules/profile/service'
import { PROFILE_AVATAR_CONFIG, PROFILE_SUBMIT_DELAY } from '@/modules/profile/model'
import { validateFormSafely } from '@/modules/shared/form'
import { pauseSync } from '@/utils/helper'
import type { UploadAvatarResult } from '@/modules/adminUser/service'
import type { UserInfo } from '@/types/auth'
import { translate } from '@/locales'

export function useProfilePage() {
    const authStore = useAuthStore()
    const userInfo = ref<UserInfo>({ ...createEmptyUserInfo(), ...authStore.userInfo })
    const loading = ref(false)
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref(translate('profile.editProfile'))
    const { isSubmitting, runWithSubmitLock } = useSubmitLock(0)
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
            { required: true, message: translate('validation.profile.nicknameRequired'), trigger: 'blur' },
            { min: 2, max: 20, message: translate('validation.profile.nicknameLength'), trigger: 'blur' },
        ],
        phone_number: [
            {
                pattern: /^1[3-9]\d{9}$/,
                message: translate('validation.profile.phoneInvalid'),
                trigger: 'blur',
            },
        ],
        email: [
            {
                type: 'email',
                message: translate('validation.profile.emailInvalid'),
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

    const isUploadResult = (value: unknown): value is UploadAvatarResult => {
        return typeof value === 'object' && value !== null
    }

    const handleAvatarSuccess = (response: UploadAvatarResult) => {
        if (response.uuid) {
            formData.avatar = response.uuid
            return
        }
        if (response.url) {
            formData.avatar = response.url
        }
    }

    const beforeAvatarUpload = (rawFile: File) => {
        if (!PROFILE_AVATAR_CONFIG.ALLOWED_TYPES.includes(rawFile.type)) {
            ElMessage.error(translate('validation.profile.avatarTypeInvalid'))
            return false
        }
        if (rawFile.size > PROFILE_AVATAR_CONFIG.MAX_SIZE) {
            ElMessage.error(translate('validation.profile.avatarSizeInvalid'))
            return false
        }
        return true
    }

    const customUpload = async ({ file, onError }: { file: File; onError?: (err?: Error) => void }) => {
        try {
            const result = await uploadProfileAvatar(file, { path: PROFILE_AVATAR_CONFIG.UPLOAD_PATH })
            if (!isUploadResult(result)) {
                ElMessage.error(translate('common.result.uploadFailed'))
                return null
            }
            const res = result
            if (res.status === 'SUCCESS') {
                ElMessage.success(translate('common.result.uploadSuccess'))
                handleAvatarSuccess(res)
                return res
            }
            ElMessage.error(res.failure_reason || translate('common.result.uploadFailed'))
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
            Logger.error('获取个人信息失败:', error)
        } finally {
            loading.value = false
        }
    }

    const openEditDrawer = () => {
        formTitle.value = translate('profile.editProfileInfo')
        formData.id = userInfo.value.id
        formData.nickname = userInfo.value.nickname
        formData.phone_number = typeof userInfo.value.phone_number === 'string' ? userInfo.value.phone_number : ''
        formData.email = typeof userInfo.value.email === 'string' ? userInfo.value.email : ''
        formData.avatar = userInfo.value.avatar || ''
        formData.password = ''

        showDrawer.value = true
        formKey.value++
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return
        const valid = await validateFormSafely(formDataRef.value, translate('validation.profileForm.formName'))
        if (!valid) return

        await runWithSubmitLock(async () => {
            const submitData: Record<string, unknown> = {
                id: formData.id,
                nickname: formData.nickname,
            }

            if (formData.phone_number) submitData.phone_number = formData.phone_number
            if (formData.email) submitData.email = formData.email
            if (formData.avatar) submitData.avatar = formData.avatar
            if (formData.password) submitData.password = formData.password

            await modifyProfile(submitData)
            ElMessage.success(translate('common.result.updateSuccess'))
            await pauseSync(PROFILE_SUBMIT_DELAY)
            await getProfile()
            showDrawer.value = false
        }, 0).catch((error) => {
            Logger.error('修改失败:', error)
        })
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
