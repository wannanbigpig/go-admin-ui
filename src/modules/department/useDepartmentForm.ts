import { computed, nextTick, reactive, ref, watch, type Ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { createDepartmentItem, fetchDepartmentDetail, updateDepartmentItem } from '@/modules/department/service'
import { createDepartmentForm, createDepartmentRules, DEPARTMENT_EDIT_TYPE, isProtectedDepartment } from '@/modules/department/model'
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
    const { isSubmitting, runWithSubmitLock } = useSubmitLock()
    let detailRequestVersion = 0
    const detailLoading = ref(false)
    watch(showDrawer, (visible) => {
        if (!visible) {
            detailRequestVersion += 1
            detailLoading.value = false
        }
    }, { flush: 'sync' })

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
        const excludeIds = new Set(getChildrenIds(formData.id).map(String))
        return departmentOptions.value.filter((dept: Department) => !excludeIds.has(String(dept.id)))
    })

    const handleAddChild = (parentRow: Department) => {
        openEditDrawer(DEPARTMENT_EDIT_TYPE.ADD, null, null, parentRow.id)
    }

    const openEditDrawer = async (type: number, row: Department | null, index: number | null, fixedParentId: number | string | null = null) => {
        const requestVersion = ++detailRequestVersion
        detailLoading.value = true
        originalFormData.value = null
        resetFormData()
        currentIndex.value = index
        showDrawer.value = true

        if (type === DEPARTMENT_EDIT_TYPE.EDIT && row) {
            formTitle.value = translate('permission.department.editTitle')
            try {
                const deptData = await fetchDepartmentDetail(row.id)
                if (requestVersion !== detailRequestVersion) return
                Object.assign(formData, {
                    id: deptData.id,
                    name: deptData.name || '',
                    sort: deptData.sort ?? 100,
                    pid: deptData.pid ?? 0,
                    description: deptData.description || '',
                })
                saveOriginalData()
            } catch (error) {
                if (requestVersion !== detailRequestVersion) return
                Logger.error('获取部门详情失败:', error)
                showDrawer.value = false
                return
            }
        } else {
            formTitle.value = translate('permission.department.addTitle')
            originalFormData.value = null
            if (fixedParentId !== null) {
                formData.pid = fixedParentId
            }
        }

        await nextTick()
        if (requestVersion !== detailRequestVersion) return
        formDataRef.value?.setInitialValues(formData)
        formDataRef.value?.clearValidate()
        detailLoading.value = false
    }

    const editConfirmSubmit = async () => {
        if (detailLoading.value || isSubmitting.value) return
        const requestVersion = detailRequestVersion
        const wasEditing = isEditMode.value
        const valid = await validateFormSafely(formDataRef.value, translate('validation.department.formName'))
        if (!valid || requestVersion !== detailRequestVersion) return

        await runWithSubmitLock(async () => {
            const submitData = { ...formData }
            if (wasEditing) {
                await updateDepartmentItem(submitData)
            } else {
                await createDepartmentItem(submitData)
            }

            // 写成功后先关抽屉+提示，再刷新列表，避免列表刷新把提交按钮卡在"提交中"。
            if (requestVersion === detailRequestVersion) showDrawer.value = false
            ElMessage.success(wasEditing ? translate('common.result.editSuccess') : translate('common.result.addSuccess'))
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
        detailLoading,
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
