import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ get: vi.fn() }))

vi.mock('@/utils/request', () => ({
    get: mocks.get,
    post: vi.fn(),
}))

import { getSelfRequestLogDetail, getSelfRequestLogList } from './log'

describe('personal request-log API contract', () => {
    beforeEach(() => {
        mocks.get.mockReset()
    })

    it('uses the access-token-scoped self list endpoint', async () => {
        mocks.get.mockResolvedValue({ data: [] })

        await getSelfRequestLogList({ page: 2 })

        expect(mocks.get).toHaveBeenCalledWith('/v1/log/request/self-list', { page: 2 })
    })

    it('uses the access-token-scoped self detail endpoint', async () => {
        mocks.get.mockResolvedValue({ id: 12 })

        await getSelfRequestLogDetail(12)

        expect(mocks.get).toHaveBeenCalledWith('/v1/log/request/self-detail', { id: 12 })
    })
})
