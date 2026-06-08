import { computed, reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { createAdminUserItem, updateAdminUserItem, fetchAdminUserDetail } from '@/modules/adminUser/service'
import { ADMIN_USER_STATUS, ADMIN_USER_SUBMIT_DELAY, createAdminUserForm, isRootAdminUser } from '@/modules/adminUser/model'
import { validateFormSafely } from '@/modules/shared/form'
import type { AdminUser } from '@/types/adminUser'
import { translate } from '@/locales'

interface UseAdminUserFormOptions {
    refreshList: () => Promise<void>
}

export function useAdminUserForm({ refreshList }: UseAdminUserFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const { isSubmitting, runWithSubmitLock } = useSubmitLock(ADMIN_USER_SUBMIT_DELAY)
    const initialFormData = createAdminUserForm()
    const formData = reactive({ ...initialFormData })
    const originalFormData = ref<Partial<AdminUser> | null>(null)
    const isEditMode = computed(() => !!originalFormData.value)
    const isRootAdminEditing = computed(() => isEditMode.value && isRootAdminUser(originalFormData.value))

    const getDynamicRules = (id: number | string) => {
        const isEdit = !!id && id !== 0
        const trigger = ['blur', 'change']

        return {
            nickname: [{ required: true, message: translate('validation.adminUser.nicknameRequired'), trigger }],
            username: [
                { required: true, message: translate('validation.adminUser.usernameRequired'), trigger },
                { min: 3, max: 20, message: translate('validation.adminUser.usernameLength'), trigger },
                { pattern: /^[a-zA-Z0-9_]+$/, message: translate('validation.adminUser.usernamePattern'), trigger },
            ],
            password: [!isEdit && { required: true, message: translate('validation.adminUser.passwordRequired'), trigger }, { min: 6, max: 20, message: translate('validation.adminUser.passwordLength'), trigger }].filter(
                Boolean
            ),
            confirm_password: [
                (!isEdit || formData.password) && { required: true, message: translate('validation.adminUser.confirmPasswordRequired'), trigger },
                {
                    validator: (_: unknown, value: string, callback: (error?: Error) => void) => {
                        if (formData.password && value !== formData.password) {
                            callback(new Error(translate('validation.adminUser.passwordNotMatch')))
                        } else {
                            callback()
                        }
                    },
                    trigger,
                },
            ].filter(Boolean),
        }
    }

    const isArrayEqual = (arr1: unknown[], arr2: unknown[]) => {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false
        if (arr1.length !== arr2.length) return false
        const sorted1 = [...arr1].sort()
        const sorted2 = [...arr2].sort()
        return sorted1.every((val, index) => val === sorted2[index])
    }

    const isEmptyValue = (value: unknown) => {
        if (value == null) return true
        if (typeof value === 'string' && !value.trim()) return true
        if (Array.isArray(value) && !value.length) return true
        return false
    }

    const getAddSubmitData = () => {
        const submitData: Record<string, unknown> = {
            nickname: formData.nickname,
            username: formData.username,
            status: formData.status ?? ADMIN_USER_STATUS.NORMAL,
        }

        ;['phone_number', 'email', 'avatar', 'dept_ids', 'password'].forEach((field) => {
            if (!isEmptyValue(formData[field as keyof typeof formData])) {
                submitData[field] = formData[field as keyof typeof formData]
            }
        })

        return submitData
    }

    const getEditSubmitData = () => {
        const submitData: Record<string, unknown> = { id: formData.id }
        const original = originalFormData.value

        ;['nickname', 'username', 'status', 'phone_number', 'email', 'avatar'].forEach((field) => {
            if (formData[field as keyof typeof formData] !== original?.[field as keyof typeof formData]) {
                submitData[field] = formData[field as keyof typeof formData]
            }
        })

        if (isRootAdminEditing.value && submitData.status !== undefined) {
            delete submitData.status
        }

        if (!isArrayEqual(formData.dept_ids || [], (originalFormData.value?.dept_ids as number[] | undefined) || [])) {
            submitData.dept_ids = formData.dept_ids || []
        }

        if (!isEmptyValue(formData.password)) {
            submitData.password = formData.password
        }

        return submitData
    }

    const getSubmitData = () => (isEditMode.value ? getEditSubmitData() : getAddSubmitData())

    const resetFormData = () => {
        Object.assign(formData, { ...initialFormData })
    }

    const extractDeptIds = (
        row: Partial<AdminUser> & {
            departments?: Array<{ id: string | number }>
            dept_ids?: number[]
            department_ids?: number[]
            department_id?: number | number[]
        }
    ) => {
        if (row.departments?.length) {
            return row.departments.map((dept) => Number(dept.id)).filter((id) => !isNaN(id))
        }
        if (row.dept_ids) {
            return Array.isArray(row.dept_ids) ? row.dept_ids : []
        }
        if (row.department_ids) {
            return Array.isArray(row.department_ids) ? row.department_ids : []
        }
        if (row.department_id != null) {
            return Array.isArray(row.department_id) ? row.department_id : [row.department_id]
        }
        return []
    }

    const saveOriginalData = () => {
        originalFormData.value = JSON.parse(
            JSON.stringify({
                id: formData.id,
                nickname: formData.nickname,
                username: formData.username,
                status: formData.status,
                phone_number: formData.phone_number,
                email: formData.email,
                avatar: formData.avatar,
                dept_ids: [...(formData.dept_ids || [])],
            })
        )
    }

    const openEditDrawer = async (type: number, row?: Partial<AdminUser> & Record<string, unknown>, index?: number) => {
        resetFormData()
        currentIndex.value = index ?? null

        if (type === 2) {
            if (!row || (typeof row.id !== 'number' && typeof row.id !== 'string')) {
                ElMessage.error(translate('validation.adminUser.invalidRow'))
                return
            }

            formTitle.value = translate('permission.adminUser.editTitle')
            try {
                const userData = await fetchAdminUserDetail(row.id)
                const mergedUserData = { ...row, ...userData }

                Object.assign(formData, {
                    id: mergedUserData.id,
                    nickname: mergedUserData.nickname || '',
                    username: mergedUserData.username || '',
                    status: mergedUserData.status ?? ADMIN_USER_STATUS.NORMAL,
                    phone_number: mergedUserData.phone_number || '',
                    email: mergedUserData.email || '',
                    avatar: mergedUserData.avatar || '',
                    dept_ids: extractDeptIds(mergedUserData),
                })
                saveOriginalData()
            } catch (error) {
                Logger.error('获取管理员详情失败:', error)
                return
            }
        } else {
            formTitle.value = translate('permission.adminUser.addTitle')
            originalFormData.value = null
        }

        showDrawer.value = true

        setTimeout(() => {
            formDataRef.value?.clearValidate()
        }, 50)
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return
        const valid = await validateFormSafely(formDataRef.value, translate('permission.adminUser.title'))
        if (!valid) return

        await runWithSubmitLock(async () => {
            const submitData = getSubmitData()
            if (isEditMode.value) {
                await updateAdminUserItem(submitData)
            } else {
                await createAdminUserItem(submitData)
            }

            // 写成功后先关抽屉+提示，再刷新列表，避免列表刷新把提交按钮卡在"提交中"。
            showDrawer.value = false
            ElMessage.success(isEditMode.value ? translate('common.result.editSuccess') : translate('common.result.addSuccess'))
            await refreshList()
        }).catch((error) => {
            Logger.error('提交失败:', error)
        })
    }

    return {
        showDrawer,
        formDataRef,
        formTitle,
        currentIndex,
        isSubmitting,
        formData,
        isEditMode,
        isRootAdminEditing,
        getDynamicRules,
        openEditDrawer,
        editConfirmSubmit,
    }
}
