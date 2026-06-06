import { nextTick, ref, type Ref } from 'vue'
import type { Department } from '@/types/department'

type DepartmentTableRef = {
    toggleRowExpansion: (row: Department, expanded?: boolean) => void
} | null

interface UseDepartmentTreeExpandOptions {
    departmentList: Ref<Department[]>
    tableListRef: Ref<DepartmentTableRef>
}

export function useDepartmentTreeExpand(options: UseDepartmentTreeExpandOptions) {
    // 页面初始化时 department.vue 的 xl-table-list 是默认全部展开的 (:default-expand-all="true")，
    // 因此 isExpanded 初始为 true。
    const isExpanded = ref(true)

    const toggleDepartmentRowsExpansion = (rows: Department[], expanded: boolean) => {
        rows.forEach((row) => {
            if (!Array.isArray(row.children) || row.children.length === 0) {
                return
            }

            options.tableListRef.value?.toggleRowExpansion(row, expanded)
            toggleDepartmentRowsExpansion(row.children, expanded)
        })
    }

    const handleToggleExpand = async () => {
        const nextExpandedState = !isExpanded.value
        await nextTick()
        toggleDepartmentRowsExpansion(options.departmentList.value, nextExpandedState)
        isExpanded.value = nextExpandedState
    }

    const resetExpanded = () => {
        isExpanded.value = true
    }

    return {
        isExpanded,
        handleToggleExpand,
        resetExpanded,
    }
}
