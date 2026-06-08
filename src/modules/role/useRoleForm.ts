import { nextTick, reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElMessage, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { createRole, getRoleDetail, updateRole } from '@/api/permission'
import { fetchMenuTree } from '@/modules/permission/service'
import { createRoleForm, createRoleRules, isSuperAdminRole, ROLE_EDIT_TYPE, ROLE_STATUS, ROLE_SUBMIT_DELAY } from '@/modules/role/model'
import { validateFormSafely } from '@/modules/shared/form'
import { normalizeDetailData } from '@/modules/shared/response'
import type { Menu } from '@/types/menu'
import type { Role } from '@/types/role'
import { translate } from '@/locales'

const MENU_AUTH_REQUIRED = 1
const MENU_TYPE_DIRECTORY = 1
const MENU_TYPE_PAGE = 2
const MENU_TYPE_BUTTON = 3

interface UseRoleFormOptions {
    refreshRoleList: () => Promise<void>
}

export function useRoleForm({ refreshRoleList }: UseRoleFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const { isSubmitting, runWithSubmitLock } = useSubmitLock(ROLE_SUBMIT_DELAY)
    const menuTreeRef = ref()
    const menuTreeData = ref<Menu[]>([])
    const menuTreeDataLoaded = ref(false)
    const menuTreeLoading = ref(false)

    const initialFormData = createRoleForm()
    const formData = reactive({ ...initialFormData })

    const isEditMode = ref(false)
    const isSuperAdminEditing = ref(false)
    const getDynamicRules = createRoleRules

    const getMenuId = (menu: Pick<Menu, 'id'>) => {
        return typeof menu.id === 'number' ? menu.id : Number(menu.id)
    }

    const isAuthRequiredMenu = (menu: Menu) => Number(menu.is_auth ?? MENU_AUTH_REQUIRED) === MENU_AUTH_REQUIRED

    const hasPermissionDescendant = (menu: Menu): boolean => {
        if (!Array.isArray(menu.children) || menu.children.length === 0) {
            return false
        }
        return menu.children.some((child) => {
            const childType = Number(child.type)
            if (isAuthRequiredMenu(child) && childType !== MENU_TYPE_DIRECTORY) {
                return true
            }
            return hasPermissionDescendant(child)
        })
    }

    const isRealPermissionMenu = (menu: Menu) => {
        if (Number(menu.status ?? ROLE_STATUS.NORMAL) !== ROLE_STATUS.NORMAL || !isAuthRequiredMenu(menu)) {
            return false
        }
        const menuType = Number(menu.type)
        if (menuType === MENU_TYPE_BUTTON) return true
        if (menuType === MENU_TYPE_PAGE) return !hasPermissionDescendant(menu)
        return false
    }

    const collectMenuIds = (menus: Menu[], predicate: (menu: Menu) => boolean) => {
        const ids: number[] = []
        const walk = (items: Menu[]) => {
            items.forEach((item) => {
                const itemId = getMenuId(item)
                if (!Number.isNaN(itemId) && predicate(item)) {
                    ids.push(itemId)
                }
                if (Array.isArray(item.children) && item.children.length > 0) {
                    walk(item.children)
                }
            })
        }
        walk(menus)
        return ids
    }

    const findMenuPath = (menus: Menu[], targetId: number, path: Menu[] = []): Menu[] | null => {
        for (const menu of menus) {
            const currentPath = [...path, menu]
            if (getMenuId(menu) === targetId) {
                return currentPath
            }
            if (Array.isArray(menu.children) && menu.children.length > 0) {
                const childPath = findMenuPath(menu.children, targetId, currentPath)
                if (childPath) return childPath
            }
        }
        return null
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

    const normalizeSubmittedMenuList = (keys: unknown[]) => {
        const seen = new Set<number>()
        return normalizeMenuList(keys).filter((id) => {
            if (seen.has(id)) return false
            const path = findMenuPath(menuTreeData.value, id)
            const menu = path?.[path.length - 1]
            if (!menu || !isRealPermissionMenu(menu)) {
                return false
            }
            seen.add(id)
            return true
        })
    }

    const collectDefaultSuperAdminCheckedKeys = () => {
        return collectMenuIds(menuTreeData.value, (menu) => isRealPermissionMenu(menu))
    }

    const syncFormMenuListFromTree = () => {
        if (!menuTreeRef.value) return
        const checkedKeys = menuTreeRef.value.getCheckedKeys()
        const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys()
        formData.menu_list = normalizeSubmittedMenuList([...checkedKeys, ...halfCheckedKeys])
    }

    const getSubmitData = () => {
        const data: Record<string, unknown> = {
            name: formData.name,
            sort: formData.sort,
            description: formData.description || '',
            menu_list: Array.isArray(formData.menu_list) ? formData.menu_list : [],
            status: formData.status ?? ROLE_STATUS.NORMAL,
        }
        if (isEditMode.value && formData.id) {
            data.id = formData.id
        } else {
            data.code = formData.code
        }
        return data
    }

    const resetFormData = () => {
        Object.assign(formData, { ...initialFormData })
        isEditMode.value = false
        isSuperAdminEditing.value = false
    }

    const cloneMenuTree = (menus: Menu[]): Menu[] => {
        return menus.map((menu) => ({
            ...menu,
            children: Array.isArray(menu.children) ? cloneMenuTree(menu.children) : menu.children,
        }))
    }

    const updateMenuTreeDisabled = (menuData: Menu[]) => {
        if (!Array.isArray(menuData)) return

        const walk = (items: Menu[]) => {
            items.forEach((item) => {
                item.disabled = isSuperAdminEditing.value
                if (item.children && item.children.length > 0) {
                    walk(item.children)
                }
            })
        }
        walk(menuData)
    }

    const handleMenuCheck = (_data: unknown, _checked: { checkedKeys: number[]; halfCheckedKeys: number[] }) => {
        if (isSuperAdminEditing.value) {
            nextTick(() => {
                menuTreeRef.value?.setCheckedKeys(formData.menu_list, false)
            })
            return
        }
        syncFormMenuListFromTree()
    }

    const setMenuTreeChecked = async () => {
        const waitForNextFrame = () =>
            new Promise<void>((resolve) => {
                requestAnimationFrame(() => resolve())
            })

        for (let i = 0; i < 10; i++) {
            await nextTick()
            if (menuTreeRef.value) break
            await waitForNextFrame()
        }

        if (menuTreeRef.value && menuTreeData.value.length > 0) {
            const menuIds = normalizeMenuList(formData.menu_list)

            if (isSuperAdminEditing.value) {
                const allMenuIds = collectDefaultSuperAdminCheckedKeys()
                formData.menu_list = normalizeSubmittedMenuList(allMenuIds)
                menuTreeRef.value.setCheckedKeys(allMenuIds, false)
                return
            }

            menuTreeRef.value.setCheckedKeys([], false)
            menuTreeRef.value.setCheckedKeys(menuIds, false)
            formData.menu_list = normalizeSubmittedMenuList(menuIds)
        }
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

    const loadRoleIntoForm = async (roleId: number, mode: 'edit' | 'copy') => {
        const response = await getRoleDetail({ id: roleId })
        const roleData = normalizeDetailData<Role>(response, {} as Role)
        const rawMenuList = roleData.menu_list ?? roleData.permission_ids ?? []
        const menuIds = normalizeMenuList(rawMenuList)

        Object.assign(formData, {
            id: mode === 'edit' ? roleData.id : 0,
            name: mode === 'copy' ? `${roleData.name}-copy` : roleData.name || '',
            code: '',
            sort: roleData.sort ?? 100,
            description: roleData.description || '',
            menu_list: menuIds,
            status: roleData.status ?? ROLE_STATUS.NORMAL,
        })

        if (mode === 'edit') {
            formData.code = roleData.code || ''
        }

        isSuperAdminEditing.value = mode === 'edit' && isSuperAdminRole(roleData)
    }

    const openEditDrawer = async (type: number, row?: Partial<Role>, index?: number) => {
        if (typeof type !== 'number') return

        showDrawer.value = true
        currentIndex.value = index ?? null
        resetFormData()

        if (type === ROLE_EDIT_TYPE.EDIT) {
            if (!row || typeof row.id !== 'number') {
                ElMessage.error(translate('validation.role.invalidRow'))
                showDrawer.value = false
                return
            }

            formTitle.value = translate('permission.role.editTitle')
            isEditMode.value = true

            try {
                await loadRoleIntoForm(row.id, 'edit')
                if (menuTreeDataLoaded.value) {
                    await setMenuTreeChecked()
                }
            } catch (error) {
                Logger.error('获取角色详情失败:', error)
                showDrawer.value = false
                return
            }
        } else {
            formTitle.value = translate('permission.role.addTitle')
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
            formDataRef.value?.clearValidate()
        }, 50)
    }

    const handleCopyRole = async (row: Role, index?: number) => {
        const roleId = typeof row.id === 'number' ? row.id : Number(row.id)
        if (!roleId) return

        showDrawer.value = true
        currentIndex.value = index ?? null
        resetFormData()
        formTitle.value = translate('permission.role.copyTitle')

        try {
            await loadRoleIntoForm(roleId, 'copy')
            if (menuTreeDataLoaded.value) {
                await setMenuTreeChecked()
            }
        } catch (error) {
            Logger.error('获取复制角色详情失败:', error)
            showDrawer.value = false
            return
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
            formDataRef.value?.clearValidate()
        }, 50)
    }

    const editConfirmSubmit = async () => {
        const valid = await validateFormSafely(formDataRef.value, translate('validation.role.formName'))
        if (!valid) return

        await runWithSubmitLock(async () => {
            if (isSuperAdminEditing.value) {
                ElMessage.warning(translate('validation.role.readonlySuperAdmin'))
                return
            }

            if (menuTreeRef.value && !isSuperAdminEditing.value) {
                syncFormMenuListFromTree()
            }

            const submitData = getSubmitData()
            if (isEditMode.value) {
                await updateRole(submitData)
            } else {
                await createRole(submitData)
            }

            showDrawer.value = false
            ElMessage.success(isEditMode.value ? translate('common.result.editSuccess') : translate('common.result.addSuccess'))
            await refreshRoleList()
        }).catch((error) => {
            ElMessage.error(translate('common.result.operationFailed'))
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
        menuTreeData,
        menuTreeLoading,
        handleMenuCheck,
        openEditDrawer,
        handleCopyRole,
        editConfirmSubmit,
    }
}
