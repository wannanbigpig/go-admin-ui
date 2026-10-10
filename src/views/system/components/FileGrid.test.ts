import { afterEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import FileGrid from './FileGrid.vue'
import type { SystemFile, SystemFileFolder } from '@/types/system'
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/utils/helper', () => ({ formatFileSize: () => '1 KB' }))
vi.mock('@/modules/system/service', () => ({ fetchSystemFileBlob: vi.fn() }))

describe('file grid context menu', () => {
    let wrapper: VueWrapper
    afterEach(() => wrapper?.unmount())
    it.each(['folder', 'file'])('keeps %s menu open until an outside event', async (type) => {
        wrapper = mount(FileGrid, {
            attachTo: document.body,
            props: {
                files: [{ id: 1, origin_name: 'report.csv', file_type: 'text' } as SystemFile],
                folders: [{ id: 2, name: 'docs' } as SystemFileFolder],
                selectedCategory: 'all',
            },
            global: { stubs: { ElIcon: { template: '<span><slot /></span>' }, ElCheckbox: true, ElImage: true, ElTooltip: true } },
        })
        await wrapper.find(`.${type}-item`).trigger('contextmenu', { clientX: 30, clientY: 40 })
        expect(document.body.querySelector('.context-menu-popover')).not.toBeNull()
        window.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true }))
        await wrapper.vm.$nextTick()
        expect(document.body.querySelector('.context-menu-popover')).toBeNull()
    })
})
