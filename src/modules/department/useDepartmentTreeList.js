import { reactive, ref } from 'vue'
import { fetchDepartmentTree } from '@/modules/department/service'
import { createDepartmentQuery, flattenDepartmentTree } from '@/modules/department/model'
import { filterNullUndefined } from '@/utils/helper'

export function useDepartmentTreeList(tableListRef) {
    const loading = ref(false)
    const departmentList = ref([])
    const departmentOptions = ref([])
    const queryFormRef = ref(null)
    const queryWhere = reactive(createDepartmentQuery())
    const isExpanded = ref(true)

    const getList = async () => {
        loading.value = true

        try {
            const filteredParams = {
                ...queryWhere,
                name: queryWhere.name?.trim() || undefined,
            }

            const deptData = await fetchDepartmentTree(filterNullUndefined(filteredParams))
            if (Array.isArray(deptData)) {
                departmentList.value = deptData
                departmentOptions.value = flattenDepartmentTree(deptData)
            } else {
                departmentList.value = []
                departmentOptions.value = []
            }
        } catch (error) {
            console.error('获取部门列表失败:', error)
            departmentList.value = []
            departmentOptions.value = []
        } finally {
            loading.value = false
        }
    }

    const handleSearch = () => {
        getList()
    }

    const handleToggleExpand = () => {
        if (!tableListRef.value) return
        isExpanded.value = !isExpanded.value
        tableListRef.value.toggleAllRows(isExpanded.value)
    }

    const getChildrenIds = (deptId) => {
        const flatList = departmentOptions.value
        const result = [deptId]
        const findChildren = (pid) => {
            flatList.forEach((dept) => {
                if (dept.pid === pid) {
                    result.push(dept.id)
                    findChildren(dept.id)
                }
            })
        }
        findChildren(deptId)
        return result
    }

    return {
        loading,
        departmentList,
        departmentOptions,
        queryFormRef,
        queryWhere,
        isExpanded,
        getList,
        handleSearch,
        handleToggleExpand,
        getChildrenIds,
    }
}
