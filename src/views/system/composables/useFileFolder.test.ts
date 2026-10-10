import { describe, expect, it, vi } from 'vitest'
import { useFileFolder } from './useFileFolder'
import type { SystemFileFolder } from '@/types/system'

const mocks = vi.hoisted(() => ({ create: vi.fn(), tree: vi.fn() }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))
vi.mock('element-plus', () => ({ ElMessage: { success: vi.fn(), warning: vi.fn() } }))
vi.mock('@/utils/logger', () => ({ Logger: { error: vi.fn() } }))
vi.mock('@/modules/system/service', () => ({
    fetchSystemFileFolderTree: mocks.tree,
    addSystemFileFolder: mocks.create,
    modifySystemFileFolder: vi.fn(),
    removeSystemFileFolder: vi.fn(),
    fetchSystemFileFolderStats: vi.fn(),
}))

describe('file folder creation target', () => {
    it('creating inside B keeps the current navigation and file query in A', async () => {
        const onSelectFolder = vi.fn()
        const folders = [
            { id: 1, name: 'A', parent_id: null, children: [{ id: 3, parent_id: 1, name: 'A child' }] },
            { id: 2, name: 'B', parent_id: null },
        ] as SystemFileFolder[]
        mocks.tree.mockResolvedValue(folders)
        mocks.create.mockResolvedValue({ id: 4 })
        const flow = useFileFolder({ onSelectFolder })
        await flow.loadFolderTree()
        flow.handleFolderSelect(folders[0])
        await flow.handleFolderCommand('create', folders[1])
        expect(flow.selectedFolderId.value).toBe(1)
        expect(flow.folderPath.value.map((folder) => folder.name)).toEqual(['A'])
        expect(flow.currentLevelFolders.value.map((folder) => folder.name)).toEqual(['A child'])
        expect(flow.folderForm.parent_id).toBe(2)
        flow.showFolderDialog.value = false
        expect(onSelectFolder).toHaveBeenCalledExactlyOnceWith(1)

        await flow.handleFolderCommand('create', folders[1])
        flow.folderForm.name = 'B child'
        await flow.submitFolderDialog()
        expect(mocks.create).toHaveBeenCalledWith({ name: 'B child', parent_id: 2 })
        expect(flow.selectedFolderId.value).toBe(1)
        expect(onSelectFolder).toHaveBeenCalledTimes(1)

        flow.openFolderDialog('create')
        expect(flow.folderForm.parent_id).toBe(1)
    })
})
