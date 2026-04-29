import { computed, reactive, ref, type Ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { createDepartmentItem, fetchDepartmentDetail, updateDepartmentItem } from '@/modules/department/service'
import { createDepartmentForm, createDepartmentRules, DEPARTMENT_EDIT_TYPE, DEPARTMENT_SUBMIT_DELAY, isProtectedDepartment } from '@/modules/department/model'
import { validateFormSafely } from '@/modules/shared/form'
import type { Department } from '@/types/department'
import { translate } from '@/locales'

interface UseDepartmentFormOptions {
    departmentOptions: Ref<Department[]>
    getChildrenIds: (id: number | string) => (number | string)[]
    refreshList: () => Promise<void>
}

export function useDepartmentForm({ departmentOptions, getChildrenIds, refreshList }: UseDepartmentFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const { isSubmitting, runWithSubmitLock } = useSubmitLock(DEPARTMENT_SUBMIT_DELAY)

    const initialFormData = createDepartmentForm()
    const formData = reactive({ ...initialFormData }) as Department
    const originalFormData = ref<Department | null>(null)

    const isEditMode = computed(() => !!originalFormData.value)
    const isProtectedEditingDepartment = computed(() => (isEditMode.value && originalFormData.value ? isProtectedDepartment(originalFormData.value) : false))
    const getDynamicRules = createDepartmentRules

    const resetFormData = () => {
        Object.assign(formData, { ...createDepartmentForm() })
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
        return departmentOptions.value.filter((dept: Department) => !excludeIds.includes(dept.id))
    })

    const handleAddChild = (parentRow: Department) => {
        openEditDrawer(DEPARTMENT_EDIT_TYPE.ADD, null, null, parentRow.id)
    }

    const openEditDrawer = async (type: number, row: Department | null, index: number | null, fixedParentId: number | string | null = null) => {
        resetFormData()
        currentIndex.value = index

        if (type === DEPARTMENT_EDIT_TYPE.EDIT && row) {
            formTitle.value = translate('permission.department.editTitle')
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
                Logger.error('获取部门详情失败:', error)
                return
            }
        } else {
            formTitle.value = translate('permission.department.addTitle')
            originalFormData.value = null
            if (fixedParentId !== null) {
                formData.pid = fixedParentId
            }
        }

        showDrawer.value = true

        setTimeout(() => {
            if (formDataRef.value) {
                formDataRef.value.clearValidate()
            }
        }, 50)
    }

    const editConfirmSubmit = async () => {
        const valid = await validateFormSafely(formDataRef.value, translate('validation.department.formName'))
        if (!valid) return

        await runWithSubmitLock(async () => {
            const submitData = { ...formData }
            if (isEditMode.value) {
                await updateDepartmentItem(submitData)
            } else {
                await createDepartmentItem(submitData)
            }

            await refreshList()
            showDrawer.value = false
            ElMessage.success(isEditMode.value ? translate('common.result.editSuccess') : translate('common.result.addSuccess'))
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
        isProtectedEditingDepartment,
        getDynamicRules,
        filteredParentOptions,
        handleAddChild,
        openEditDrawer,
        editConfirmSubmit,
    }
}
