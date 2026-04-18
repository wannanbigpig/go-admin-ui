import { computed, nextTick, reactive, ref, type Ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { createRole, updateRole, getMenuList, getRoleDetail } from '@/api/permission'
import { createRoleForm, createRoleRules, isSuperAdminRole, ROLE_EDIT_TYPE, ROLE_STATUS, ROLE_SUBMIT_DELAY } from '@/modules/role/model'
import { normalizeDetailData } from '@/modules/shared/response'
import type { Role } from '@/types/role'
import type { Menu } from '@/types/menu'

interface UseRoleFormOptions {
    roleList: Ref<Role[]>
    refreshParentNodeChildren: (parentId: number) => Promise<void>
}

export function useRoleForm({ roleList, refreshParentNodeChildren }: UseRoleFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const isSubmitting = ref(false)
    const menuTreeRef = ref()
    const menuTreeData = ref<Menu[]>([])
    const menuTreeDataLoaded = ref(false)
    const menuTreeLoading = ref(false)
    const parentRoleMenuList = ref<number[]>([])

    const initialFormData = createRoleForm()
    const formData = reactive({ ...initialFormData })
    const originalFormData = ref<Partial<Role> | null>(null)

    const isEditMode = computed(() => !!originalFormData.value)
    const isSuperAdminEditing = computed(() => isEditMode.value && isSuperAdminRole(originalFormData.value))
    const getDynamicRules = createRoleRules

    const flattenRoleTree = (roles: Role[], prefix = ''): Array<Role & { label: string }> => {
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

    const normalizeMenuList = (value: unknown): number[] => {
        if (!Array.isArray(value)) return []

        return value
            .map((item) => {
                if (typeof item === 'object' && item !== null) {
                    const itemId = (item as Record<string, unknown>).id
                    return typeof itemId === 'number' ? itemId : Number(itemId)
                }
                return typeof item === 'number' ? item : Number(item)
            })
            .filter((item) => !Number.isNaN(item))
    }

    const getSubmitData = () => {
        const data: Record<string, unknown> = {
            name: formData.name,
            code: formData.code,
            sort: formData.sort,
            pid: formData.pid ?? 0,
            description: formData.description || '',
            menu_list: Array.isArray(formData.menu_list) ? formData.menu_list : [],
            status: formData.status ?? ROLE_STATUS.NORMAL,
        }
        if (isEditMode.value && formData.id) {
            data.id = formData.id
        }
        return data
    }

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
                code: formData.code,
                sort: formData.sort,
                pid: formData.pid,
                description: formData.description,
                menu_list: [...(formData.menu_list || [])],
                status: formData.status,
            })
        )
    }

    const getRoleChildrenIds = (targetId: number) => {
        const result: number[] = [targetId]

        const walk = (roles: Role[]) => {
            roles.forEach((role) => {
                const roleId = typeof role.id === 'number' ? role.id : Number(role.id)
                const rolePid = role.pid ? Number(role.pid) : 0

                if (rolePid === targetId || result.includes(rolePid)) {
                    if (!result.includes(roleId)) {
                        result.push(roleId)
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

        const excludedIds = getRoleChildrenIds(Number(formData.id))
        return roleOptions.filter((role) => !excludedIds.includes(typeof role.id === 'number' ? role.id : Number(role.id)))
    })

    const updateMenuTreeDisabled = (menuData: Menu[]) => {
        if (!Array.isArray(menuData)) return

        if (isSuperAdminEditing.value) {
            const disableAll = (items: Menu[]) => {
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
            const clearDisabled = (items: Menu[]) => {
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

        const setDisabled = (items: Menu[]) => {
            items.forEach((item) => {
                const itemId = typeof item.id === 'number' ? item.id : Number(item.id)
                item.disabled = parentRoleMenuList.value.includes(itemId)
                if (item.children && item.children.length > 0) {
                    setDisabled(item.children)
                }
            })
        }
        setDisabled(menuData)
    }

    const handleMenuCheck = (_data: unknown, checked: { checkedKeys: number[]; halfCheckedKeys: number[] }) => {
        if (isSuperAdminEditing.value) {
            nextTick(() => {
                menuTreeRef.value?.setCheckedKeys(formData.menu_list, false)
            })
            return
        }
        formData.menu_list = normalizeMenuList(checked.checkedKeys || [])
    }

    const setMenuTreeChecked = async () => {
        // 增加重试机制，确保 el-tree 已挂载
        for (let i = 0; i < 10; i++) {
            await nextTick()
            if (menuTreeRef.value) break
            await new Promise((resolve) => setTimeout(resolve, 100))
        }

        if (menuTreeRef.value && menuTreeData.value.length > 0) {
            const menuIds = normalizeMenuList(formData.menu_list)

            if (isSuperAdminEditing.value) {
                const allMenuIds: number[] = []
                const collectMenuIds = (items: Menu[]) => {
                    items.forEach((item) => {
                        allMenuIds.push(typeof item.id === 'number' ? item.id : Number(item.id))
                        if (Array.isArray(item.children) && item.children.length > 0) {
                            collectMenuIds(item.children)
                        }
                    })
                }
                collectMenuIds(menuTreeData.value)
                formData.menu_list = allMenuIds
                menuTreeRef.value.setCheckedKeys(allMenuIds, false)
            } else if (isEditMode.value && menuIds.length > 0) {
                menuTreeRef.value.setCheckedKeys([], false)
                menuTreeRef.value.setCheckedKeys(menuIds, false)
            } else if (!isEditMode.value) {
                menuTreeRef.value.setCheckedKeys([], false)
            }
        }
    }

    const getParentRoleName = (pid: number) => {
        if (pid === 0 || pid === null) {
            return '顶级角色'
        }
        const parentRole = roleList.value.find((role) => role.id === pid)
        return parentRole ? parentRole.name : '未知角色'
    }

    const getParentRoleMenuList = async (parentId: number) => {
        if (!parentId || parentId === 0) {
            parentRoleMenuList.value = []
            if (menuTreeDataLoaded.value && menuTreeData.value.length > 0) {
                updateMenuTreeDisabled(menuTreeData.value)
            }
            return
        }

        try {
            const response = await getRoleDetail({ id: parentId })
            const roleData = normalizeDetailData<Role>(response as Parameters<typeof normalizeDetailData<Role>>[0], {} as Role)
            const rawMenuList = roleData.menu_list ?? roleData.permission_ids ?? []
            parentRoleMenuList.value = normalizeMenuList(rawMenuList)

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

    const handleParentRoleChange = async (parentId: number) => {
        if (isSuperAdminEditing.value) return
        await getParentRoleMenuList(parentId)
    }

    const getMenuTreeData = async () => {
        try {
            const response = await getMenuList({ status: ROLE_STATUS.NORMAL })
            // API 返回的是 ApiResponse<Menu[]> 结构，需要提取 data
            const menuData = response?.data || response
            if (Array.isArray(menuData)) {
                const clonedData = JSON.parse(JSON.stringify(menuData))
                updateMenuTreeDisabled(clonedData)
                menuTreeData.value = clonedData
                return clonedData
            }
            // 如果返回的不是数组，可能是空数组或其他结构
            menuTreeData.value = []
            return []
        } catch (error) {
            console.error('获取菜单树数据失败:', error)
            menuTreeData.value = []
            return []
        }
    }

    const openEditDrawer = async (type: number, row?: Partial<Role>, index?: number, parentId: number | null = null) => {
        if (typeof type !== 'number') return

        // 核心改动 1：先展示抽屉，让组件开始挂载
        showDrawer.value = true
        currentIndex.value = index ?? null

        if (type === ROLE_EDIT_TYPE.EDIT) {
            if (!row || typeof row.id !== 'number') {
                ElMessage.error('无效的行数据')
                showDrawer.value = false
                return
            }

            formTitle.value = '编辑角色'
            resetFormData()

            try {
                const response = await getRoleDetail({ id: row.id })
                const roleData = normalizeDetailData<Role>(response as Parameters<typeof normalizeDetailData<Role>>[0], {} as Role)
                const rawMenuList = roleData.menu_list ?? roleData.permission_ids ?? []
                const menuIds = normalizeMenuList(rawMenuList)

                Object.assign(formData, {
                    id: roleData.id,
                    name: roleData.name || '',
                    code: roleData.code || '',
                    sort: roleData.sort ?? 100,
                    pid: roleData.pid ?? 0,
                    description: roleData.description || '',
                    menu_list: menuIds,
                    status: roleData.status ?? ROLE_STATUS.NORMAL,
                })

                saveOriginalData()

                if (formData.pid && formData.pid !== 0) {
                    await getParentRoleMenuList(formData.pid)
                } else {
                    parentRoleMenuList.value = []
                }

                // 核心改动 2：等待树加载完后回显
                if (menuTreeDataLoaded.value) {
                    await setMenuTreeChecked()
                }
            } catch (error) {
                console.error('获取角色详情失败:', error)
                showDrawer.value = false
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

    const handleAddChild = (row: Role) => {
        const parentId = typeof row.id === 'number' ? row.id : Number(row.id)
        openEditDrawer(ROLE_EDIT_TYPE.ADD, undefined, undefined, parentId)
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return
        isSubmitting.value = true

        try {
            const valid = await formDataRef.value?.validate().catch(() => false)
            if (!valid) {
                isSubmitting.value = false
                return
            }

            // 提交前同步当前树的全选和半选节点，确保权限树完整性
            if (menuTreeRef.value && !isSuperAdminEditing.value) {
                const checkedKeys = menuTreeRef.value.getCheckedKeys()
                const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()
                formData.menu_list = normalizeMenuList([...checkedKeys, ...halfCheckedKeys])
            }

            const submitData = getSubmitData()
            const parentId = submitData.pid || 0

            if (isEditMode.value) {
                if (isSuperAdminEditing.value) {
                    ElMessage.warning('超级管理员角色为只读，不允许编辑')
                    return
                }
                await updateRole(submitData)
            } else {
                await createRole(submitData)
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
