import { beforeEach, describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
}))

vi.mock('@/utils/request', () => ({
    get: hoisted.get,
    post: hoisted.post,
}))

import { getProductDetail } from '@/api/product'

describe('api/product detail contract', () => {
    beforeEach(() => {
        hoisted.get.mockReset()
    })

    it('uses the product detail endpoint with the selected id', async () => {
        hoisted.get.mockResolvedValue({ id: 12, name: 'detail name' })

        await expect(getProductDetail({ id: 12 })).resolves.toEqual({ id: 12, name: 'detail name' })

        expect(hoisted.get).toHaveBeenCalledWith('/v1/product/detail', { id: 12 })
    })
})
