import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { editPermission } from '@/api/permission'
import { createApiPermissionForm, type ApiPermission } from '@/modules/apiPermission/model'

interface UseApiPermissionFormOptions {
    refreshList: () => Promise<any>
}

export function useApiPermissionForm({ refreshList }: UseApiPermissionFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const isSubmitting = ref(false)

    const initialFormData = createApiPermissionForm()
    const formData = reactive({ ...initialFormData }) as any

    const resetFormData = () => {
        Object.assign(formData, { ...createApiPermissionForm() })
        formDataRef.value?.clearValidate()
    }

    const openEditDrawer = (type: number, row?: ApiPermission, index?: number) => {
        resetFormData()
        currentIndex.value = index ?? null

        if (type === 2 && row) {
            formTitle.value = '编辑接口权限'
            Object.assign(formData, {
                id: row.id,
                name: row.name || '',
                path: row.path || '',
                method: row.method || 'GET',
                group_name: row.group_name || '',
                description: row.description || '',
            })
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
        formDataRef,
        formTitle,
        currentIndex,
        isSubmitting,
        formData,
        openEditDrawer,
        editConfirmSubmit,
    }
}
