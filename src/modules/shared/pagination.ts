import { reactive } from 'vue'

export interface PaginationState {
    total: number
    page: number
    pageSize: number
    pageSizeChange: (value: number) => void
    pageChange: (value: number) => void
}

export function createPaginationState(fetcher: () => void, initial: any = {}): PaginationState {
    const pagination = reactive({
        total: initial.total ?? 0,
        page: initial.page ?? 1,
        pageSize: initial.pageSize ?? 10,
        pageSizeChange: (value: number) => {
            pagination.pageSize = value
            pagination.page = 1
            if (typeof fetcher === 'function') {
                fetcher()
            }
        },
        pageChange: (value: number) => {
            pagination.page = value
            if (typeof fetcher === 'function') {
                fetcher()
            }
        },
    })

    return pagination
}

export function applyPaginationResult(target: any, data: any = {}) {
    target.total = Number(data.total ?? 0)
    target.page = Number(data.page ?? 1)
    target.pageSize = Number(data.pageSize ?? 10)
}

export function syncQueryPagination(query: any, pagination: any) {
    query.page = pagination.page
    query.per_page = pagination.pageSize
}
