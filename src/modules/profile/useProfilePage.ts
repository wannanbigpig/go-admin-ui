import { onMounted, reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { useAuthStore } from '@/stores/auth'
import { createEmptyUserInfo } from '@/modules/auth/model'
import { fetchProfile, modifyProfile } from '@/modules/profile/service'
import { createProfileForm } from '@/modules/profile/model'
import { validateFormSafely } from '@/modules/shared/form'
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

    const formData = reactive(createProfileForm())

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

    const formatDepartments = (departments: unknown) => {
        if (!Array.isArray(departments) || departments.length === 0) {
            return '-'
        }
        const names = departments
            .map((dept) => {
                if (typeof dept === 'object' && dept !== null && 'name' in dept) {
                    return String((dept as { name?: unknown }).name ?? '').trim()
                }
                return ''
            })
            .filter(Boolean)
        return names.length > 0 ? names.join(', ') : '-'
    }

    const formatDateTime = (dateTime: unknown) => {
        if (typeof dateTime === 'string') {
            return dateTime || '-'
        }
        if (typeof dateTime === 'number') {
            return String(dateTime)
        }
        return '-'
    }

    const getProfile = async () => {
        loading.value = true
        try {
            const data = await fetchProfile()
            userInfo.value = data
            // 直接用本次结果同步 Store，避免重复请求 admin-user/get 与无谓的菜单刷新（资料修改不影响菜单/权限）。
            authStore.userInfo = data
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
        formData.username = userInfo.value.username
        formData.phone_number = typeof userInfo.value.phone_number === 'string' ? userInfo.value.phone_number : ''
        formData.email = typeof userInfo.value.email === 'string' ? userInfo.value.email : ''
        formData.avatar = userInfo.value.avatar || ''
        formData.password = ''
        formData.confirm_password = ''

        showDrawer.value = true
        formKey.value++
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return
        const valid = await validateFormSafely(formDataRef.value, translate('validation.profileForm.formName'))
        if (!valid) return

        const submitData: Record<string, unknown> = {
            id: formData.id,
            nickname: formData.nickname,
        }

        if (formData.phone_number) submitData.phone_number = formData.phone_number
        if (formData.email) submitData.email = formData.email
        if (formData.avatar) submitData.avatar = formData.avatar
        if (formData.password) submitData.password = formData.password

        // 提交锁只包裹真正的写请求，避免成功后还把刷新/延时算进"提交中"，导致按钮卡几秒。
        const succeeded = await runWithSubmitLock(async () => {
            await modifyProfile(submitData)
            return true
        }, 0).catch((error) => {
            Logger.error('修改失败:', error)
            return false
        })

        if (!succeeded) return

        ElMessage.success(translate('common.result.updateSuccess'))
        showDrawer.value = false
        // 写成功后刷新展示信息（单次 admin-user/get），不阻塞提交按钮。
        await getProfile()
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
        openEditDrawer,
        editConfirmSubmit,
    }
}
