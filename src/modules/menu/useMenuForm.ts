import { computed, reactive, ref } from 'vue'
import { Logger } from '@/utils/logger'
import { ElLoading, ElMessage, ElMessageBox, type FormInstance } from 'element-plus'
import { useSubmitLock } from '@/composables/useSubmitLock'
import { CANCEL_BUTTON_TEXT, CONFIRM_BUTTON_TEXT, CONFIRM_DIALOG_TITLE, CONFIRM_MESSAGES, RESULT_MESSAGES, getDrawerExitConfirmMessage } from '@/constants/messages'
import { createMenu, updateMenu, getMenuDetail, deleteMenu, getPermissionList, getMenuList } from '@/api/permission'
import { createMenuForm, MENU_OPERATION_TYPE, MENU_PERMISSION_QUERY_PARAMS, MENU_STEP, MENU_SUBMIT_DEBOUNCE_TIME, MENU_SWITCH_VALUE, MENU_TYPE } from '@/modules/menu/model'
import { normalizeDetailData, normalizeListData } from '@/modules/shared/response'
import type { ApiPermission } from '@/modules/apiPermission'
import { checkNumber, pick } from '@/utils/helper'
import type { Menu } from '@/types/menu'

interface UseMenuFormOptions {
    getList: () => Promise<void>
}

