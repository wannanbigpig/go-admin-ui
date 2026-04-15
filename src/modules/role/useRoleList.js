import { reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { createPaginationState } from '@/modules/shared/pagination'
import { fetchRolePage, fetchRoleTree } from '@/modules/permission/service'
import { createRoleQuery, processRoleTreeData } from '@/modules/role/model'
import { filterNullUndefined } from '@/utils/helper'

export function useRoleList(tableListRef) {
    const loading = ref(false)
    const roleList = ref([])
    const queryFormRef = ref(null)
    const queryWhere = reactive(createRoleQuery())

    const getList = async () => {
        loading.value = true

        try {
            const filteredParams = {
                ...queryWhere,
                name: queryWhere.name?.trim() || undefined,
                pid: queryWhere.pid ?? 0,
                page: pagination.page,
                per_page: pagination.pageSize,
            }

            const result = await fetchRolePage(filterNullUndefined(filteredParams))
            pagination.total = result.total
            pagination.page = result.page
            pagination.pageSize = result.pageSize
            roleList.value = processRoleTreeData(result.list || [])
        } catch (error) {
            console.error('获取角色列表失败:', error)
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

    const updateTableTree = (parentId, nodes) => {
        if (!tableListRef.value?.tableRef) return

        const tableRef = tableListRef.value.tableRef
        const store = tableRef.store

        if (store?.states?.lazyTreeNodeMap?.value) {
            store.states.lazyTreeNodeMap.value[parentId] = nodes
        }
    }

    const refreshParentNodeChildren = async (parentId) => {
        if (!parentId || parentId === 0) {
            await getList()
            return
        }

        try {
            const children = await fetchRoleTree({
                pid: parentId,
                page: 1,
                per_page: 9999,
            })

            const processedChildren = processRoleTreeData(children)
            updateTableTree(parentId, processedChildren)

            const findParentNode = (nodes, targetId) => {
                for (const node of nodes) {
                    if (node.id === targetId) {
                        return node
                    }
                    if (node.children && node.children.length > 0) {
                        const found = findParentNode(node.children, targetId)
                        if (found) return found
                    }
                }
                return null
            }

            const parentNode = findParentNode(roleList.value, parentId)
            if (parentNode) {
                parentNode.children_num = processedChildren.length
                parentNode.hasChildren = processedChildren.length > 0
            }
        } catch (error) {
            console.error('刷新父节点子节点失败:', error)
        }
    }

    const loadChildren = async (tree, treeNode, resolve) => {
        try {
            const parentId = tree.id
            if (!parentId) {
                resolve([])
                return
            }

            const children = await fetchRoleTree({
                pid: parentId,
                page: 1,
                per_page: 9999,
            })

            resolve(processRoleTreeData(children))
        } catch (error) {
            console.error('加载子节点失败:', error)
            ElMessage.error('加载子节点失败')
            resolve([])
        }
    }

    return {
        loading,
        roleList,
        queryFormRef,
        queryWhere,
        pagination,
        getList,
        handleSearch,
        loadChildren,
        refreshParentNodeChildren,
    }
}
