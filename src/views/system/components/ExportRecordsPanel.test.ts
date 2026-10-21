import { describe, it, expect, vi, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { reactive } from 'vue'
import ElementPlus from 'element-plus'

const mocks = vi.hoisted(() => ({ exports: vi.fn(), detail: vi.fn().mockResolvedValue(null), notifications: vi.fn() }))
vi.mock('@/modules/exportCenter/service', () => ({ fetchExportRecordListWithSummary: mocks.exports, fetchExportRecordDetail: mocks.detail }))
vi.mock('@/modules/system/service', () => ({ downloadSystemFileBlob: vi.fn() }))
vi.mock('@/api/system', () => ({ getNotificationList: mocks.notifications }))
vi.mock('@/locales', () => ({ translate: (key: string) => key }))
vi.mock('vue-i18n', async (original) => ({ ...(await original<typeof import('vue-i18n')>()), useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('@/router', () => ({ default: { push: vi.fn() } }))
vi.mock('@/composables/usePermission', () => ({ usePermission: () => ({ checkPermission: () => true }) }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn(), warn: vi.fn() } }))
vi.mock('@/stores/notification', () => {
    const state = reactive({ exportFinishedTime: 0, exportProgressEvent: null })
    return { useNotificationStore: () => state, normalizeNotification: (item: unknown) => item }
})
import { useNotificationStore } from '@/stores/notification'
import ExportPanel from '@/views/system/components/ExportRecordsPanel.vue'

const summary = { total: 5, pending: 2, running: 1, retrying: 1, success: 0, failed: 0, canceled: 1 }
const row = { public_id: 'cf70a3fa-bd64-4ce8-8b9f-ffdc1b3b53a9', scene: 'request_log', status: 'running', progress: 10, total_count: 10 }
const options = {
    global: {
        plugins: [ElementPlus],
        stubs: { teleport: true, ElSelect: true, ElOption: true, IEpArrowDown: true, IEpArrowUp: true },
        directives: {
            permission: () => {
                /* Fixture permissions are granted. */
            },
        },
    },
}
afterEach(() => {
    vi.unstubAllGlobals()
    document.body.innerHTML = ''
})

describe('export record workflow', () => {
    it('keeps each card count consistent with its exact status filter', async () => {
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(0)
            return 0
        })
        mocks.exports.mockResolvedValue({ list: [row], total: 1, summary })
        const wrapper = mount(ExportPanel, { ...options, props: { active: false } })
        try {
            await flushPromises()
            const cards = wrapper.findAll('.export-metric-card')
            expect(cards[1].get('strong').text()).toBe('1')
            expect(cards[3].get('strong').text()).toBe('0')
            await cards[1].trigger('click')
            await flushPromises()
            expect(mocks.exports).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'running' }))
            await cards[3].trigger('click')
            await flushPromises()
            expect(mocks.exports).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'failed' }))
        } finally {
            wrapper.unmount()
        }
    })
    it('updates an open detail with the completed file after list refresh', async () => {
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(0)
            return 0
        })
        mocks.exports.mockResolvedValue({ list: [{ ...row }], total: 1, summary })
        const wrapper = mount(ExportPanel, { ...options, props: { active: false } })
        try {
            await flushPromises()
            await wrapper
                .findAll('button')
                .find((b) => b.text() === 'system.task.detail')!
                .trigger('click')
            await flushPromises()
            expect(wrapper.find('.export-detail-drawer').exists()).toBe(true)
            mocks.exports.mockResolvedValue({ list: [{ ...row, status: 'success', progress: 100, file_uuid: 'ready-file', file_name: 'ready.csv', download_ready: true }], total: 1, summary: { ...summary, success: 1 } })
            useNotificationStore().exportFinishedTime = Date.now()
            await flushPromises()
            expect(wrapper.text()).toContain('100%')
            expect(wrapper.get('.export-detail-drawer').text()).toContain('system.task.exportStatusOptions.success')
            expect(wrapper.get('.export-detail-drawer').text()).toContain('ready.csv')
            expect(wrapper.get('.export-detail-drawer').text()).toContain('system.task.download')
        } finally {
            wrapper.unmount()
        }
    })
    it('完成后记录离开筛选列表，仍按公共编号更新打开的详情', async () => {
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(0)
            return 0
        })
        mocks.exports.mockResolvedValue({ list: [{ ...row }], total: 1, summary })
        mocks.detail.mockResolvedValue({ ...row })
        const wrapper = mount(ExportPanel, { ...options, props: { active: false } })
        try {
            await flushPromises()
            await wrapper.findAll('.export-metric-card')[1].trigger('click')
            await flushPromises()
            await wrapper
                .findAll('button')
                .find((button) => button.text() === 'system.task.detail')!
                .trigger('click')
            await flushPromises()
            mocks.exports.mockResolvedValue({ list: [], total: 0, summary: { ...summary, success: 1 } })
            mocks.detail.mockResolvedValue({ ...row, status: 'success', progress: 100, file_uuid: 'ready-file', file_name: 'completed.csv', download_ready: true })
            useNotificationStore().exportFinishedTime++
            await flushPromises()
            expect(mocks.detail).toHaveBeenLastCalledWith(row.public_id)
            expect(wrapper.get('.export-detail-drawer').text()).toContain('completed.csv')
            expect(wrapper.get('.export-detail-drawer').text()).toContain('system.task.download')
        } finally {
            wrapper.unmount()
            mocks.detail.mockResolvedValue(null)
        }
    })
    it('关闭详情后忽略迟到的响应，重新打开其他编号保持正确文件', async () => {
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(0)
            return 0
        })
        const second = { ...row, public_id: 'different-public-id', status: 'success', file_uuid: 'second-file', file_name: 'second.csv', download_ready: true }
        mocks.exports.mockResolvedValue({ list: [{ ...row }, second], total: 2, summary })
        let resolveOld!: (value: unknown) => void
        mocks.detail
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveOld = resolve
                    })
            )
            .mockResolvedValueOnce(second)
        const wrapper = mount(ExportPanel, { ...options, props: { active: false } })
        try {
            await flushPromises()
            const details = wrapper.findAll('button').filter((button) => button.text() === 'system.task.detail')
            await details[0].trigger('click')
            await flushPromises()
            await wrapper.get('.el-drawer__close-btn').trigger('click')
            await flushPromises()
            await details[1].trigger('click')
            await flushPromises()
            resolveOld({ ...row, file_name: 'stale.csv' })
            await flushPromises()
            expect(wrapper.get('.export-detail-drawer').text()).toContain('second.csv')
            expect(wrapper.get('.export-detail-drawer').text()).not.toContain('stale.csv')
        } finally {
            wrapper.unmount()
            mocks.detail.mockResolvedValue(null)
        }
    })
    it('uses native buttons so Enter and Space share pointer activation', async () => {
        vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
            cb(0)
            return 0
        })
        mocks.exports.mockResolvedValue({ list: [{ ...row }], total: 1, summary })
        const wrapper = mount(ExportPanel, { ...options, props: { active: false } })
        try {
            await flushPromises()
            const card = wrapper.findAll('.export-metric-card')[1]
            expect(card.element.tagName).toBe('BUTTON')
            expect(card.attributes('type')).toBe('button')
            expect(card.attributes('aria-pressed')).toBe('false')
            await card.trigger('click')
            await flushPromises()
            expect(card.attributes('aria-pressed')).toBe('true')
        } finally {
            wrapper.unmount()
        }
    })
})
