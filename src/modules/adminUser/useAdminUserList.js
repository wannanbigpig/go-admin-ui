import { reactive, ref } from 'vue'
import { createPaginationState } from '@/modules/shared/pagination'
import { createAdminUserQuery } from '@/modules/adminUser/model'
import { fetchAdminUserFullEmail, fetchAdminUserFullPhone, fetchAdminUserPage } from '@/modules/adminUser/service'
import { fetchDepartmentTree } from '@/modules/department/service'
import { filterNullUndefined, flattenTree } from '@/utils/helper'

export function useAdminUserList() {
    const loading = ref(false)
    const adminUserList = ref([])
    const departmentOptions = ref([])
    const queryFormRef = ref(null)
    const queryWhere = reactive(createAdminUserQuery())

    const getDepartmentOptions = async () => {
        try {
            const departmentData = await fetchDepartmentTree()
            departmentOptions.value = Array.isArray(departmentData) ? flattenTree(departmentData) : []
        } catch (error) {
            console.error('获取部门列表失败:', error)
        }
    }

    const getList = async () => {
        loading.value = true

        try {
            const filteredParams = {
                ...queryWhere,
                phone_number: queryWhere.phone_number?.trim() || undefined,
                username: queryWhere.username?.trim() || undefined,
                email: queryWhere.email?.trim() || undefined,
                page: pagination.page,
                per_page: pagination.pageSize,
            }

            const result = await fetchAdminUserPage(filterNullUndefined(filteredParams))
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

    const pagination = createPaginationState(() => getList(), {
        page: queryWhere.page,
        pageSize: queryWhere.per_page,
    })

    const handleSearch = () => {
        pagination.page = 1
        queryWhere.page = 1
        getList()
    }

    const createToggleFullInfo = (field, oldField, fetchFn) => {
        return (row) => {
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
