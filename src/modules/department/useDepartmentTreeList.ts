import { ref, shallowRef, reactive } from 'vue'
import { Logger } from '@/utils/logger'
import { fetchDepartmentList } from '@/modules/department/service'
import { flattenDepartmentTree } from '@/modules/department/model'
import type { Department } from '@/types/department'
import type { FormInstance } from 'element-plus'

export function useDepartmentTreeList(_tableListRef: unknown) {
    const loading = ref(false)
    const departmentList = shallowRef<Department[]>([])
    const departmentOptions = shallowRef<(Department & { label: string })[]>([])
    const queryFormRef = ref<FormInstance>()
    const queryWhere = reactive({
        name: '',
    })

    const getList = async () => {
        loading.value = true
        try {
            const deptData = await fetchDepartmentList(queryWhere)
            if (Array.isArray(deptData)) {
                departmentList.value = deptData
                departmentOptions.value = flattenDepartmentTree(deptData)
            }
        } catch (error) {
            Logger.error('获取部门列表失败:', error)
        } finally {
            loading.value = false
        }
    }

    const handleSearch = () => {
        getList()
    }

    const handleReset = () => {
        if (queryFormRef.value) {
            queryFormRef.value.resetFields()
        }
        getList()
    }

    const getChildrenIds = (deptId: number | string): (number | string)[] => {
        const result: (number | string)[] = [deptId]
        const findChildren = (pid: number | string) => {
            departmentList.value.forEach((dept) => {
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
        getList,
        handleSearch,
        handleReset,
        getChildrenIds,
    }
}
