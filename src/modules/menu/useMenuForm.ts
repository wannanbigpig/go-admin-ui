import { computed, reactive, ref } from 'vue'
import { ElMessage, ElLoading, type FormInstance } from 'element-plus'
import { createMenu, getMenuDetail, updateMenu, deleteMenu as removeMenuApi } from '@/api/permission'
import { createMenuForm, MENU_OPERATION_TYPE, MENU_SUBMIT_DEBOUNCE_TIME } from '@/modules/menu/model'
import type { Menu } from '@/types/menu'

interface UseMenuFormOptions {
    getList: () => Promise<any>
}

export function useMenuForm({ getList }: UseMenuFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const isSubmitting = ref(false)

    const initialFormData = createMenuForm()
    const formData = reactive({ ...initialFormData }) as any
    const originalFormData = ref<Menu | null>(null)

    const isEditMode = computed(() => !!originalFormData.value)

    const resetFormData = () => {
        Object.assign(formData, { ...createMenuForm() })
        formDataRef.value?.clearValidate()
    }

    const openEditDrawer = async (type: number, row?: Menu, index?: number, fixedParentId: number | string | null = null) => {
        resetFormData()
        currentIndex.value = index ?? null

        if (type === MENU_OPERATION_TYPE.EDIT && row) {
            formTitle.value = '编辑菜单'
            const loading = ElLoading.service({ fullscreen: true })
            try {
                const response = await getMenuDetail({ id: row.id })
                const menuDetail = response.data
                Object.assign(formData, menuDetail)
                originalFormData.value = JSON.parse(JSON.stringify(formData))
            } catch (error) {
                console.error('获取详情失败:', error)
            } finally {
                loading.close()
            }
        } else {
            formTitle.value = '新增菜单'
            originalFormData.value = null
            if (fixedParentId !== null) {
                formData.parent_id = fixedParentId
            }
        }

        showDrawer.value = true
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return

        const valid = await formDataRef.value?.validate().catch(() => false)
        if (!valid) return

        isSubmitting.value = true
        try {
            if (isEditMode.value) {
                await updateMenu(formData)
            } else {
                await createMenu(formData)
            }

            await getList()
            showDrawer.value = false
            ElMessage.success(isEditMode.value ? '编辑成功' : '新增成功')
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            setTimeout(() => {
                isSubmitting.value = false
            }, MENU_SUBMIT_DEBOUNCE_TIME)
        }
    }

    const handleDelete = async (row: Menu) => {
        try {
            await removeMenuApi({ id: row.id })
            ElMessage.success('删除成功')
            getList()
        } catch (error) {
            console.error('删除失败:', error)
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
        openEditDrawer,
        editConfirmSubmit,
        handleDelete,
    }
}
