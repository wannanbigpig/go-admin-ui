import { reactive, ref, type Ref } from 'vue'
import { createPaginationState, type PaginationState } from '@/modules/shared/pagination'
import { fetchAdminUserFullEmail, fetchAdminUserFullPhone, fetchAdminUserList } from '@/modules/adminUser/service'
import { fetchDepartmentList } from '@/modules/department/service'
import { filterNullUndefined, flattenTree } from '@/utils/helper'
import type { AdminUser } from '@/types/adminUser'
import type { FormInstance } from 'element-plus'

export function useAdminUserList() {
    const loading = ref(false)
    const adminUserList = ref([]) as Ref<AdminUser[]>
    const departmentOptions = ref<{ label: string; value: string | number }[]>([])
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive({
        page: 1,
        per_page: 10,
        username: undefined as string | undefined,
        phone_number: undefined as string | undefined,
        status: undefined as number | undefined,
        email: undefined as string | undefined,
        dept_id: null as number | null,
    })

    const getDepartmentOptions = async () => {
        try {
            const departmentData = await fetchDepartmentList()
            // flattenTree 返回的数据已经包含 label 和 value 属性
            departmentOptions.value = Array.isArray(departmentData) ? (flattenTree(departmentData as unknown as Record<string, unknown>[]) as Array<{ label: string; value: any }>) : []
        } catch (error) {
            console.error('获取部门列表失败:', error)
        }
    }

    const getList = async () => {
        loading.value = true

        try {
            const filteredParams = {
                ...queryWhere,
                username: queryWhere.username?.trim() || undefined,
                page: pagination.page,
                per_page: pagination.pageSize,
            }

            const result = await fetchAdminUserList(filterNullUndefined(filteredParams))
            pagination.total = result.total
            pagination.page = result.page
            pagination.pageSize = result.pageSize
            adminUserList.value = result.list
        } catch (error) {
            console.error('获取管理员列表失败:', error)
        } finally {
            loading.value = false
        }
    }

    const pagination: PaginationState = createPaginationState(() => getList(), {
        page: queryWhere.page,
        pageSize: queryWhere.per_page,
    })

    const handleSearch = () => {
        pagination.page = 1
        queryWhere.page = 1
        getList()
    }

    const createToggleFullInfo = (field: string, oldField: string, fetchFn: (id: string | number) => Promise<Record<string, unknown>>) => {
        return (row: AdminUser) => {
            const r = row as AdminUser & Record<string, unknown>
            const showField = `showFull${field.charAt(0).toUpperCase() + field.slice(1)}`
            r[showField] = !r[showField]

            const swapValues = () => {
                const oldValue = r[oldField]
                r[oldField] = r[field]
                r[field] = oldValue
            }

            if (r[showField]) {
                if (r[oldField] === undefined) {
                    r[oldField] = r[field]
                    fetchFn(r.id).then((detail) => {
                        r[field] = detail[field]
                    })
                } else {
                    swapValues()
                }
            } else {
                swapValues()
            }
        }
    }

    return {
        loading,
        adminUserList,
        departmentOptions,
        queryFormRef,
        queryWhere,
        pagination,
        getList,
        getDepartmentOptions,
        handleSearch,
        createToggleFullInfo,
        fetchAdminUserFullPhone,
        fetchAdminUserFullEmail,
    }
}
