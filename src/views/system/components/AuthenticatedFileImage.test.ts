import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SystemFile } from '@/types/system'

const fetchBlob = vi.hoisted(() => vi.fn())
vi.mock('@/modules/system/service', () => ({ fetchSystemFileBlob: fetchBlob }))

import AuthenticatedFileImage from './AuthenticatedFileImage.vue'

const file = (isPublic: number) => ({
    uuid: '0123456789abcdef0123456789abcdef',
    origin_name: 'photo.jpg',
    thumbnail_url: 'https://example.com/thumb.jpg',
    url: 'https://example.com/photo.jpg',
    is_public: isPublic,
}) as SystemFile

describe('AuthenticatedFileImage', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        fetchBlob.mockResolvedValue(new Blob(['image'], { type: 'image/jpeg' }))
        vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:private-image'), revokeObjectURL: vi.fn() })
    })
    afterEach(() => vi.unstubAllGlobals())

    it('fetches private thumbnail and preview with the authenticated request', async () => {
        const wrapper = mount(AuthenticatedFileImage, {
            props: { file: file(0), preview: true },
            global: { stubs: { ElImage: { props: ['src'], emits: ['click'], template: '<img :src="src" @click="$emit(\'click\', $event)" />' }, ElImageViewer: true, ElIcon: true } },
        })
        await flushPromises()
        expect(fetchBlob).toHaveBeenCalledWith(file(0).uuid, 'thumb', expect.any(AbortSignal))
        expect(wrapper.get('img').attributes('src')).toBe('blob:private-image')

        await wrapper.get('img').trigger('click')
        await flushPromises()
        expect(fetchBlob).toHaveBeenCalledWith(file(0).uuid, undefined, expect.any(AbortSignal))
        expect(wrapper.findComponent({ name: 'ElImageViewer' }).exists()).toBe(true)
        wrapper.unmount()
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:private-image')
    })

    it('keeps public images on their direct URL without fetching blobs', async () => {
        const wrapper = mount(AuthenticatedFileImage, {
            props: { file: file(1) },
            global: { stubs: { ElImage: { props: ['src'], template: '<img :src="src" />' }, ElImageViewer: true, ElIcon: true } },
        })
        await flushPromises()
        expect(wrapper.get('img').attributes('src')).toBe('https://example.com/thumb.jpg')
        expect(fetchBlob).not.toHaveBeenCalled()
        wrapper.unmount()
    })
})
