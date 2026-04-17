import { computed, reactive, ref, type Ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { createDepartmentItem, fetchDepartmentDetail, updateDepartmentItem } from '@/modules/department/service'
import { createDepartmentForm, createDepartmentRules, DEPARTMENT_EDIT_TYPE, DEPARTMENT_SUBMIT_DELAY, isProtectedDepartment } from '@/modules/department/model'
import type { Department } from '@/types/department'

interface UseDepartmentFormOptions {
    departmentOptions: Ref<any[]>
    getChildrenIds: (id: number | string) => (number | string)[]
    refreshList: () => Promise<any>
}

export function useDepartmentForm({ departmentOptions, getChildrenIds, refreshList }: UseDepartmentFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const isSubmitting = ref(false)

    const initialFormData = createDepartmentForm()
    const formData = reactive({ ...initialFormData }) as any
    const originalFormData = ref<Department | null>(null)

    const isEditMode = computed(() => !!originalFormData.value)
    const isProtectedEditingDepartment = computed(() => (isEditMode.value && originalFormData.value ? isProtectedDepartment(originalFormData.value) : false))
    const getDynamicRules = createDepartmentRules

    const resetFormData = () => {
        Object.assign(formData, { ...createDepartmentForm() })
        if (formDataRef.value) {
            formDataRef.value.clearValidate()
        }
    }

    const saveOriginalData = () => {
        originalFormData.value = JSON.parse(
            JSON.stringify({
                id: formData.id,
                name: formData.name,
                sort: formData.sort,
                pid: formData.pid,
                description: formData.description,
            })
        )
    }

    const filteredParentOptions = computed(() => {
        if (!isEditMode.value || !formData.id) {
            return departmentOptions.value
        }
        const excludeIds = getChildrenIds(formData.id)
        return departmentOptions.value.filter((dept: any) => !excludeIds.includes(dept.id))
    })

    const handleAddChild = (parentRow: Department) => {
        openEditDrawer(DEPARTMENT_EDIT_TYPE.ADD, null, null, parentRow.id)
    }

    const openEditDrawer = async (type: number, row: any, index: number | null, fixedParentId: number | string | null = null) => {
        resetFormData()
        currentIndex.value = index

        if (type === DEPARTMENT_EDIT_TYPE.EDIT && row) {
            formTitle.value = '编辑部门'
            try {
                const deptData = await fetchDepartmentDetail(row.id)
                Object.assign(formData, {
                    id: deptData.id,
                    name: deptData.name || '',
                    sort: deptData.sort ?? 100,
                    pid: deptData.pid ?? 0,
                    description: deptData.description || '',
                })
                saveOriginalData()
            } catch (error) {
                console.error('获取部门详情失败:', error)
                return
            }
        } else {
            formTitle.value = '新增部门'
            originalFormData.value = null
            if (fixedParentId !== null) {
                formData.pid = fixedParentId
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
            const submitData = { ...formData }
            if (isEditMode.value) {
                await updateDepartmentItem(submitData)
            } else {
                await createDepartmentItem(submitData)
            }

            await refreshList()
            showDrawer.value = false
            ElMessage.success(isEditMode.value ? '编辑成功' : '新增成功')
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            setTimeout(() => {
                isSubmitting.value = false
            }, DEPARTMENT_SUBMIT_DELAY)
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
        isProtectedEditingDepartment,
        getDynamicRules,
        filteredParentOptions,
        handleAddChild,
        openEditDrawer,
        editConfirmSubmit,
    }
}