export function useMenuForm({ getList }: UseMenuFormOptions) {
    const showDrawer = ref(false)
    const step = ref(MENU_STEP.BASIC_INFO)
    const formTitle = ref('新增菜单')
    const formDataRef = ref<FormInstance>()
    const isParentFixed = ref(false)
    const currentIndex = ref<number | null>(null)
    const { isSubmitting, runWithSubmitLock } = useSubmitLock(MENU_SUBMIT_DEBOUNCE_TIME)
    const initialFormData = createMenuForm()
    const formData = reactive({ ...initialFormData })

    // 权限列表相关
    const permissionListLoading = ref(false)
    const permissionList = ref<Array<{ id: number | string; name: string; route: string; method: string; display_name: string }>>([])
    const permissionListLoaded = ref(false)

    const normalizePermissionId = (value: unknown): number | string | null => {
        if (value === null || value === undefined || value === '') return null

        if (typeof value === 'number') {
            return Number.isNaN(value) ? null : value
        }

        if (typeof value === 'string') {
            const trimmedValue = value.trim()
            if (!trimmedValue) return null
            const numericValue = Number(trimmedValue)
            return Number.isNaN(numericValue) ? trimmedValue : numericValue
        }

        return null
    }

    const normalizePermissionSelection = (value: unknown): Array<number | string> => {
        if (!Array.isArray(value)) return []

        return value
            .map((item) => {
                if (typeof item === 'object' && item !== null) {
                    return normalizePermissionId((item as Record<string, unknown>).id ?? (item as Record<string, unknown>).permission_id ?? (item as Record<string, unknown>).api_id)
                }

                return normalizePermissionId(item)
            })
            .filter((item): item is number | string => item !== null)
    }

    const buildPermissionDisplayName = (item: ApiPermission, fallbackId: number | string) => {
        const name = item.name || item.code || `接口 ${fallbackId}`
        const method = item.method ? `[${item.method}]` : ''
        const route = item.route || ''
        return [name, method, route].filter(Boolean).join(' ')
    }

    const fetchPermissionList = async () => {
        if (permissionListLoaded.value) return
        permissionListLoading.value = true
        try {
            const response = await getPermissionList(MENU_PERMISSION_QUERY_PARAMS)
            const { list } = normalizeListData<ApiPermission>(response)
            permissionList.value = list
                .map((item) => {
                    const normalizedId = normalizePermissionId(item.id)
                    if (normalizedId === null) return null

                    return {
                        id: normalizedId,
                        name: item.name || item.code || item.route || String(normalizedId),
                        route: item.route || '',
                        method: item.method || '',
                        display_name: buildPermissionDisplayName(item, normalizedId),
                    }
                })
                .filter((item): item is { id: number | string; name: string; route: string; method: string; display_name: string } => item !== null)
            permissionListLoaded.value = true
        } catch (error) {
            Logger.error('获取权限列表失败:', error)
            permissionList.value = []
        } finally {
            permissionListLoading.value = false
        }
    }

    const clearPermissionListCache = () => {
        permissionListLoaded.value = false
        permissionList.value = []
    }

    const appendMissingSelectedPermissions = (selectedIds: number[]) => {
        const existedIds = new Set(permissionList.value.map((item) => String(item.id)))
        const missingItems = selectedIds
            .filter((id) => !existedIds.has(String(id)))
            .map((id) => ({
                id,
                name: `[不可再绑定] 历史接口 #${id}`,
                route: '',
                method: '',
                display_name: `[不可再绑定] 历史接口 #${id}`,
            }))

        if (missingItems.length > 0) {
            permissionList.value = [...permissionList.value, ...missingItems]
        }
    }

    // 菜单级联选项
    const menuCascaderOptions = computed(() => {
        // 返回菜单列表用于级联选择器，需要排除当前菜单本身
        const currentId = formData.id
        const processMenuItem = (item: Menu): Menu => {
            const menuItem = { ...item }
            // 禁用当前菜单本身和按钮类型
            if (item.id === currentId || item.type === MENU_TYPE.BUTTON) {
                menuItem.disabled = true
            }
            if (Array.isArray(item.children) && item.children.length > 0) {
                menuItem.children = item.children.map((child: Menu) => processMenuItem(child))
            }
            return menuItem
        }
        const filterMenu = (menus: unknown): Menu[] => {
            if (!Array.isArray(menus)) return []
            return menus.filter((menu) => menu.id !== currentId).map((menu) => processMenuItem(menu))
        }
        // 添加顶级菜单选项
        const topMenuOption: Menu = {
            ...createMenuForm(),
            id: 0,
            parent_id: 0,
            title: '顶级菜单',
        }
        return [topMenuOption, ...filterMenu(menuList.value)]
    })

    const loadMenuList = async () => {
        try {
            const response = await getMenuList()
            const result = normalizeListData<Menu>(response)
            menuList.value = result.list
        } catch (error) {
            Logger.error('获取菜单列表失败:', error)
            menuList.value = []
        }
    }

    const resetFormData = () => {
        Object.assign(formData, initialFormData)
        formDataRef.value?.clearValidate()
    }

    let numericValue: number = 0
    const handleAnimateDurationChange = (value: string | number, decimal = 2) => {
        const val = String(value).replace(/^(0+)(?=\d)/, '')
        formData.animate_duration = Number(val)

        if (value === '') {
            formData.animate_duration = 0
            return
        }

        if (checkNumber(value, decimal)) {
            numericValue = Number(val)
            return true
        }

        formData.animate_duration = numericValue
        return false
    }

    const handlePathChange = (val: string) => {
        const isExternalLink = val.startsWith('http://') || val.startsWith('https://')
        formData.is_external_links = isExternalLink ? MENU_SWITCH_VALUE.YES : MENU_SWITCH_VALUE.NO
    }

    const editFormRules = {
        title: [
            { required: true, message: '名称不能为空', trigger: 'blur' },
            { min: 1, max: 12, message: '名称不超过 12 个字符', trigger: 'blur' },
        ],
        parent_id: [
            {
                required: true,
                message: '上级菜单不能为空',
                trigger: 'blur',
                validator: (_rule: unknown, value: unknown, callback: (error?: Error) => void) => {
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
        path: [{ trigger: 'blur', validator: (_rule: unknown, _value: unknown, callback: () => void) => callback() }],
        name: [
            {
                trigger: 'blur',
                validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
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
                validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
                    if (formData.type === MENU_TYPE.MENU && formData.is_external_links !== MENU_SWITCH_VALUE.YES && !value) {
                        callback(new Error('请输入组件路径'))
                    }
                    if (value) {
                        if (value.startsWith('/')) {
                            callback(new Error('组件路径不能以 / 开头'))
                        }
                        if (!/^[a-zA-Z0-9/._-]+$/.test(value)) {
                            callback(new Error('组件路径只能包含字母、数字、/、.、_、-'))
                        }
                    }
                    callback()
                },
            },
        ],
        code: [
            {
                trigger: 'blur',
                validator: (_rule: unknown, value: string, callback: (error?: Error) => void) => {
                    if (formData.type === MENU_TYPE.BUTTON && !value) {
                        callback(new Error('请输入权限标识'))
                    }
                    callback()
                },
            },
        ],
    }

    const handleStepChange = async (targetStep: number) => {
        if (targetStep === MENU_STEP.PERMISSION) {
            try {
                await formDataRef.value?.validate()
                step.value = targetStep
                if (!permissionListLoaded.value || permissionList.value.length === 0) {
                    await fetchPermissionList()
                }
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
        await runWithSubmitLock(async () => {
            const submitData: Record<string, unknown> = { ...formData }

            // 按钮类型：清空路由、组件、动画相关字段
            if (formData.type === MENU_TYPE.BUTTON) {
                submitData.name = ''
                submitData.path = ''
                submitData.redirect = ''
                submitData.component = ''
                submitData.is_show = MENU_SWITCH_VALUE.NO
                submitData.is_auth = MENU_SWITCH_VALUE.YES
                submitData.animate_duration = 0
                submitData.animate_enter = ''
                submitData.animate_leave = ''
            } else {
                // 非按钮类型：不需要权限标识字段
                submitData.code = ''
            }

            if (Number(submitData.id) > 0) {
                await updateMenu(submitData)
            } else {
                await createMenu(submitData)
            }
            ElMessage.success('操作成功')
            await getList()
            showDrawer.value = false
        }).catch((error) => {
            Logger.error('提交失败:', error)
        })
    }

    const closeDrawer = () => {
        showDrawer.value = false
        isParentFixed.value = false
    }

    const handleCancel = () => {
        if (Number(formData.id) > 0) {
            ElMessageBox.confirm(getDrawerExitConfirmMessage(formTitle.value), CONFIRM_DIALOG_TITLE)
                .then(() => closeDrawer())
                .catch(() => {
                    // 取消操作
                })
        } else {
            closeDrawer()
        }
    }

    const handleDrawerClose = (done: () => void) => {
        if (Number(formData.id) > 0) {
            ElMessageBox.confirm(getDrawerExitConfirmMessage(formTitle.value), CONFIRM_DIALOG_TITLE)
                .then(() => {
                    isParentFixed.value = false
                    done()
                })
                .catch(() => {
                    // 取消操作
                })
        } else {
            isParentFixed.value = false
            done()
        }
    }

    const loadMenuDetail = async (menuId: number, index: number) => {
        const loadingInstance = ElLoading.service({
            lock: true,
            text: '加载中...',
            background: 'rgba(0, 0, 0, 0.7)',
        })

        try {
            const response = await getMenuDetail({ id: menuId })
            const menuDetail = normalizeDetailData<Menu>(response, {} as Menu)
            if (menuDetail) {
                Object.assign(formData, pick(menuDetail, Object.keys(initialFormData) as Array<keyof typeof initialFormData>))
                // 确保 parent_id 正确设置（API 可能返回 pid 而不是 parent_id）
                if (menuDetail.pid !== undefined && menuDetail.parent_id === undefined) {
                    formData.parent_id = menuDetail.pid
                }
                const rawPermissionSelection = menuDetail.api_list ?? menuDetail.api_ids ?? menuDetail.permission_ids ?? menuDetail.permission_list
                formData.api_list = normalizePermissionSelection(rawPermissionSelection).reduce<number[]>((result, item) => {
                    const numericId = typeof item === 'number' ? item : Number(item)
                    if (!Number.isNaN(numericId)) {
                        result.push(numericId)
                    }
                    return result
                }, [])
                appendMissingSelectedPermissions(formData.api_list)
                currentIndex.value = index
                showDrawer.value = true
            } else {
                throw new Error('获取的数据无效')
            }
        } catch (error) {
            ElMessage.error('获取菜单详情失败')
            Logger.error(error)
        } finally {
            loadingInstance.close()
        }
    }

    const openEditDrawer = async (type: number, row?: Partial<Menu>, index?: number, fixedParentId: number | string | null = null) => {
        if (typeof type !== 'number' || ![MENU_OPERATION_TYPE.ADD, MENU_OPERATION_TYPE.EDIT].includes(type)) {
            return
        }

        if (type === MENU_OPERATION_TYPE.EDIT && (!row || typeof row.id !== 'number')) {
            ElMessage.error('无效的行数据')
            return
        }

        resetFormData()
        step.value = MENU_STEP.BASIC_INFO

        // 加载菜单列表用于级联选择器
        await loadMenuList()

        // 预加载权限列表（只加载一次）
        await fetchPermissionList()

        if (type === MENU_OPERATION_TYPE.EDIT && row) {
            formTitle.value = '编辑菜单'
            isParentFixed.value = false
            await loadMenuDetail(Number(row.id), index ?? 0)
        } else {
            formTitle.value = '新增菜单'
            if (fixedParentId !== null) {
                formData.parent_id = fixedParentId
                isParentFixed.value = true
            } else {
                isParentFixed.value = false
            }
            showDrawer.value = true
        }
    }

    const handleAddChild = (parentRow: Menu) => {
        if (!parentRow || typeof parentRow.id !== 'number') {
            ElMessage.error('无效的行数据')
            return
        }
        openEditDrawer(MENU_OPERATION_TYPE.ADD, undefined, 0, parentRow.id)
    }

    const handleDelete = async (row: Menu) => {
        try {
            await ElMessageBox.confirm(CONFIRM_MESSAGES.DELETE_MENU, CONFIRM_DIALOG_TITLE, {
                confirmButtonText: CONFIRM_BUTTON_TEXT,
                cancelButtonText: CANCEL_BUTTON_TEXT,
                beforeClose: async (action, instance, done) => {
                    if (action === 'confirm') {
                        instance.confirmButtonLoading = true
                        instance.confirmButtonText = '删除中...'
                        try {
                            await deleteMenu({ id: row.id })
                            ElMessage.success(RESULT_MESSAGES.DELETE_SUCCESS)
                            await getList()
                            done()
                        } catch (error) {
                            Logger.error('删除失败:', error)
                            instance.confirmButtonLoading = false
                            instance.confirmButtonText = CONFIRM_BUTTON_TEXT
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

    const filterPermission = (query: string, item: { name?: string; route?: string; method?: string; display_name?: string }) => {
        const keyword = query.toLowerCase()
        return item.name?.toLowerCase().includes(keyword) || item.route?.toLowerCase().includes(keyword) || item.method?.toLowerCase().includes(keyword) || item.display_name?.toLowerCase().includes(keyword)
    }

    // 需要从 useMenuList 获取 menuList
    const menuList = ref<Menu[]>([])

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
        menuCascaderOptions,
        permissionListLoading,
        permissionList,
        handleAnimateDurationChange,
        handlePathChange,
        handleStepChange,
        handleSubmit,
        handleCancel,
        handleDrawerClose,
        openEditDrawer,
        handleAddChild,
        handleDelete,
        filterPermission,
        clearPermissionListCache,
    }
}
