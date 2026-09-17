import { reactive, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    adminList: vi.fn(),
    adminDetail: vi.fn(),
    selfList: vi.fn(),
    selfDetail: vi.fn(),
}))

vi.mock('vue-router', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-router')>()),
    useRouter: () => ({ push: vi.fn() }),
}))
vi.mock('vue-i18n', async (importOriginal) => ({
    ...(await importOriginal<typeof import('vue-i18n')>()),
    useI18n: () => ({ t: (key: string) => key }),
}))
vi.mock('@/modules/log/service', () => ({
    fetchRequestLogList: mocks.adminList,
    fetchRequestLogDetail: mocks.adminDetail,
    fetchSelfRequestLogList: mocks.selfList,
    fetchSelfRequestLogDetail: mocks.selfDetail,
}))
vi.mock('@/modules/exportCenter/useExportTaskSubmitter', () => ({ useExportTaskSubmitter: () => ({ submitExportTask: vi.fn() }) }))
vi.mock('@/composables/useListPage', () => ({
    useListPage: ({
        fetcher,
        query,
        transformParams,
    }: {
        fetcher: (params: Record<string, unknown>) => Promise<unknown>
        query: Record<string, unknown>
        transformParams: (params: Record<string, unknown>) => Record<string, unknown>
    }) => ({
        loading: ref(false),
        items: ref([]),
        pagination: reactive({ page: 1, pageSize: 10, total: 0 }),
        getList: () => fetcher(transformParams({ ...query, page: 1, per_page: 10 })),
        handleSearch: vi.fn(),
        handleReset: vi.fn(),
    }),
}))

import { createRequestLogQuery } from '@/modules/log/model'
import { buildRequestLogQueryParams, useRequestLogPage } from '@/modules/log/useRequestLogPage'
import type { RequestLog } from '@/types/log'

describe('modules/log/useRequestLogPage query contract', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.adminList.mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 })
        mocks.selfList.mockResolvedValue({ list: [], total: 0, page: 1, pageSize: 10 })
        mocks.adminDetail.mockResolvedValue({ id: 1 })
        mocks.selfDetail.mockResolvedValue({ id: 1 })
    })

    it('keeps the data-change-only filter in the shared list/export query', () => {
        const query = {
            ...createRequestLogQuery(),
            has_change_diff: 1,
        }

        const params = buildRequestLogQueryParams(query, ['2026-09-01 00:00:00', '2026-09-16 23:59:59'])

        expect(params).toEqual(
            expect.objectContaining({
                has_change_diff: 1,
                start_time: new Date('2026-09-01 00:00:00').toISOString(),
                end_time: new Date('2026-09-16 23:59:59').toISOString(),
            })
        )
        expect(query.start_time).toBeNull()
    })

    it('uses the self-scoped list and detail services in self mode', async () => {
        const page = useRequestLogPage({ mode: 'self' })

        await page.getList()
        await page.openDetailDrawer({ id: 12 } as RequestLog)

        expect(mocks.selfList).toHaveBeenCalledTimes(1)
        expect(mocks.selfDetail).toHaveBeenCalledWith(12)
        expect(mocks.adminList).not.toHaveBeenCalled()
        expect(mocks.adminDetail).not.toHaveBeenCalled()
    })

    it('switches list and detail services when the reactive mode changes', async () => {
        const mode = ref<'admin' | 'self'>('admin')
        const page = useRequestLogPage({ mode })

        await page.getList()
        await page.openDetailDrawer({ id: 12 } as RequestLog)

        expect(mocks.adminList).toHaveBeenCalledTimes(1)
        expect(mocks.adminDetail).toHaveBeenCalledWith(12)

        mode.value = 'self'
        await page.getList()
        await page.openDetailDrawer({ id: 13 } as RequestLog)

        expect(mocks.selfList).toHaveBeenCalledTimes(1)
        expect(mocks.selfDetail).toHaveBeenCalledWith(13)
    })

    it('sends only personal filters with the default regular scope to the self-scoped list', async () => {
        const page = useRequestLogPage({ mode: 'self' })
        Object.assign(page.queryWhere, {
            request_id: 'request-1',
            base_url: '/admin/v1/users',
            operator_account: 'admin',
            ip: '127.0.0.1',
            is_high_risk: 1,
            has_change_diff: 1,
            method: 'POST',
            request_kind: 'http',
            execution_time_scope: 'request',
            operation_name: '更新用户',
            operation_status: 0,
            scope: null,
        })

        await page.getList()

        expect(mocks.selfList).toHaveBeenCalledWith({
            page: 1,
            per_page: 10,
            order_by: null,
            operation_name: '更新用户',
            operation_status: 0,
            ip: '127.0.0.1',
            scope: 'regular',
            start_time: null,
            end_time: null,
        })
    })
})
