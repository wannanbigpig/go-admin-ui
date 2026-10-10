import { defineComponent, h, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { ElTable, ElTableColumn } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFileOperations } from './useFileOperations'
import type { SystemFile } from '@/types/system'

const mocks = vi.hoisted(() => ({ trash: vi.fn(), restore: vi.fn(), batchRestore: vi.fn(), destroy: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() }))
vi.mock('@/modules/system/service', () => ({
    fetchSystemFileTrashList: mocks.trash,
    restoreSystemFileFromTrash: mocks.restore,
    restoreSystemFilesBatchFromTrash: mocks.batchRestore,
    destroySystemFilesBatchFromTrash: mocks.destroy,
}))
vi.mock('./useFileFolder', () => ({ ROOT_FOLDER_KEY: 'root' }))
vi.mock('vue-i18n', async (original) => ({ ...await original<typeof import('vue-i18n')>(), useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('element-plus', async (original) => ({
    ...await original<typeof import('element-plus')>(),
    ElMessage: { success: mocks.success, warning: mocks.warning, error: mocks.error },
    ElMessageBox: { confirm: vi.fn().mockResolvedValue('confirm') },
}))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))

const files = [{ id: 1, origin_name: 'one.txt' }, { id: 2, origin_name: 'two.txt' }] as SystemFile[]
const createHarness = () => {
    let flow!: ReturnType<typeof useFileOperations>
    const loadFolderTree = vi.fn().mockResolvedValue(undefined)
    const getList = vi.fn().mockResolvedValue(undefined)
    const wrapper = mount(defineComponent({ setup() {
        flow = useFileOperations({ selectedFolderId: ref(null), getList, loadFolderTree })
        return () => h(ElTable, { data: flow.trashList.value, rowKey: 'id', onSelectionChange: flow.handleTrashSelectionChange }, () => h(ElTableColumn, { type: 'selection' }))
    } }))
    return { flow, wrapper, loadFolderTree, getList }
}

describe('file recycle bin operations', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mocks.trash.mockResolvedValue({ list: [...files], total: 2 })
    })

    it.each(['single', 'batch'])('refreshes restored ancestor folders after %s restore', async (mode) => {
        const { flow, wrapper, loadFolderTree, getList } = createHarness()
        flow.selectedTrashFiles.value = [files[0]]
        if (mode === 'single') await flow.handleRestore(files[0])
        else await flow.handleBatchRestore()
        expect(loadFolderTree).toHaveBeenCalledOnce()
        expect(getList).toHaveBeenCalledOnce()
        wrapper.unmount()
    })

    it.each([0, 1, 2])('reports %i failed deletions and retains failed checkboxes', async (failed) => {
        const { flow, wrapper } = createHarness()
        await flow.loadTrashList()
        await flushPromises()
        await wrapper.find('thead input[type="checkbox"]').setValue(true)
        await vi.waitFor(() => expect(flow.selectedTrashFiles.value).toHaveLength(2))
        const remaining = files.slice(0, failed)
        mocks.destroy.mockResolvedValue({ total: 2, destroyed: 2 - failed, failed, failures: remaining.map((file) => ({ id: file.id, message: 'Storage unavailable' })) })
        mocks.trash.mockResolvedValue({ list: remaining.map((file) => ({ ...file })), total: failed })
        await flow.handleBatchDestroy()
        await flushPromises()
        expect(mocks.success).toHaveBeenCalledTimes(failed === 0 ? 1 : 0)
        expect(mocks.warning).toHaveBeenCalledTimes(failed === 1 ? 1 : 0)
        expect(mocks.error).toHaveBeenCalledTimes(failed === 2 ? 1 : 0)
        expect(flow.selectedTrashFiles.value.map((file) => file.id)).toEqual(remaining.map((file) => file.id))
        expect(wrapper.findAll('tbody input[type="checkbox"]:checked')).toHaveLength(failed)
        expect(flow.trashDestroyFailures.value).toHaveLength(failed)
        if (failed) expect(flow.trashDestroyFailures.value[0].message).toBe('Storage unavailable')
        wrapper.unmount()
    })
})
