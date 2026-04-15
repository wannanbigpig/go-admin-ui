import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createRoleItem, fetchMenuTree, fetchRoleDetail, updateRoleItem } from '@/modules/permission/service'
import { createRoleForm, createRoleRules, isSuperAdminRole, ROLE_EDIT_TYPE, ROLE_STATUS, ROLE_SUBMIT_DELAY } from '@/modules/role/model'

export function useRoleForm({ roleList, refreshParentNodeChildren }) {
    const showDrawer = ref(false)
    const formDataRef = ref()
    const formTitle = ref('')
    const currentIndex = ref(null)
    const isSubmitting = ref(false)
    const menuTreeRef = ref()
    const menuTreeData = ref([])
    const menuTreeDataLoaded = ref(false)
    const menuTreeLoading = ref(false)
    const parentRoleMenuList = ref([])

    const initialFormData = createRoleForm()
    const formData = reactive({ ...initialFormData })
    const originalFormData = ref(null)

    const isEditMode = computed(() => !!originalFormData.value)
    const isSuperAdminEditing = computed(() => isEditMode.value && isSuperAdminRole(originalFormData.value))
    const getDynamicRules = createRoleRules

    const flattenRoleTree = (roles, prefix = '') => {
        if (!Array.isArray(roles)) return []

        return roles.flatMap((role) => {
            const label = prefix ? `${prefix} / ${role.name}` : role.name
            const current = [{ ...role, label }]
            if (Array.isArray(role.children) && role.children.length > 0) {
                return current.concat(flattenRoleTree(role.children, label))
            }
            return current
        })
    }

    const getSubmitData = () => ({
        id: formData.id || 0,
        name: formData.name,
        sort: formData.sort,
        pid: formData.pid ?? 0,
        description: formData.description || '',
        menu_list: Array.isArray(formData.menu_list) ? formData.menu_list : [],
        status: formData.status ?? ROLE_STATUS.NORMAL,
    })

    const resetFormData = () => {
        Object.assign(formData, { ...initialFormData })
        parentRoleMenuList.value = []
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
                menu_list: [...formData.menu_list],
                status: formData.status,
            })
        )
    }

    const getRoleChildrenIds = (targetId) => {
        const result = [targetId]

        const walk = (roles) => {
            roles.forEach((role) => {
                if (role.pid === targetId || result.includes(role.pid)) {
                    if (!result.includes(role.id)) {
                        result.push(role.id)
                    }
                }
                if (Array.isArray(role.children) && role.children.length > 0) {
                    walk(role.children)
                }
            })
        }

        walk(roleList.value || [])
        return result
    }

    const filteredRoleOptions = computed(() => {
        const roleOptions = flattenRoleTree(roleList.value || [])
        if (!isEditMode.value || !formData.id) {
            return roleOptions
        }

        const excludedIds = getRoleChildrenIds(formData.id)
        return roleOptions.filter((role) => !excludedIds.includes(role.id))
    })

    const updateMenuTreeDisabled = (menuData) => {
        if (!Array.isArray(menuData)) return

        if (isSuperAdminEditing.value) {
            const disableAll = (items) => {
                items.forEach((item) => {
                    item.disabled = true
                    if (item.children && item.children.length > 0) {
                        disableAll(item.children)
                    }
                })
            }
            disableAll(menuData)
            return
        }

        if (formData.pid === 0 || formData.pid === null) {
            const clearDisabled = (items) => {
                items.forEach((item) => {
                    item.disabled = false
                    if (item.children && item.children.length > 0) {
                        clearDisabled(item.children)
                    }
                })
            }
            clearDisabled(menuData)
            return
        }

        const setDisabled = (items) => {
            items.forEach((item) => {
                item.disabled = parentRoleMenuList.value.includes(item.id)
                if (item.children && item.children.length > 0) {
                    setDisabled(item.children)
                }
            })
        }
        setDisabled(menuData)
    }

    const handleMenuCheck = (data, checked) => {
        if (isSuperAdminEditing.value) {
            nextTick(() => {
                menuTreeRef.value?.setCheckedKeys(formData.menu_list, false)
            })
            return
        }
        formData.menu_list = checked.checkedKeys || []
    }

    const setMenuTreeChecked = async () => {
        await nextTick()
        if (menuTreeRef.value && menuTreeData.value.length > 0) {
            if (isSuperAdminEditing.value) {
                const allMenuIds = []
                const collectMenuIds = (items) => {
                    items.forEach((item) => {
                        allMenuIds.push(item.id)
                        if (Array.isArray(item.children) && item.children.length > 0) {
                            collectMenuIds(item.children)
                        }
                    })
                }
                collectMenuIds(menuTreeData.value)
                formData.menu_list = allMenuIds
                menuTreeRef.value.setCheckedKeys([], false)
                menuTreeRef.value.setCheckedKeys(allMenuIds, false)
            } else if (isEditMode.value && formData.menu_list.length > 0) {
                menuTreeRef.value.setCheckedKeys([], false)
                menuTreeRef.value.setCheckedKeys(formData.menu_list, false)
            } else if (!isEditMode.value) {
                menuTreeRef.value.setCheckedKeys([])
            }
        }
    }

    const getParentRoleName = (pid) => {
        if (pid === 0 || pid === null) {
            return '顶级角色'
        }
        const parentRole = roleList.value.find((role) => role.id === pid)
        return parentRole ? parentRole.name : '未知角色'
    }

    const getParentRoleMenuList = async (parentId) => {
        if (!parentId || parentId === 0) {
            parentRoleMenuList.value = []
            if (menuTreeDataLoaded.value && menuTreeData.value.length > 0) {
                updateMenuTreeDisabled(menuTreeData.value)
            }
            return
        }

        try {
            const roleData = await fetchRoleDetail(parentId)
            parentRoleMenuList.value = Array.isArray(roleData.menu_list) ? roleData.menu_list : []

            if (menuTreeDataLoaded.value && menuTreeData.value.length > 0) {
                updateMenuTreeDisabled(menuTreeData.value)
            }
        } catch (error) {
            console.error('获取父角色权限失败:', error)
            parentRoleMenuList.value = []
            if (menuTreeDataLoaded.value && menuTreeData.value.length > 0) {
                updateMenuTreeDisabled(menuTreeData.value)
            }
        }
    }

    const handleParentRoleChange = async (parentId) => {
        if (isSuperAdminEditing.value) return
        await getParentRoleMenuList(parentId)
    }

    const getMenuTreeData = async () => {
        const menuData = await fetchMenuTree({ status: ROLE_STATUS.NORMAL })
        if (Array.isArray(menuData)) {
            const clonedData = JSON.parse(JSON.stringify(menuData))
            updateMenuTreeDisabled(clonedData)
            menuTreeData.value = clonedData
        }
        return menuData
    }

    const openEditDrawer = async (type, row, index, parentId = null) => {
        if (typeof type !== 'number') return

        if (type === ROLE_EDIT_TYPE.EDIT) {
            if (!row || typeof row.id !== 'number') {
                ElMessage.error('无效的行数据')
                return
            }

            formTitle.value = '编辑角色'
            currentIndex.value = index
            resetFormData()

            try {
                const roleData = await fetchRoleDetail(row.id)
                Object.assign(formData, {
                    id: roleData.id,
                    name: roleData.name || '',
                    sort: roleData.sort ?? 100,
                    pid: roleData.pid ?? 0,
                    description: roleData.description || '',
                    menu_list: Array.isArray(roleData.menu_list) ? roleData.menu_list : [],
                    status: roleData.status ?? ROLE_STATUS.NORMAL,
                })

                saveOriginalData()

                if (formData.pid && formData.pid !== 0) {
                    await getParentRoleMenuList(formData.pid)
                } else {
                    parentRoleMenuList.value = []
                }

                if (menuTreeDataLoaded.value) {
                    await setMenuTreeChecked()
                }
            } catch (error) {
                console.error('获取角色详情失败:', error)
                return
            }
        } else {
            formTitle.value = parentId ? '创建下级角色' : '新增角色'
            resetFormData()
            originalFormData.value = null
            formData.pid = parentId !== null ? parentId : 0

            if (parentId !== null && parentId !== 0) {
                const parentRoleName = getParentRoleName(parentId)
                if (parentRoleName && parentRoleName !== '未知角色') {
                    formData.name = `${parentRoleName}-`
                }
                await getParentRoleMenuList(parentId)
            } else {
                parentRoleMenuList.value = []
            }

            if (menuTreeDataLoaded.value) {
                await setMenuTreeChecked()
            }
        }

        currentIndex.value = index
        showDrawer.value = true

        if (!menuTreeDataLoaded.value) {
            menuTreeLoading.value = true
            getMenuTreeData()
                .then(() => {
                    menuTreeDataLoaded.value = true
                    setMenuTreeChecked()
                })
                .catch((error) => {
                    console.error('获取菜单列表失败:', error)
                    ElMessage.error('获取菜单列表失败')
                })
                .finally(() => {
                    menuTreeLoading.value = false
                })
        } else {
            updateMenuTreeDisabled(menuTreeData.value)
        }
    }

    const handleAddChild = (row) => {
        openEditDrawer(ROLE_EDIT_TYPE.ADD, null, null, row.id)
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
            const parentId = submitData.pid || 0

            if (isEditMode.value) {
                if (isSuperAdminEditing.value) {
                    ElMessage.warning('超级管理员角色为只读，不允许编辑')
                    return
                }
                await updateRoleItem(submitData)
            } else {
                await createRoleItem(submitData)
            }

            if (isEditMode.value) {
                const originalParentId = originalFormData.value?.pid || 0
                if (originalParentId !== parentId) {
                    await refreshParentNodeChildren(originalParentId)
                    await refreshParentNodeChildren(parentId)
                } else {
                    await refreshParentNodeChildren(parentId)
                }

                if (parentId === 0) {
                    await refreshParentNodeChildren(0)
                }
            } else {
                await refreshParentNodeChildren(parentId)
                if (parentId === 0) {
                    await refreshParentNodeChildren(0)
                }
            }

            showDrawer.value = false
            ElMessage.success(isEditMode.value ? '编辑成功' : '新增成功')
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            setTimeout(() => {
                isSubmitting.value = false
            }, ROLE_SUBMIT_DELAY)
        }
    }

    return {
        showDrawer,
        formDataRef,
        formTitle,
        currentIndex,
        isSubmitting,
        menuTreeRef,
        formData,
        isEditMode,
        isSuperAdminEditing,
        getDynamicRules,
        filteredRoleOptions,
        menuTreeData,
        menuTreeLoading,
        handleMenuCheck,
        handleParentRoleChange,
        getParentRoleName,
        openEditDrawer,
        handleAddChild,
        editConfirmSubmit,
    }
}
