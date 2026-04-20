import { describe, expect, it, vi } from 'vitest'
import { reactive } from 'vue'
import { useListPage } from '@/composables/useListPage'

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
        })

        await handleReset()

        expect(query.keyword).toBe('')
        expect(fetcher).toHaveBeenCalledWith(
            expect.objectContaining({
                keyword: '',
            })
        )
    })
})
