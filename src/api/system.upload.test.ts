import { describe, expect, it, vi } from 'vitest'

const hoisted = vi.hoisted(() => ({
    get: vi.fn(),
    post: vi.fn(),
}))

vi.mock('@/utils/request', () => ({
    get: hoisted.get,
    post: hoisted.post,
    request: vi.fn(),
    upload: vi.fn(),
}))

import { getSystemFileUploadOptions, multipartAbort } from '@/api/system'

describe('api/system upload contract', () => {
    it('reads upload capabilities without using the storage configuration endpoint', async () => {
        hoisted.get.mockResolvedValue({ active_driver: 'local' })

        await getSystemFileUploadOptions()

        expect(hoisted.get).toHaveBeenCalledWith('/v1/system/file/upload/options')
    })

    it('aborts multipart upload using only the server-issued complete token', async () => {
        hoisted.post.mockResolvedValue({})

        await multipartAbort({ complete_token: 'complete-token' })

        expect(hoisted.post).toHaveBeenCalledWith('/v1/system/file/upload/multipart/abort', { complete_token: 'complete-token' })
    })
})
