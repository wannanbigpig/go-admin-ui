import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useListPage } from '@/composables/useListPage'

vi.mock('@/utils/logger', () => ({
    Logger: {
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    },
}))

interface TestItem {
    id: number
    name: string
}

describe('composables/useListPage.ts', () => {
    it('getList 应写入 items 与分页信息', async () => {
        const query = reactive({
            page: 1,
            per_page: 10,
            keyword: '',
        })

        const fetcher = vi.fn(async (params: typeof query) => {
            return {
                list: [{ id: 1, name: 'item-1' }],
                total: 20,
                page: params.page,
                pageSize: params.per_page,
            }
        })

        const { items, pagination, getList } = useListPage<TestItem, typeof query>({
            query,
            fetcher,
            delayFirstFetch: false,
        })

        await getList()

        expect(fetcher).toHaveBeenCalledTimes(1)
        expect(items.value).toEqual([{ id: 1, name: 'item-1' }])
        expect(pagination.total).toBe(20)
        expect(pagination.page).toBe(1)
        expect(pagination.pageSize).toBe(10)
    })

    it('handleSearch 应重置页码并触发请求', async () => {
        const query = reactive({
            page: 3,
            per_page: 20,
            keyword: 'abc',
        })

        const fetcher = vi.fn(async (params: typeof query) => {
            return {
                list: [],
                total: 0,
                page: params.page,
                pageSize: params.per_page,
            }
        })

        const { pagination, handleSearch } = useListPage<TestItem, typeof query>({
            query,
            fetcher,
            delayFirstFetch: false,
        })

        await handleSearch()

        expect(pagination.page).toBe(1)
        expect(query.page).toBe(1)
        expect(fetcher).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 1,
                per_page: 20,
            })
        )
    })

    it('应支持 transformParams 与 handleReset', async () => {
        const query = reactive({
            page: 2,
            per_page: 10,
            keyword: '  test  ',
        })

        const fetcher = vi.fn(async (params: typeof query) => {
            return {
                list: [],
                total: 1,
                page: params.page,
                pageSize: params.per_page,
            }
        })

        const { handleReset } = useListPage<TestItem, typeof query>({
            query,
            fetcher,
            defaultQuery: {
                page: 1,
                per_page: 10,
                keyword: '',
            },
            transformParams: (currentQuery) => ({
                ...currentQuery,
                keyword: currentQuery.keyword.trim(),
            }),
            delayFirstFetch: false,
        })

        await handleReset()

        expect(query.keyword).toBe('')
        expect(fetcher).toHaveBeenCalledWith(
            expect.objectContaining({
                keyword: '',
            })
        )
    })

    it('fetcher 抛错时应回退到空页结果，并触发 onError', async () => {
        const query = reactive({ page: 1, per_page: 10 })
        const fetcher = vi.fn(async () => {
            throw new Error('boom')
        })
        const onError = vi.fn()

        const { items, pagination, getList } = useListPage<TestItem, typeof query>({
            query,
            fetcher,
            onError,
            delayFirstFetch: false,
        })

        await getList()

        expect(items.value).toEqual([])
        expect(pagination.total).toBe(0)
        expect(onError).toHaveBeenCalledTimes(1)
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error)
    })

    it('extraParams 应与 query 合并后传给 fetcher', async () => {
        const query = reactive({ page: 1, per_page: 10, keyword: 'k' })
        const fetcher = vi.fn(async () => ({ list: [], total: 0, page: 1, pageSize: 10 }))

        const { getList } = useListPage<TestItem, typeof query>({
            query,
            fetcher,
            extraParams: () => ({ start_at: '2026-01-01', end_at: '2026-12-31' }),
            delayFirstFetch: false,
        })

        await getList()

        expect(fetcher).toHaveBeenCalledWith(
            expect.objectContaining({
                keyword: 'k',
                start_at: '2026-01-01',
                end_at: '2026-12-31',
            })
        )
    })

    it('handleReset 支持 refetch:false 跳过重新加载', async () => {
        const query = reactive({ page: 1, per_page: 10, keyword: 'k' })
        const fetcher = vi.fn(async () => ({ list: [], total: 0, page: 1, pageSize: 10 }))

        const { handleReset } = useListPage<TestItem, typeof query>({
            query,
            fetcher,
            defaultQuery: { page: 1, per_page: 10, keyword: '' },
            delayFirstFetch: false,
        })

        await handleReset({ refetch: false })

        expect(query.keyword).toBe('')
        expect(fetcher).not.toHaveBeenCalled()
    })

    it('当 fetcher 返回数据缺少 page 和 pageSize 字段时，分页交互后状态应正确保留且不被重置', async () => {
        const query = reactive({ page: 1, per_page: 10 })
        // 模拟接口响应只有 list 和 total，不提供 page 和 pageSize
        const fetcher = vi.fn(async () => ({
            list: [],
            total: 20,
        }))

        const { pagination } = useListPage<TestItem, typeof query>({
            query,
            fetcher,
            delayFirstFetch: false,
        })

        // 默认第一页
        expect(pagination.page).toBe(1)
        expect(pagination.pageSize).toBe(10)

        // 触发下一页点击
        await pagination.pageChange(2)

        // 校验请求发送了 page=2 的参数
        expect(fetcher).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 2,
                per_page: 10,
            })
        )

        // 校验在 fetch 成功后，因后端无 page 返回，前端状态应当保留为刚才点击设定的 2，不被重置为 1
        expect(pagination.page).toBe(2)
        expect(pagination.pageSize).toBe(10)

        // 触发每页条数改变为 20（应重置页码为 1）
        await pagination.pageSizeChange(20)

        // 校验请求发送了 per_page=20, page=1 的参数
        expect(fetcher).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 1,
                per_page: 20,
            })
        )

        // 校验在 fetch 成功后，前端状态应当保留为 1 和 20
        expect(pagination.page).toBe(1)
        expect(pagination.pageSize).toBe(20)
    })
})
