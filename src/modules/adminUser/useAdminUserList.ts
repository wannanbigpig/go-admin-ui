import { reactive, ref, type Ref } from 'vue'
import { createPaginationState, type PaginationState } from '@/modules/shared/pagination'
import { createAdminUserQuery } from '@/modules/adminUser/model'
import { fetchAdminUserFullEmail, fetchAdminUserFullPhone, fetchAdminUserList } from '@/modules/adminUser/service'
import { fetchDepartmentList } from '@/modules/department/service'
import { filterNullUndefined, flattenTree } from '@/utils/helper'
import type { AdminUser, AdminUserQuery } from '@/types/adminUser'
import type { FormInstance } from 'element-plus'

export function useAdminUserList() {
    const loading = ref(false)
    const adminUserList = ref([]) as Ref<AdminUser[]>
    const departmentOptions = ref<{ label: string; value: string | number }[]>([])
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive(createAdminUserQuery()) as AdminUserQuery & { page?: number; per_page?: number }

    const getDepartmentOptions = async () => {
        try {
            const departmentData = await fetchDepartmentList()
            // 假设 flattenTree 处理后返回符合 el-select options 格式的数据
            departmentOptions.value = Array.isArray(departmentData)
                ? flattenTree(departmentData).map((d: any) => ({
                      label: d.name,
                      value: d.id,
                  }))
                : []
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

    const createToggleFullInfo = (field: string, oldField: string, fetchFn: (id: string | number) => Promise<any>) => {
        return (row: any) => {
            const showField = `showFull${field.charAt(0).toUpperCase() + field.slice(1)}`
            row[showField] = !row[showField]

            const swapValues = () => {
                const oldValue = row[oldField]
                row[oldField] = row[field]
                row[field] = oldValue
            }

            if (row[showField]) {
                if (row[oldField] === undefined) {
                    row[oldField] = row[field]
                    fetchFn(row.id).then((detail) => {
                        row[field] = detail[field]
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
