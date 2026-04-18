import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { editPermission } from '@/api/permission'
import { createApiPermissionForm, type ApiPermission } from '@/modules/apiPermission/model'

interface UseApiPermissionFormOptions {
    refreshList: () => Promise<void>
}

export function useApiPermissionForm({ refreshList }: UseApiPermissionFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const isSubmitting = ref(false)
    const sortNumericValue = ref<number | undefined>(undefined)

    const formData = reactive(createApiPermissionForm()) as ApiPermission

    const editFormRules = {
        name: [
            { required: true, message: '接口名称不能为空', trigger: 'blur' },
            { min: 1, max: 60, message: '名称不超过 60 个字符', trigger: 'blur' },
        ],
        is_auth: [
            { required: true, message: '是否鉴权必填', trigger: 'change' },
            { type: 'enum', enum: [0, 1], message: '选择的值只能是或否', trigger: 'change' },
        ],
        sort: [{ trigger: 'blur', type: 'number', message: '请输入整数类型' }],
    }

    const resetFormData = () => {
        Object.assign(formData, createApiPermissionForm())
        formDataRef.value?.clearValidate()
    }

    const handleSortNumberChange = (value: string | number) => {
        if (value === '') {
            formData.sort = 0
            return
        }
        sortNumericValue.value = Number(value)
    }

    const setSortNumericValue = (value: number) => {
        sortNumericValue.value = value
    }

    const openEditDrawer = (type: number, row?: ApiPermission, index?: number) => {
        resetFormData()
        currentIndex.value = index ?? null

        if (type === 2 && row) {
            formTitle.value = '编辑接口权限'
            // 使用对象合并方式填充表单数据
            Object.assign(formData, {
                id: row.id,
                code: row.code || '',
                name: row.name || '',
                route: row.route || '',
                method: row.method || 'GET',
                is_auth: row.is_auth ?? 1,
                is_effective: row.is_effective ?? 1,
                sort: row.sort ?? 0,
                func_path: row.func_path || '',
                description: row.description || '',
            })
            sortNumericValue.value = formData.sort
        } else {
            formTitle.value = '新增接口权限'
        }

        showDrawer.value = true
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return

        const valid = await formDataRef.value?.validate().catch(() => false)
        if (!valid) return

        isSubmitting.value = true
        try {
            await editPermission(formData)
            await refreshList()
            showDrawer.value = false
            ElMessage.success('操作成功')
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            isSubmitting.value = false
        }
    }

    return {
        showDrawer,
        currentRowRef: formDataRef,
        formTitle,
        currentIndex,
        isSubmitting,
        currentRow: formData,
        sortNumericValue,
        setSortNumericValue,
        editFormRules,
        handleSortNumberChange,
        openEditDrawer,
        editConfirmSubmit,
    }
}
