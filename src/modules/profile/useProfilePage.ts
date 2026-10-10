import { onMounted, onBeforeUnmount, reactive, ref, computed } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { useAuthStore } from '@/stores/auth'
import { createEmptyUserInfo } from '@/modules/auth/model'
import { fetchProfile, fetchProfileSecurityOptions, modifyProfile, requestProfileCode, submitPhoneChange } from '@/modules/profile/service'
import { createProfileForm } from '@/modules/profile/model'
import { validateFormSafely } from '@/modules/shared/form'
import type { UpdateProfilePayload, UserInfo } from '@/types/auth'
import { translate } from '@/locales'
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@/modules/auth/validation'
import router from '@/router'

export function useProfilePage() {
    const authStore = useAuthStore()
    const sessionVersion = authStore.sessionVersion
    let disposed = false
    const isCurrentSession = () => !disposed && sessionVersion === authStore.sessionVersion
    onBeforeUnmount(() => {
        disposed = true
    })
    const userInfo = ref<UserInfo>({ ...createEmptyUserInfo(), ...authStore.userInfo })
    const loading = ref(false)
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref(translate('profile.editProfile'))
    const { isSubmitting, runWithSubmitLock } = useSubmitLock(0)
    const formKey = ref(0)
    const formData = reactive(createProfileForm())
    const savedFormSignature = ref('')
    const hasUnsavedChanges = computed(() => savedFormSignature.value !== '' && JSON.stringify(formData) !== savedFormSignature.value)
    let confirmingClose = false
    const smsVerificationRequired = ref<boolean | null>(null)
    const codeSending = ref(false)
    const showPhoneDrawer = ref(false)
    const phoneDataRef = ref<FormInstance>()
    const phoneSaving = ref(false)
    const phoneCodeSending = ref(false)
    const phoneData = reactive({ country_code: '86', phone_number: '', current_password: '', sms_code: '', sms_challenge_id: '' })

    /** 仅勾选「修改密码」时展示并提交密码字段。 */
    const showPasswordFields = computed(() => formData.change_password)
    const showCurrentPassword = computed(() => formData.change_password)
    const needsCurrentPassword = showCurrentPassword

    const formRules = {
        current_password: [
            {
                validator: (_: unknown, value: string, callback: (error?: Error) => void) => {
                    // 仅改密码时需要当前密码；昵称/邮箱/头像不需要。
                    if (!formData.change_password) {
                        callback()
                        return
                    }
                    if (!value) {
                        callback(new Error(translate('validation.profile.currentPasswordRequired')))
                        return
                    }
                    if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) {
                        callback(new Error(translate('validation.adminUser.passwordLength')))
                        return
                    }
                    callback()
                },
                trigger: ['blur', 'change'],
            },
        ],
        password: [
            {
                validator: (_: unknown, value: string, callback: (error?: Error) => void) => {
                    if (!formData.change_password) {
                        callback()
                        return
                    }
                    if (!value) {
                        callback(new Error(translate('validation.profile.newPasswordRequired')))
                        return
                    }
                    if (value.length < PASSWORD_MIN_LENGTH || value.length > PASSWORD_MAX_LENGTH) {
                        callback(new Error(translate('validation.adminUser.passwordLength')))
                        return
                    }
                    callback()
                },
                trigger: ['blur', 'change'],
            },
        ],
        confirm_password: [
            {
                validator: (_: unknown, value: string, callback: (error?: Error) => void) => {
                    if (!formData.change_password) {
                        callback()
                        return
                    }
                    if (!formData.password) {
                        callback()
                        return
                    }
                    if (value !== formData.password) {
                        callback(new Error(translate(value ? 'validation.adminUser.passwordNotMatch' : 'validation.adminUser.confirmPasswordRequired')))
                        return
                    }
                    callback()
                },
                trigger: ['blur', 'change'],
            },
        ],
        nickname: [
            { required: true, message: translate('validation.profile.nicknameRequired'), trigger: 'blur' },
            { min: 2, max: 20, message: translate('validation.profile.nicknameLength'), trigger: 'blur' },
        ],
        email: [
            {
                type: 'email',
                message: translate('validation.profile.emailInvalid'),
                trigger: ['blur', 'change'],
            },
        ],
    }

    const resetPasswordFields = () => {
        formData.current_password = ''
        formData.password = ''
        formData.confirm_password = ''
        formData.sms_code = ''
        formData.sms_challenge_id = ''
    }

    const toggleChangePassword = (checked: boolean) => {
        if (!checked) {
            resetPasswordFields()
        }
        // 字段显隐变化后清掉旧的校验红字
        void formDataRef.value?.clearValidate(['current_password', 'password', 'confirm_password'])
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
        if (!isCurrentSession()) return
        loading.value = true
        try {
            const data = await fetchProfile()
            if (!isCurrentSession()) return
            userInfo.value = data
            // 直接用本次结果同步 Store，避免重复请求 admin-user/get 与无谓的菜单刷新（资料修改不影响菜单/权限）。
            authStore.userInfo = data
        } catch (error) {
            Logger.error('获取个人信息失败:', error)
        } finally {
            loading.value = false
        }
    }

    const loadSecurityOptions = async (): Promise<boolean | null> => {
        try {
            const options = await fetchProfileSecurityOptions()
            if (!isCurrentSession()) return null
            smsVerificationRequired.value = options.sms_verification_required
            return options.sms_verification_required
        } catch (error) {
            smsVerificationRequired.value = null
            Logger.error('获取个人资料安全选项失败:', error)
            return null
        }
    }

    const openEditDrawer = () => {
        formTitle.value = translate('profile.editProfileInfo')
        formData.id = userInfo.value.id
        formData.nickname = userInfo.value.nickname
        formData.username = userInfo.value.username
        formData.email = typeof userInfo.value.email === 'string' ? userInfo.value.email : ''
        formData.avatar = userInfo.value.avatar || ''
        formData.change_password = false
        resetPasswordFields()
        savedFormSignature.value = JSON.stringify(formData)

        showDrawer.value = true
        formKey.value++
        if (smsVerificationRequired.value === null) void loadSecurityOptions()
    }

    const confirmProfileClose = async (done: () => void) => {
        if (isSubmitting.value || confirmingClose || !isCurrentSession()) return
        if (!hasUnsavedChanges.value) {
            done()
            return
        }
        const currentFormKey = formKey.value
        confirmingClose = true
        try {
            await ElMessageBox.confirm(translate('profile.discardChangesConfirm'), translate('profile.editProfile'), {
                type: 'warning',
                confirmButtonText: translate('common.actions.confirm'),
                cancelButtonText: translate('common.actions.cancel'),
                distinguishCancelAndClose: true,
            })
            if (currentFormKey === formKey.value && isCurrentSession() && !isSubmitting.value) done()
        } catch (error) {
            if (error !== 'cancel' && error !== 'close') Logger.warn('个人资料关闭确认失败:', error)
        } finally {
            confirmingClose = false
        }
    }

    const sendPasswordCode = async () => {
        if (codeSending.value || !isCurrentSession()) return
        const required = await loadSecurityOptions()
        if (required !== true) return
        codeSending.value = true
        try {
            const result = await requestProfileCode({ purpose: 'password' })
            if (!isCurrentSession()) return
            formData.sms_challenge_id = result.challenge_id
            formData.sms_code = ''
            ElMessage.success(translate('profile.codeSent'))
        } catch (error) {
            Logger.error('发送改密验证码失败:', error)
        } finally {
            codeSending.value = false
        }
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value || !isCurrentSession()) return
        const valid = await validateFormSafely(formDataRef.value, translate('validation.profileForm.formName'))
        if (!valid || !isCurrentSession()) return

        if (formData.change_password) {
            const required = await loadSecurityOptions()
            if (required === null) return
            if (required && (!formData.sms_challenge_id || !formData.sms_code)) {
                ElMessage.error(translate('profile.codeRequired'))
                return
            }
        }

        const submitData: UpdateProfilePayload = {
            nickname: formData.nickname,
            email: formData.email,
        }

        if (formData.avatar) submitData.avatar = formData.avatar

        // 仅勾选修改密码时提交密码及可能需要的短信验证。
        if (formData.change_password && formData.password) {
            submitData.current_password = formData.current_password
            submitData.password = formData.password
            if (smsVerificationRequired.value) {
                submitData.sms_challenge_id = formData.sms_challenge_id
                submitData.sms_code = formData.sms_code
            }
        }

        // 提交锁只包裹真正的写请求，避免成功后还把刷新/延时算进"提交中"，导致按钮卡几秒。
        const succeeded = await runWithSubmitLock(async () => {
            await modifyProfile(submitData)
            return true
        }, 0).catch((error) => {
            Logger.error('修改失败:', error)
            return false
        })

        if (!succeeded || !isCurrentSession()) return

        ElMessage.success(translate('common.result.updateSuccess'))
        showDrawer.value = false
        if (submitData.password) {
            authStore.resetAuthStore()
            await router.replace({ name: 'Login' })
            return
        }
        // 写成功后刷新展示信息（单次 admin-user/get），不阻塞提交按钮。
        await getProfile()
    }

    const openPhoneDrawer = async () => {
        if ((await loadSecurityOptions()) === null || !isCurrentSession()) return
        Object.assign(phoneData, { country_code: '86', phone_number: '', current_password: '', sms_code: '', sms_challenge_id: '' })
        showPhoneDrawer.value = true
    }

    const sendPhoneCode = async () => {
        if (phoneCodeSending.value || smsVerificationRequired.value !== true || !isCurrentSession()) return
        if (!/^1[3-9]\d{9}$/.test(phoneData.phone_number) || !phoneData.current_password) {
            ElMessage.error(translate('profile.phoneAndPasswordRequired'))
            return
        }
        phoneCodeSending.value = true
        try {
            const result = await requestProfileCode({
                purpose: 'phone', country_code: phoneData.country_code,
                phone_number: phoneData.phone_number, current_password: phoneData.current_password,
            })
            if (!isCurrentSession()) return
            phoneData.sms_challenge_id = result.challenge_id
            phoneData.sms_code = ''
            ElMessage.success(translate('profile.codeSent'))
        } catch (error) {
            Logger.error('发送新手机号验证码失败:', error)
        } finally {
            phoneCodeSending.value = false
        }
    }

    const changePhoneConfirm = async () => {
        if (phoneSaving.value || !isCurrentSession()) return
        const valid = await validateFormSafely(phoneDataRef.value, translate('profile.changePhone'))
        if (!valid || !isCurrentSession()) return
        const required = await loadSecurityOptions()
        if (required === null) return
        if (required && (!phoneData.sms_challenge_id || !phoneData.sms_code)) {
            ElMessage.error(translate('profile.codeRequired'))
            return
        }
        phoneSaving.value = true
        try {
            await submitPhoneChange({
                country_code: phoneData.country_code, phone_number: phoneData.phone_number,
                current_password: phoneData.current_password,
                ...(required ? { sms_challenge_id: phoneData.sms_challenge_id, sms_code: phoneData.sms_code } : {}),
            })
            if (!isCurrentSession()) return
            ElMessage.success(translate('profile.phoneChangedRelogin'))
            showPhoneDrawer.value = false
            authStore.resetAuthStore()
            await router.replace({ name: 'Login' })
        } catch (error) {
            Logger.error('换绑手机号失败:', error)
        } finally {
            phoneSaving.value = false
        }
    }

    const phoneRules = {
        phone_number: [{ required: true, pattern: /^1[3-9]\d{9}$/, message: translate('validation.profile.phoneInvalid'), trigger: 'blur' }],
        current_password: [{ required: true, message: translate('profile.currentPasswordPlaceholder'), trigger: 'blur' }],
    }

    onMounted(() => {
        getProfile()
        void loadSecurityOptions()
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
        smsVerificationRequired,
        codeSending,
        sendPasswordCode,
        showPhoneDrawer,
        phoneDataRef,
        phoneData,
        phoneRules,
        phoneSaving,
        phoneCodeSending,
        openPhoneDrawer,
        sendPhoneCode,
        changePhoneConfirm,
        showPasswordFields,
        showCurrentPassword,
        needsCurrentPassword,
        formatDepartments,
        formatDateTime,
        openEditDrawer,
        editConfirmSubmit,
        confirmProfileClose,
        toggleChangePassword,
    }
}
