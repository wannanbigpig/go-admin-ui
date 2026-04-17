import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { addAdminUser, modifyAdminUser, uploadUserAvatar } from '@/modules/adminUser/service'
import { ADMIN_USER_STATUS, createAdminUserDefault } from '@/modules/adminUser/model'
import type { AdminUser } from '@/types/adminUser'

interface UseAdminUserFormOptions {
    refreshList: () => Promise<any>
}

export function useAdminUserForm({ refreshList }: UseAdminUserFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const isSubmitting = ref(false)
    const initialFormData = createAdminUserDefault()
    const formData = reactive({ ...initialFormData }) as any
    const originalFormData = ref<AdminUser | null>(null)
    const isEditMode = computed(() => !!originalFormData.value)

    // 假设 ID 1 是 Root Admin
    const isRootAdminUser = (user: AdminUser | null) => user?.id === 1
    const isRootAdminEditing = computed(() => isEditMode.value && isRootAdminUser(originalFormData.value))

    const handleAvatarSuccess = (url: string) => {
        if (url) {
            formData.avatar = url
        }
    }

    const beforeAvatarUpload = (rawFile: File) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
        if (!allowedTypes.includes(rawFile.type)) {
            ElMessage.error('头像图片必须是 JPG、PNG 或 GIF 格式！')
            return false
        }
        if (rawFile.size > 2 * 1024 * 1024) {
            ElMessage.error('头像图片大小不能超过 2MB！')
            return false
        }
        return true
    }

    const customUpload = async (options: { file: File }) => {
        try {
            const result = await uploadUserAvatar(options.file)
            if (result.url) {
                ElMessage.success('上传成功')
                handleAvatarSuccess(result.url)
                return result
            }
            return null
        } catch (err) {
            console.error('上传失败:', err)
            return null
        }
    }

    const getDynamicRules = (id: string | number) => {
        const isEdit = !!id && id !== 0 && id !== ''
        const trigger = ['blur', 'change']

        return {
            nickname: [{ required: true, message: '昵称不能为空', trigger }],
            username: [
                { required: true, message: '用户名不能为空', trigger },
                { min: 3, message: '用户名长度不能少于3个字符', trigger },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '由字母、数字和下划线组成', trigger },
            ],
            password: [!isEdit && { required: true, message: '密码不能为空', trigger }, { min: 6, max: 20, message: '密码长度6-20个字符', trigger }].filter(Boolean),
            confirm_password: [
                (!isEdit || formData.password) && { required: true, message: '请确认密码', trigger },
                {
                    validator: (_: any, value: string, callback: (error?: Error) => void) => {
                        if (formData.password && value !== formData.password) {
                            callback(new Error('两次输入密码不一致'))
                        } else {
                            callback()
                        }
                    },
                    trigger,
                },
            ].filter(Boolean),
        }
    }

    const isArrayEqual = (arr1: any[], arr2: any[]) => {
        if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false
        if (arr1.length !== arr2.length) return false
        const sorted1 = [...arr1].sort()
        const sorted2 = [...arr2].sort()
        return sorted1.every((val, index) => val === sorted2[index])
    }

    const isEmptyValue = (value: any) => {
        if (value == null) return true
        if (typeof value === 'string' && !value.trim()) return true
        if (Array.isArray(value) && !value.length) return true
        return false
    }

    const getSubmitData = () => {
        if (isEditMode.value) {
            const submitData = { id: formData.id } as any
            const original = originalFormData.value as any
            ;['nickname', 'username', 'status', 'avatar', 'mobile', 'email'].forEach((field) => {
                if (formData[field] !== original[field]) {
                    submitData[field] = formData[field]
                }
            })

            if (isRootAdminEditing.value && submitData.status !== undefined) {
                delete submitData.status
            }

            if (!isArrayEqual(formData.role_ids || [], original.role_ids || [])) {
                submitData.role_ids = formData.role_ids || []
            }

            if (!isEmptyValue(formData.password)) {
                submitData.password = formData.password
            }

            return submitData
        } else {
            const submitData = {
                nickname: formData.nickname,
                username: formData.username,
                status: formData.status ?? ADMIN_USER_STATUS.ENABLED,
            } as any

            ;['mobile', 'email', 'avatar', 'role_ids', 'password', 'dept_id'].forEach((field) => {
                if (!isEmptyValue(formData[field])) {
                    submitData[field] = formData[field]
                }
            })

            return submitData
        }
    }

    const resetFormData = () => {
        Object.assign(formData, { ...createAdminUserDefault() })
        formDataRef.value?.clearValidate()
    }

    const openEditDrawer = (type: number, row?: AdminUser, index?: number) => {
        resetFormData()
        currentIndex.value = index ?? null

        if (type === 2 && row) {
            formTitle.value = '编辑管理员'
            Object.assign(formData, {
                id: row.id,
                nickname: row.nickname || '',
                username: row.username || '',
                status: row.status ?? ADMIN_USER_STATUS.ENABLED,
                mobile: row.mobile || '',
                email: row.email || '',
                avatar: row.avatar || '',
                role_ids: row.role_ids ? [...row.role_ids] : [],
                dept_id: row.dept_id,
            })
            originalFormData.value = JSON.parse(JSON.stringify(formData))
        } else {
            formTitle.value = '新增管理员'
            originalFormData.value = null
        }

        showDrawer.value = true
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

            const submitData = getSubmitData()
            if (isEditMode.value) {
                await modifyAdminUser(submitData)
            } else {
                await addAdminUser(submitData)
            }

            await refreshList()
            showDrawer.value = false
            ElMessage.success(isEditMode.value ? '编辑成功' : '新增成功')
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            isSubmitting.value = false
        }
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
        beforeAvatarUpload,
        handleAvatarSuccess,
        customUpload,
        openEditDrawer,
        editConfirmSubmit,
    }
}
