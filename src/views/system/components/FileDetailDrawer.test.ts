import { flushPromises, shallowMount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { i18n } from '@/locales'
import type { SystemFile } from '@/types/system'

const request = vi.hoisted(() => vi.fn())
vi.mock('@/utils/request', () => ({ request, get: vi.fn(), post: vi.fn() }))

import FileDetailDrawer from './FileDetailDrawer.vue'

const file = {
    uuid: 'private-document', origin_name: 'untrusted.html', url: '/admin/v1/file/private-document',
    is_public: 0, file_type: 'document', mime_type: 'image/png',
} as SystemFile
const tab = { opener: {}, location: { replace: vi.fn() }, close: vi.fn() }
let downloads: { url: string; name: string }[]

const mountDrawer = () => shallowMount(FileDetailDrawer, {
    props: { modelValue: true, file, references: [], loading: false },
    global: {
        plugins: [i18n], renderStubDefaultSlot: true,
        directives: { loading: {} },
        stubs: { ElTable: { template: '<div />' }, ElLink: { template: '<a class="detail-link"><slot /></a>' } },
    },
})

describe('private file document preview', () => {
    beforeEach(() => {
        vi.useFakeTimers()
        downloads = []
        vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window)
        vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:document'), revokeObjectURL: vi.fn() })
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
            downloads.push({ url: this.href, name: this.download })
        })
    })
    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        vi.useRealTimers()
    })

    it.each(['text/html', 'image/svg+xml', 'application/xhtml+xml', 'application/octet-stream', ''])('downloads %s without navigating to an executable same-origin blob', async (type) => {
        request.mockResolvedValue(new Blob(['<script>untrusted()</script>'], { type }))
        const wrapper = mountDrawer()
        await wrapper.get('.detail-link').trigger('click')
        await flushPromises()
        expect(request).toHaveBeenCalledTimes(1)
        expect(request).toHaveBeenCalledWith('/v1/file/private-document', 'GET', expect.objectContaining({ responseType: 'blob' }))
        expect(tab.location.replace).not.toHaveBeenCalled()
        expect(tab.close).toHaveBeenCalledOnce()
        expect(downloads).toEqual([{ url: 'blob:document', name: 'untrusted.html' }])
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:document')
        wrapper.unmount()
    })

    it.each(['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/pdf', 'text/plain; charset=utf-8'])('preserves %s preview', async (type) => {
        request.mockResolvedValue(new Blob(['passive content'], { type }))
        const wrapper = mountDrawer()
        await wrapper.get('.detail-link').trigger('click')
        await flushPromises()
        expect(request).toHaveBeenCalledOnce()
        expect(tab.location.replace).toHaveBeenCalledWith('blob:document')
        expect(downloads).toEqual([])
        expect(tab.opener).toBeNull()
        vi.runAllTimers()
        expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:document')
        wrapper.unmount()
    })

    it('closes the empty tab when the authenticated download fails', async () => {
        request.mockRejectedValue(new Error('download failed'))
        const wrapper = mountDrawer()
        await wrapper.get('.detail-link').trigger('click')
        await flushPromises()
        expect(tab.close).toHaveBeenCalledOnce()
        expect(tab.location.replace).not.toHaveBeenCalled()
        expect(downloads).toEqual([])
        wrapper.unmount()
    })
})
