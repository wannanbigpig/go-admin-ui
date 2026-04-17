import { ref, type Ref } from 'vue'
import { applyPaginationResult, createPaginationState, syncQueryPagination, type PaginationState } from '@/modules/shared/pagination'
import type { FormInstance } from 'element-plus'

interface UseListPageOptions<T, Q> {
    query: Q & { page?: number; per_page?: number }
    fetcher: (params: Q) => Promise<{ list: T[]; total: number; page: number; pageSize: number }>
    transformParams?: (query: Q) => any
    queryFormRef?: Ref<FormInstance | undefined>
    defaultQuery?: Partial<Q>
}

export function useListPage<T = any, Q = any>({ query, fetcher, transformParams, queryFormRef, defaultQuery }: UseListPageOptions<T, Q>) {
    const loading = ref(false)
    const items = ref([]) as Ref<T[]>

    const runFetch = async () => {
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

    const pagination: PaginationState = createPaginationState(runFetch, {
        page: query?.page ?? 1,
        pageSize: query?.per_page ?? 10,
    })

    const handleSearch = async () => {
        pagination.page = 1
        query.page = 1
        query.per_page = pagination.pageSize
        return runFetch()
    }

    const handleReset = async () => {
        if (queryFormRef?.value) {
            queryFormRef.value.resetFields()
        }

        if (defaultQuery) {
            Object.assign(query, defaultQuery)
        }

        return handleSearch()
    }

    return {
        loading,
        items,
        pagination,
        getList: runFetch,
        handleSearch,
        handleReset,
    }
}
