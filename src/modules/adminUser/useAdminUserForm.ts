import { computed, reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { createAdminUserItem, updateAdminUserItem, uploadAvatarFile, fetchAdminUserDetail } from '@/modules/adminUser/service'
import { ADMIN_USER_AVATAR_CONFIG, ADMIN_USER_STATUS, ADMIN_USER_SUBMIT_DELAY, createAdminUserForm, isRootAdminUser } from '@/modules/adminUser/model'
import type { AdminUser } from '@/types/adminUser'

interface UseAdminUserFormOptions {
    refreshList: () => Promise<void>
}

export function useAdminUserForm({ refreshList }: UseAdminUserFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const isSubmitting = ref(false)
    const initialFormData = createAdminUserForm()
    const formData = reactive({ ...initialFormData })
    const originalFormData = ref<Partial<AdminUser> | null>(null)
    const isEditMode = computed(() => !!originalFormData.value)
    const isRootAdminEditing = computed(() => isEditMode.value && isRootAdminUser(originalFormData.value))

    const handleAvatarSuccess = (response: { url?: string; uuid?: string }) => {
        if (response?.url) {
            formData.avatar = response.url
        } else if (response?.uuid) {
            formData.avatar = response.uuid
        }
    }

    const beforeAvatarUpload = (rawFile: File) => {
        if (!ADMIN_USER_AVATAR_CONFIG.ALLOWED_TYPES.includes(rawFile.type)) {
            ElMessage.error('头像图片必须是 JPG、PNG 或 GIF 格式！')
            return false
        }
        if (rawFile.size > ADMIN_USER_AVATAR_CONFIG.MAX_SIZE) {
            ElMessage.error('头像图片大小不能超过 2MB！')
            return false
        }
        return true
    }

    const customUpload = async ({ file, onError }: { file: File; onError?: (err: unknown) => void }) => {
        try {
            const result = await uploadAvatarFile(file, { path: ADMIN_USER_AVATAR_CONFIG.UPLOAD_PATH })
            if (result && result.url) {
                ElMessage.success('上传成功')
                handleAvatarSuccess(result)
                return result
            }
            ElMessage.error('上传失败')
            return null
        } catch (err) {
            console.error('上传失败:', err)
            onError?.(err as Error)
            return null
        }
    }

    const getDynamicRules = (id: number | string) => {
        const isEdit = !!id && id !== 0
        const trigger = ['blur', 'change']

        return {
            nickname: [{ required: true, message: '昵称不能为空', trigger }],
            username: [
                { required: true, message: '用户名不能为空', trigger },
                { min: 3, message: '用户名长度不能少于 3 个字符', trigger },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '由字母、数字和下划线组成', trigger },
            ],
            password: [!isEdit && { required: true, message: '密码不能为空', trigger }, { min: 6, max: 20, message: '密码长度 6-20 个字符', trigger }].filter(Boolean),
            confirm_password: [
                (!isEdit || formData.password) && { required: true, message: '请确认密码', trigger },
                {
                    validator: (_: unknown, value: string, callback: (error?: Error) => void) => {
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
        formDataRef.value?.clearValidate()
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
                ElMessage.error('无效的行数据')
                return
            }

            formTitle.value = '编辑管理员'
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
                console.error('获取管理员详情失败:', error)
                return
            }
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
                await updateAdminUserItem(submitData)
            } else {
                await createAdminUserItem(submitData)
            }

            await refreshList()
            showDrawer.value = false
            ElMessage.success(isEditMode.value ? '编辑成功' : '新增成功')
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            setTimeout(() => {
                isSubmitting.value = false
            }, ADMIN_USER_SUBMIT_DELAY)
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
