import { computed, nextTick, reactive, ref, type Ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { createRole, updateRole, getRoleDetail } from '@/api/permission'
import { fetchMenuTree } from '@/modules/permission/service'
import { createRoleForm, createRoleRules, isSuperAdminRole, ROLE_EDIT_TYPE, ROLE_STATUS, ROLE_SUBMIT_DELAY } from '@/modules/role/model'
import { validateFormSafely } from '@/modules/shared/form'
import { normalizeDetailData } from '@/modules/shared/response'
import type { Role } from '@/types/role'
import type { Menu } from '@/types/menu'
import { translate } from '@/locales'

interface UseRoleFormOptions {
    roleList: Ref<Role[]>
    refreshParentNodeChildren: (parentId: number) => Promise<void>
}

export function useRoleForm({ roleList, refreshParentNodeChildren }: UseRoleFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const { isSubmitting, runWithSubmitLock } = useSubmitLock(ROLE_SUBMIT_DELAY)
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
    }

    const saveOriginalData = () => {
        originalFormData.value = {
            id: formData.id,
            name: formData.name,
            code: formData.code,
            sort: formData.sort,
            pid: formData.pid,
            description: formData.description,
            menu_list: [...(formData.menu_list || [])],
            status: formData.status,
        }
    }

    const cloneMenuTree = (menus: Menu[]): Menu[] => {
        return menus.map((menu) => ({
            ...menu,
            children: Array.isArray(menu.children) ? cloneMenuTree(menu.children) : menu.children,
        }))
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
        const waitForNextFrame = () =>
            new Promise<void>((resolve) => {
                requestAnimationFrame(() => resolve())
            })

        // 增加重试机制，确保 el-tree 已挂载
        for (let i = 0; i < 10; i++) {
            await nextTick()
            if (menuTreeRef.value) break
            await waitForNextFrame()
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
            return translate('permission.common.topRole')
        }
        const parentRole = roleList.value.find((role) => role.id === pid)
        return parentRole ? parentRole.name : translate('common.unknown')
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
            const roleData = normalizeDetailData<Role>(response, {} as Role)
            const rawMenuList = roleData.menu_list ?? roleData.permission_ids ?? []
            parentRoleMenuList.value = normalizeMenuList(rawMenuList)

            if (menuTreeDataLoaded.value && menuTreeData.value.length > 0) {
                updateMenuTreeDisabled(menuTreeData.value)
            }
        } catch (error) {
            Logger.error('获取父角色权限失败:', error)
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
            const menuData = await fetchMenuTree({ status: ROLE_STATUS.NORMAL })
            const clonedData = cloneMenuTree(menuData)
            updateMenuTreeDisabled(clonedData)
            menuTreeData.value = clonedData
            return clonedData
        } catch (error) {
            Logger.error('获取菜单树数据失败:', error)
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
                ElMessage.error(translate('validation.role.invalidRow'))
                showDrawer.value = false
                return
            }

            formTitle.value = translate('permission.role.editTitle')
            resetFormData()

            try {
                const response = await getRoleDetail({ id: row.id })
                const roleData = normalizeDetailData<Role>(response, {} as Role)
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
                Logger.error('获取角色详情失败:', error)
                showDrawer.value = false
                return
            }
        } else {
            formTitle.value = parentId ? translate('permission.role.addChildTitle') : translate('permission.role.addTitle')
            resetFormData()
            originalFormData.value = null
            formData.pid = parentId !== null ? parentId : 0

            if (parentId !== null && parentId !== 0) {
                const parentRoleName = getParentRoleName(parentId)
                if (parentRoleName && parentRoleName !== translate('common.unknown')) {
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
                    Logger.error('获取菜单列表失败:', error)
                    ElMessage.error(translate('validation.role.fetchMenuFailed'))
                })
                .finally(() => {
                    menuTreeLoading.value = false
                })
        } else {
            updateMenuTreeDisabled(menuTreeData.value)
        }

        setTimeout(() => {
            if (formDataRef.value) {
                formDataRef.value.clearValidate()
            }
        }, 50)
    }

    const handleAddChild = (row: Role) => {
        const parentId = typeof row.id === 'number' ? row.id : Number(row.id)
        openEditDrawer(ROLE_EDIT_TYPE.ADD, undefined, undefined, parentId)
    }

    const editConfirmSubmit = async () => {
        const valid = await validateFormSafely(formDataRef.value, translate('validation.role.formName'))
        if (!valid) return

        await runWithSubmitLock(async () => {
            if (isSuperAdminEditing.value) {
                ElMessage.warning(translate('validation.role.readonlySuperAdmin'))
                return
            }

            // 提交前同步当前树的全选和半选节点，确保权限树完整性
            if (menuTreeRef.value && !isSuperAdminEditing.value) {
                const checkedKeys = menuTreeRef.value.getCheckedKeys()
                const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()
                formData.menu_list = normalizeMenuList([...checkedKeys, ...halfCheckedKeys])
            }

            const submitData = getSubmitData()
            const parentId = Number(submitData.pid ?? 0)

            if (isEditMode.value) {
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
