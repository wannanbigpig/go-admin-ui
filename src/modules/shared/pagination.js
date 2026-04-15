import { reactive } from 'vue'

export function createPaginationState(fetcher, initial = {}) {
    const pagination = reactive({
        total: initial.total ?? 0,
        page: initial.page ?? 1,
        pageSize: initial.pageSize ?? 10,
        pageSizeChange: (value) => {
            pagination.pageSize = value
            pagination.page = 1
            if (typeof fetcher === 'function') {
                fetcher()
            }
        },
        pageChange: (value) => {
            pagination.page = value
            if (typeof fetcher === 'function') {
                fetcher()
            }
        },
    })

    return pagination
}

export function applyPaginationResult(target, data = {}) {
    target.total = Number(data.total ?? 0)
    target.page = Number(data.page ?? 1)
    target.pageSize = Number(data.pageSize ?? 10)
}

export function syncQueryPagination(query, pagination) {
    query.page = pagination.page
    query.per_page = pagination.pageSize
}
