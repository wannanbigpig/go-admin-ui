import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createDepartmentItem, fetchDepartmentDetail, updateDepartmentItem } from '@/modules/department/service'
import { createDepartmentForm, createDepartmentRules, DEPARTMENT_EDIT_TYPE, DEPARTMENT_SUBMIT_DELAY, isProtectedDepartment } from '@/modules/department/model'

export function useDepartmentForm({ departmentOptions, getChildrenIds, refreshList }) {
    const showDrawer = ref(false)
    const formDataRef = ref()
    const formTitle = ref('')
    const currentIndex = ref(null)
    const isSubmitting = ref(false)
    const isParentFixed = ref(false)
    const initialFormData = createDepartmentForm()
    const formData = reactive({ ...initialFormData })
    const originalFormData = ref(null)
    const isEditMode = computed(() => !!originalFormData.value)
    const isProtectedEditingDepartment = computed(() => isEditMode.value && isProtectedDepartment(originalFormData.value))
    const getDynamicRules = createDepartmentRules

    const getSubmitData = () => ({
        id: formData.id || 0,
        name: formData.name,
        sort: formData.sort,
        pid: formData.pid ?? 0,
        description: formData.description || '',
    })

    const resetFormData = () => {
        Object.assign(formData, { ...initialFormData })
        isParentFixed.value = false
        formDataRef.value?.clearValidate()
    }

    const saveOriginalData = () => {
        originalFormData.value = JSON.parse(
            JSON.stringify({
                id: formData.id,
                name: formData.name,
                sort: formData.sort,
                pid: formData.pid,
                description: formData.description,
                code: formData.code,
                is_system: formData.is_system,
            })
        )
    }

    const filteredDepartmentOptions = computed(() => {
        if (!isEditMode.value || !formData.id) return departmentOptions.value
        const excludeIds = getChildrenIds(formData.id)
        return departmentOptions.value.filter((dept) => !excludeIds.includes(dept.id))
    })

    const handleAddChild = (parentRow) => {
        if (!parentRow || typeof parentRow.id !== 'number') {
            ElMessage.error('无效的行数据')
            return
        }
        openEditDrawer(DEPARTMENT_EDIT_TYPE.ADD, null, 0, parentRow.id)
    }

    const openEditDrawer = async (type, row, index, fixedParentId = null) => {
        if (typeof type !== 'number' || ![DEPARTMENT_EDIT_TYPE.ADD, DEPARTMENT_EDIT_TYPE.EDIT].includes(type)) {
            return
        }

        if (type === DEPARTMENT_EDIT_TYPE.EDIT) {
            if (!row || typeof row.id !== 'number') {
                ElMessage.error('无效的行数据')
                return
            }

            formTitle.value = '编辑部门'
            currentIndex.value = index
            resetFormData()
            try {
                const departmentDetail = await fetchDepartmentDetail(row.id)
                Object.assign(formData, {
                    id: departmentDetail.id,
                    name: departmentDetail.name || '',
                    sort: departmentDetail.sort ?? 100,
                    pid: departmentDetail.pid ?? 0,
                    description: departmentDetail.description || '',
                    code: departmentDetail.code,
                    is_system: departmentDetail.is_system,
                })
                saveOriginalData()
                isParentFixed.value = isProtectedDepartment(departmentDetail)
            } catch (error) {
                console.error('获取部门详情失败:', error)
                ElMessage.error('获取部门详情失败')
                return
            }
        } else {
            formTitle.value = '新增部门'
            resetFormData()
            originalFormData.value = null
            if (fixedParentId !== null) {
                formData.pid = fixedParentId
                isParentFixed.value = true
            }
        }

        currentIndex.value = index
        showDrawer.value = true
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return
        isSubmitting.value = true

        try {
            const valid = await formDataRef.value.validate().catch(() => false)
            if (!valid) {
                isSubmitting.value = false
                return
            }

            const submitData = getSubmitData()
            if (isEditMode.value) {
                if (isProtectedEditingDepartment.value) {
                    submitData.pid = originalFormData.value?.pid ?? submitData.pid
                    submitData.sort = originalFormData.value?.sort ?? submitData.sort
                }
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
        isParentFixed,
        isProtectedEditingDepartment,
        formData,
        getDynamicRules,
        filteredDepartmentOptions,
        openEditDrawer,
        handleAddChild,
        editConfirmSubmit,
    }
}
