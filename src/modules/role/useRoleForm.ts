import { computed, nextTick, reactive, ref } from 'vue'
import { ElMessage, type FormInstance } from 'element-plus'
import { getRoleDetail, createRole, updateRole, getMenuList } from '@/api/permission'
import { createRoleDefault, ROLE_STATUS } from '@/modules/role/model'
import type { Role } from '@/types/role'
import type { Menu } from '@/types/menu'

interface UseRoleFormOptions {
    refreshList: () => Promise<any>
}

export function useRoleForm({ refreshList }: UseRoleFormOptions) {
    const showDrawer = ref(false)
    const formDataRef = ref<FormInstance>()
    const formTitle = ref('')
    const currentIndex = ref<number | null>(null)
    const isSubmitting = ref(false)

    const menuTreeRef = ref()
    const menuTreeData = ref<Menu[]>([])
    const menuTreeLoading = ref(false)

    const initialFormData = createRoleDefault()
    const formData = reactive({ ...initialFormData }) as any
    const originalFormData = ref<Role | null>(null)

    const isEditMode = computed(() => !!originalFormData.value)

    // 假设 'super_admin' 是超级管理员编码
    const isSuperAdminRole = (role: Role | null) => role?.code === 'super_admin'
    const isSuperAdminEditing = computed(() => isEditMode.value && isSuperAdminRole(originalFormData.value))

    const resetFormData = () => {
        Object.assign(formData, { ...createRoleDefault() })
        if (formDataRef.value) {
            formDataRef.value.clearValidate()
        }
    }

    const getMenuTreeData = async () => {
        menuTreeLoading.value = true
        try {
            const response = await getMenuList()
            menuTreeData.value = response.data
        } catch (error) {
            console.error('获取菜单列表失败:', error)
        } finally {
            menuTreeLoading.value = false
        }
    }

    const openEditDrawer = async (type: number, row?: Role, index?: number) => {
        resetFormData()
        currentIndex.value = index ?? null

        if (type === 2 && row) {
            formTitle.value = '编辑角色'
            try {
                const response = await getRoleDetail({ id: row.id })
                const roleData = response.data
                Object.assign(formData, {
                    id: roleData.id,
                    name: roleData.name || '',
                    code: roleData.code || '',
                    status: roleData.status ?? ROLE_STATUS.ENABLED,
                    remark: roleData.remark || '',
                    permission_ids: roleData.permission_ids || [],
                })
                originalFormData.value = JSON.parse(JSON.stringify(formData))

                await nextTick()
                if (menuTreeRef.value) {
                    menuTreeRef.value.setCheckedKeys(formData.permission_ids)
                }
            } catch (error) {
                console.error('获取角色详情失败:', error)
            }
        } else {
            formTitle.value = '新增角色'
            originalFormData.value = null
            await nextTick()
            if (menuTreeRef.value) {
                menuTreeRef.value.setCheckedKeys([])
            }
        }

        showDrawer.value = true
        if (menuTreeData.value.length === 0) {
            getMenuTreeData()
        }
    }

    const editConfirmSubmit = async () => {
        if (isSubmitting.value) return

        const valid = await formDataRef.value?.validate().catch(() => false)
        if (!valid) return

        isSubmitting.value = true
        try {
            // 获取选中的菜单节点
            const checkedKeys = menuTreeRef.value?.getCheckedKeys() || []
            const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || []
            formData.permission_ids = [...checkedKeys, ...halfCheckedKeys]

            if (isEditMode.value) {
                await updateRole(formData)
            } else {
                await createRole(formData)
            }

            await refreshList()
            showDrawer.value = false
            ElMessage.success(isEditMode.value ? '编辑成功' : '新增成功')
        } catch (error) {
            console.error('提交失败:', error)
        } finally {
            isSubmitting.value = false
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
        menuTreeData,
        menuTreeLoading,
        openEditDrawer,
        editConfirmSubmit,
    }
}
