import { reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { createProduct, getProductDetail, updateProduct, type Product, type ProductPayload } from '@/api/product'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { translate } from '@/locales'
import { Logger } from '@/utils/logger'

interface UseProductFormOptions {
    getDefaultDepartmentId: () => number
    refreshList: () => Promise<void>
}

const createEmptyProductForm = (): ProductPayload & { id: number } => ({
    id: 0,
    name: '',
    description: '',
    price: 0,
    status: 1,
    dept_id: 0,
})

export function useProductForm({ getDefaultDepartmentId, refreshList }: UseProductFormOptions) {
    const showDrawer = ref(false)
    const isEditMode = ref(false)
    const formDataRef = ref<FormInstance>()
    const formData = reactive(createEmptyProductForm())
    const { isSubmitting, runWithSubmitLock } = useSubmitLock()
    let detailRequestVersion = 0

    const resetForm = () => {
        Object.assign(formData, createEmptyProductForm())
        formDataRef.value?.clearValidate()
    }

    const openCreateDrawer = () => {
        detailRequestVersion += 1
        isEditMode.value = false
        resetForm()
        formData.dept_id = getDefaultDepartmentId()
        showDrawer.value = true
    }

    const openEditDrawer = async (row: Product) => {
        const requestVersion = ++detailRequestVersion
        showDrawer.value = false
        isEditMode.value = false
        resetForm()

        try {
            const detail = await getProductDetail({ id: row.id })
            if (requestVersion !== detailRequestVersion) return

            Object.assign(formData, {
                id: detail.id,
                name: detail.name || '',
                description: detail.description || '',
                price: detail.price ?? 0,
                status: detail.status ?? 1,
                dept_id: detail.dept_id ?? 0,
            })
            isEditMode.value = true
            showDrawer.value = true
        } catch (error) {
            Logger.error('获取产品详情失败:', error)
        }
    }

    const handleSubmit = async () => {
        await runWithSubmitLock(async () => {
            const valid = await formDataRef.value?.validate().catch(() => false)
            if (!valid) return

            const data: ProductPayload = {
                name: formData.name,
                description: formData.description,
                price: formData.price,
                status: formData.status,
                dept_id: formData.dept_id,
            }

            if (isEditMode.value) {
                await updateProduct({ id: formData.id, ...data })
                ElMessage.success(translate('product.updateSuccess'))
            } else {
                await createProduct(data)
                ElMessage.success(translate('product.createSuccess'))
            }
            showDrawer.value = false
            await refreshList()
        }).catch((error) => {
            Logger.error('提交失败:', error)
        })
    }

    return {
        showDrawer,
        isEditMode,
        isSubmitting,
        formDataRef,
        formData,
        openCreateDrawer,
        openEditDrawer,
        handleSubmit,
    }
}
