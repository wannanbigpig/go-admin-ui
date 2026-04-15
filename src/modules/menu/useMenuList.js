import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { fetchMenuTree } from '@/modules/permission/service'
import { createMenuQuery, createSelectableMenuTree } from '@/modules/menu/model'
import { filterNullUndefined } from '@/utils/helper'

export function useMenuList(tableListRef) {
    const loading = ref(true)
    const menuList = ref([])
    const selectMenuList = ref([])
    const isExpanded = ref(false)
    const queryFormRef = ref(null)
    const queryWhere = reactive(createMenuQuery())

    const getList = async () => {
        loading.value = true
        try {
            menuList.value = await fetchMenuTree(filterNullUndefined(queryWhere))
        } catch (error) {
            console.error('获取菜单列表失败:', error)
            ElMessage.error('获取菜单列表失败')
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

    const getSelectMenuList = (currentMenuId) => {
        selectMenuList.value = createSelectableMenuTree(menuList.value.slice(), currentMenuId)
        return selectMenuList.value
    }

    return {
        loading,
        menuList,
        queryFormRef,
        queryWhere,
        isExpanded,
        getList,
        handleSearch,
        handleToggleExpand,
        getSelectMenuList,
    }
}
