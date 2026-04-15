import { reactive, ref } from 'vue'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import { createMenuItem, deleteMenuItem, fetchMenuDetail, updateMenuItem } from '@/modules/permission/service'
import { createMenuForm, MENU_OPERATION_TYPE, MENU_STEP, MENU_SUBMIT_DEBOUNCE_TIME, MENU_SWITCH_VALUE, MENU_TYPE } from '@/modules/menu/model'
import { checkNumber, pick } from '@/utils/helper'

export function useMenuForm({ fetchPermissionList, getList }) {
    const showDrawer = ref(false)
    const step = ref(MENU_STEP.BASIC_INFO)
    const formTitle = ref('新增菜单')
    const formDataRef = ref(null)
    const isParentFixed = ref(false)
    const currentIndex = ref(null)
    const isSubmitting = ref(false)
    const initialFormData = createMenuForm()
    const formData = reactive({ ...initialFormData })

    const resetFormData = () => {
        Object.assign(formData, initialFormData)
        formDataRef.value?.clearValidate()
    }

    let numericValue
    const handleAnimateDurationChange = (value, decimal = 2) => {
        const val = value.replace(/^(0+)(?=\d)/, '')
        formData.animate_duration = val

        if (value === '') {
            formData.animate_duration = 0
            return
        }

        if (checkNumber(value, decimal)) {
            numericValue = val
            return true
        }

        formData.animate_duration = numericValue
    }

    const handlePathChange = (val) => {
        const isExternalLink = val.startsWith('http://') || val.startsWith('https://')
        formData.is_external_links = isExternalLink ? MENU_SWITCH_VALUE.YES : MENU_SWITCH_VALUE.NO
    }

    const editFormRules = {
        title: [
            { required: true, message: '名称不能为空', trigger: 'blur' },
            { min: 1, max: 12, message: '名称不超过12个字符', trigger: 'blur' },
        ],
        pid: [
            {
                required: true,
                message: '上级菜单不能为空',
                trigger: 'blur',
                validator: (rule, value, callback) => {
                    if (value === null || value === undefined || value === '') {
                        callback(new Error('上级菜单不能为空'))
                    } else {
                        callback()
                    }
                },
            },
        ],
        type: [{ required: true, message: '菜单类型不能为空', trigger: 'blur' }],
        is_auth: [{ required: true, message: '是否鉴权不能为空', trigger: 'blur' }],
        is_show: [{ required: true, message: '是否显示不能为空', trigger: 'blur' }],
        sort: [{ trigger: 'blur', type: 'integer', message: '请输入整数类型' }],
        path: [{ trigger: 'blur', validator: (rule, value, callback) => callback() }],
        name: [
            {
                trigger: 'blur',
                validator: (rule, value, callback) => {
                    if (formData.type === MENU_TYPE.MENU && !value) {
                        callback(new Error('请输入路由名称'))
                    }
                    callback()
                },
            },
        ],
        component: [
            {
                trigger: 'blur',
                validator: (rule, value, callback) => {
                    if (formData.type === MENU_TYPE.MENU && formData.is_external_links !== MENU_SWITCH_VALUE.YES && !value) {
                        callback(new Error('请输入组件路径'))
                    }
                    if (value) {
                        if (value.startsWith('/')) callback(new Error('组件路径不能以 / 开头'))
                        if (!/^[a-zA-Z0-9/._-]+$/.test(value)) callback(new Error('组件路径只能包含字母、数字、/、.、_、-'))
                    }
                    callback()
                },
            },
        ],
        code: [
            {
                trigger: 'blur',
                validator: (rule, value, callback) => {
                    if (formData.type === MENU_TYPE.BUTTON && !value) {
                        callback(new Error('请输入权限标识'))
                    }
                    callback()
                },
            },
        ],
    }

    const handleStepChange = async (targetStep) => {
        if (targetStep === MENU_STEP.PERMISSION) {
            try {
                await formDataRef.value.validate()
                step.value = targetStep
                await fetchPermissionList()
            } catch (fields) {
                if (fields && typeof fields === 'object') {
                    const firstErrorField = Object.keys(fields)[0]
                    if (firstErrorField && formDataRef.value) {
                        formDataRef.value.scrollToField(firstErrorField)
                    }
                }
                ElMessage.warning('请先完善基础信息')
            }
        } else {
            step.value = targetStep
        }
    }

    const handleSubmit = async () => {
        if (isSubmitting.value) return
        isSubmitting.value = true

        if (formData.type === MENU_TYPE.BUTTON) {
            formData.name = ''
            formData.path = ''
            formData.redirect = ''
            formData.component = ''
        } else {
            formData.code = ''
        }

        try {
            if (formData.id > 0) {
                await updateMenuItem(formData)
            } else {
                await createMenuItem(formData)
            }
            ElMessage.success('操作成功')
            await getList()
            showDrawer.value = false
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            setTimeout(() => {
                isSubmitting.value = false
            }, MENU_SUBMIT_DEBOUNCE_TIME)
        }
    }

    const closeDrawer = () => {
        showDrawer.value = false
        isParentFixed.value = false
    }

    const handleCancel = () => {
        if (formData.id > 0) {
            ElMessageBox.confirm(`已填写数据将会重置，确认退出${formTitle.value}吗?`, '温馨提示')
                .then(() => closeDrawer())
                .catch(() => {})
        } else {
            closeDrawer()
        }
    }

    const handleDrawerClose = (done) => {
        if (formData.id > 0) {
            ElMessageBox.confirm(`已填写数据将会重置，确认退出${formTitle.value}吗?`, '温馨提示')
                .then(() => {
                    isParentFixed.value = false
                    done()
                })
                .catch(() => {})
        } else {
            isParentFixed.value = false
            done()
        }
    }

    const loadMenuDetail = async (menuId, index) => {
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '加载中...',
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 3000,
        })

        try {
            const menuDetail = await fetchMenuDetail(menuId)
            if (menuDetail) {
                Object.assign(formData, pick(menuDetail, Object.keys(initialFormData)))
                currentIndex.value = index
                showDrawer.value = true
            } else {
                throw new Error('获取的数据无效')
            }
        } catch (error) {
            ElMessage.error('获取菜单详情失败')
            console.error(error)
        } finally {
            loadingInstance.close()
        }

        await fetchPermissionList()
    }

    const openEditDrawer = (type, row, index, fixedParentId = null) => {
        if (typeof type !== 'number' || ![MENU_OPERATION_TYPE.ADD, MENU_OPERATION_TYPE.EDIT].includes(type)) {
            return
        }

        if (type === MENU_OPERATION_TYPE.EDIT && (!row || typeof row.id !== 'number')) {
            ElMessage.error('无效的行数据')
            return
        }

        resetFormData()
        step.value = MENU_STEP.BASIC_INFO

        if (type === MENU_OPERATION_TYPE.EDIT) {
            formTitle.value = '编辑菜单'
            isParentFixed.value = false
            loadMenuDetail(row.id, index)
        } else {
            formTitle.value = '新增菜单'
            if (fixedParentId !== null) {
                formData.pid = fixedParentId
                isParentFixed.value = true
            } else {
                isParentFixed.value = false
            }
            showDrawer.value = true
        }
    }

    const handleAddChild = (parentRow) => {
        if (!parentRow || typeof parentRow.id !== 'number') {
            ElMessage.error('无效的行数据')
            return
        }
        openEditDrawer(MENU_OPERATION_TYPE.ADD, null, 0, parentRow.id)
    }

    const handleDelete = async (row) => {
        try {
            await ElMessageBox.confirm('确认删除该菜单吗?', '温馨提示', {
                confirmButtonText: '确认',
                cancelButtonText: '取消',
                beforeClose: async (action, instance, done) => {
                    if (action === 'confirm') {
                        instance.confirmButtonLoading = true
                        instance.confirmButtonText = '删除中...'
                        try {
                            await deleteMenuItem(row.id)
                            ElMessage.success('删除成功')
                            await getList()
                            done()
                        } catch (error) {
                            console.error('删除失败:', error)
                            instance.confirmButtonLoading = false
                            instance.confirmButtonText = '确认'
                        }
                    } else {
                        done()
                    }
                },
            })
        } catch (error) {
            if (error === 'cancel' || error === 'close') return
        }
    }

    return {
        showDrawer,
        step,
        formTitle,
        formDataRef,
        isParentFixed,
        currentIndex,
        isSubmitting,
        formData,
        editFormRules,
        handleAnimateDurationChange,
        handlePathChange,
        handleStepChange,
        handleSubmit,
        handleCancel,
        handleDrawerClose,
        openEditDrawer,
        handleAddChild,
        handleDelete,
    }
}
