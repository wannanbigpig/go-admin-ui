import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/utils/request', () => ({ get: mocks.get }))

import { getDashboardPersonal } from './dashboard'

describe('personal dashboard API contract', () => {
    beforeEach(() => {
        mocks.get.mockReset()
    })

    it('uses the access-token-scoped personal endpoint', async () => {
        mocks.get.mockResolvedValue({ activities: [] })

        await getDashboardPersonal()

        expect(mocks.get).toHaveBeenCalledWith('/v1/dashboard/personal')
    })
})
