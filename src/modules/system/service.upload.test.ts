import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SystemFile } from '@/types/system'

const hoisted = vi.hoisted(() => ({
    getSystemFileUploadOptions: vi.fn(),
    uploadSystemFileLocal: vi.fn(),
}))

vi.mock('@/api/system', () => ({
    getSystemFileUploadOptions: hoisted.getSystemFileUploadOptions,
    uploadSystemFileLocal: hoisted.uploadSystemFileLocal,
}))

vi.mock('@/api/log', () => ({}))

import { invalidateSystemFileUploadDriverCache, resolveSystemFileUploadDriver, uploadSystemFiles } from '@/modules/system/service'

describe('modules/system/service upload', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        invalidateSystemFileUploadDriverCache()
        hoisted.getSystemFileUploadOptions.mockResolvedValue({
            active_driver: 'local',
            max_file_size_mb: 20,
            allowed_extensions: [],
            allowed_mime_types: [],
            supports_direct_upload: false,
            supports_multipart_upload: false,
        })
    })

    it('resolves the active driver from the upload capability endpoint', async () => {
        await expect(resolveSystemFileUploadDriver()).resolves.toBe('local')
        await expect(resolveSystemFileUploadDriver()).resolves.toBe('local')

        expect(hoisted.getSystemFileUploadOptions).toHaveBeenCalledTimes(1)
    })

    it('passes AbortSignal through to the local batch axios request', async () => {
        const result = { id: 1 } as SystemFile
        hoisted.uploadSystemFileLocal.mockResolvedValue([result])
        const controller = new AbortController()
        const file = new File(['content'], 'report.txt', { type: 'text/plain' })

        await expect(uploadSystemFiles([file], { signal: controller.signal })).resolves.toEqual([result])

        expect(hoisted.uploadSystemFileLocal).toHaveBeenCalledWith(
            [file],
            expect.objectContaining({ driver: 'local' }),
            expect.objectContaining({ signal: controller.signal })
        )
    })
})
