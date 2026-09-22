import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/utils/request', () => ({ get: mocks.get }))

import { getDashboardPersonal, getDashboardStatistics } from './dashboard'

describe('dashboard api contract', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('uses the access-token-scoped personal endpoint', async () => {
        mocks.get.mockResolvedValue({ activities: [] })

        await getDashboardPersonal()

        expect(mocks.get).toHaveBeenCalledWith('/v1/dashboard/personal')
    })

    it('passes the selected inclusive date range to the statistics endpoint', async () => {
        const params = { start_date: '2026-09-01', end_date: '2026-09-17' }

        await getDashboardStatistics(params)

        expect(mocks.get).toHaveBeenCalledWith('/v1/dashboard/statistics', params)
    })
})
