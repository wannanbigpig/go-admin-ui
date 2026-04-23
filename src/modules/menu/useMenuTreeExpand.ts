import { nextTick, ref, type Ref } from 'vue'
import type { Menu } from '@/types/menu'

type MenuTableRef = {
    toggleRowExpansion: (row: Menu, expanded?: boolean) => void
} | null

interface UseMenuTreeExpandOptions {
    menuList: Ref<Menu[]>
    tableListRef: Ref<MenuTableRef>
}

export function useMenuTreeExpand(options: UseMenuTreeExpandOptions) {
    const isExpanded = ref(false)

    const toggleMenuRowsExpansion = (rows: Menu[], expanded: boolean) => {
        rows.forEach((row) => {
            if (!Array.isArray(row.children) || row.children.length === 0) {
                return
            }

            options.tableListRef.value?.toggleRowExpansion(row, expanded)
            toggleMenuRowsExpansion(row.children, expanded)
        })
    }

    const handleToggleExpand = async () => {
        const nextExpandedState = !isExpanded.value
        await nextTick()
        toggleMenuRowsExpansion(options.menuList.value, nextExpandedState)
        isExpanded.value = nextExpandedState
    }

    const resetExpanded = () => {
        isExpanded.value = false
    }

    return {
        isExpanded,
        handleToggleExpand,
        resetExpanded,
    }
}
