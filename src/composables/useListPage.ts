import { ref, type Ref } from 'vue'
import { applyPaginationResult, createPaginationState, syncQueryPagination, type PaginationState } from '@/modules/shared/pagination'
import type { FormInstance } from 'element-plus'

interface PaginationQuery {
    page?: number
    per_page?: number
}

interface ListPageResult<T> {
    list: T[]
    total: number
    page: number
    pageSize: number
}

interface UseListPageOptions<T, Q extends Record<string, unknown> & PaginationQuery> {
    query: Q
    fetcher: (params: Q) => Promise<ListPageResult<T>>
    transformParams?: (query: Q) => Q
    queryFormRef?: Ref<FormInstance | undefined>
    defaultQuery?: Partial<Q>
}

/**
 * 通用列表页组合式函数，统一处理加载状态、分页、查询与重置逻辑。
 *
 * @param options 列表页配置项
 * @returns 列表数据、加载态、分页状态与列表操作方法
 */
export function useListPage<T = unknown, Q extends Record<string, unknown> & PaginationQuery = Record<string, unknown> & PaginationQuery>({
    query,
    fetcher,
    transformParams,
    queryFormRef,
    defaultQuery,
}: UseListPageOptions<T, Q>) {
    const loading = ref(false)
    const items = ref<T[]>([])

    const runFetch = async (): Promise<ListPageResult<T>> => {
        loading.value = true
        try {
            syncQueryPagination(query, pagination)
            const params = typeof transformParams === 'function' ? transformParams(query) : query
            const result = await fetcher(params)
            items.value = result.list
            applyPaginationResult(pagination, result)
            return result
        } finally {
            loading.value = false
        }
    }

    const getList = async () => {
        await runFetch()
    }

    const pagination: PaginationState = createPaginationState(runFetch, {
        page: query?.page ?? 1,
        pageSize: query?.per_page ?? 10,
    })

    const handleSearch = async () => {
        pagination.page = 1
        query.page = 1
        query.per_page = pagination.pageSize
        await runFetch()
    }

    const handleReset = async () => {
        if (queryFormRef?.value) {
            queryFormRef.value.resetFields()
        }

        if (defaultQuery) {
            Object.assign(query, defaultQuery)
        }

        await handleSearch()
    }

    return {
        loading,
        items,
        pagination,
        getList,
        handleSearch,
        handleReset,
    }
}
