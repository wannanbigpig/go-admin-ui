import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { checkNumber } from '@/utils/helper'
import { updatePermissionItem } from '@/modules/permission/service'
import { API_PERMISSION_SUBMIT_DEBOUNCE_TIME, API_PERMISSION_SWITCH_VALUE, createApiPermissionEditForm } from '@/modules/apiPermission/model'

export function useApiPermissionForm(permissionList) {
    const showDrawer = ref(false)
    const currentRowRef = ref(null)
    const currentRow = ref(createApiPermissionEditForm())
    const currentIndex = ref(null)
    const isSubmitting = ref(false)

    let sortNumericValue

    const editFormRules = {
        name: [
            { required: true, message: '接口名称不能为空', trigger: 'blur' },
            { min: 1, max: 60, message: '名称不超过60个字符', trigger: 'blur' },
        ],
        is_auth: [
            { required: true, message: '是否鉴权必填', trigger: 'change' },
            { type: 'enum', enum: [API_PERMISSION_SWITCH_VALUE.NO, API_PERMISSION_SWITCH_VALUE.YES], message: '选择的值只能是或否', trigger: 'change' },
        ],
        sort: [{ trigger: 'blur', type: 'integer', message: '请输入整数类型' }],
    }

    const handleSortNumberChange = (value) => {
        if (value === '') {
            currentRow.value.sort = 0
            return
        }

        if (checkNumber(value, 0)) {
            sortNumericValue = value
            return true
        }

        currentRow.value.sort = sortNumericValue
    }

    const handleEditClick = (row, index) => {
        currentRow.value = { ...createApiPermissionEditForm(), ...row }
        currentIndex.value = index
        sortNumericValue = currentRow.value.sort
        showDrawer.value = true
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return
        isSubmitting.value = true

        try {
            const valid = await currentRowRef.value.validate().catch(() => false)
            if (!valid) {
                isSubmitting.value = false
                return
            }

            const submitData = {
                id: currentRow.value.id,
                name: currentRow.value.name,
                sort: currentRow.value.sort,
                is_auth: currentRow.value.is_auth,
                desc: currentRow.value.desc,
            }

            await updatePermissionItem(submitData)
            permissionList.value[currentIndex.value] = { ...currentRow.value }
            showDrawer.value = false
            ElMessage.success('编辑成功')
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            setTimeout(() => {
                isSubmitting.value = false
            }, API_PERMISSION_SUBMIT_DEBOUNCE_TIME)
        }
    }

    return {
        showDrawer,
        currentRowRef,
        currentRow,
        currentIndex,
        isSubmitting,
        editFormRules,
        handleSortNumberChange,
        handleEditClick,
        editConfirmSubmit,
    }
}
