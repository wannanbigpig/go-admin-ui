import { ref } from 'vue'
import { applyPaginationResult, createPaginationState, syncQueryPagination } from '@/modules/shared/pagination'

export function useListPage({ query, fetcher, transformParams } = {}) {
    const loading = ref(false)
    const items = ref([])

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

    const pagination = createPaginationState(runFetch, {
        page: query?.page ?? 1,
        pageSize: query?.per_page ?? 10,
    })

    const handleSearch = async () => {
        pagination.page = 1
        query.page = 1
        query.per_page = pagination.pageSize
        return runFetch()
    }

    return {
        loading,
        items,
        pagination,
        getList: runFetch,
        handleSearch,
    }
}
