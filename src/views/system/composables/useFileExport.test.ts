import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useFileExport } from './useFileExport'
import { buildFileQueryParams } from './fileQuery'
const submit = vi.hoisted(() => vi.fn())
vi.mock('@/modules/exportCenter/service', () => ({ submitSystemFileExportTask: submit }))
vi.mock('@/modules/exportCenter/useExportTaskSubmitter', () => ({ useExportTaskSubmitter: () => ({ submitExportTask: ({ submitter }: { submitter: () => Promise<unknown> }) => submitter() }) }))
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }))

describe('file list and export filter agreement', () => {
    beforeEach(() => submit.mockResolvedValue({ id: 1 }))
    it.each([
        ['all', null, '', 0, 0],
        ['all', 12, 'report', 12, 1],
        ['image', null, '', undefined, 1],
        ['image', 12, '', 12, 1],
    ] as const)('exports current %s folder %s with matching recursion', async (category, folder, search, expectedFolder, recursion) => {
        const query = { page: 3, per_page: 10, origin_name: search, file_type: 'image', start_time: 'old', end_time: 'old' }
        const expected = buildFileQueryParams(query, category, folder, [])
        const exporter = useFileExport({ queryWhere: query, selectedCategory: ref(category), selectedFolderId: ref(folder), dateRange: ref([]) })
        await exporter.handleExportList()
        const payload = submit.mock.calls.at(-1)![0]
        expect(payload).toEqual({ ...expected, page: undefined, per_page: undefined })
        expect(payload).not.toHaveProperty('page')
        expect(payload.folder_id).toBe(expectedFolder)
        expect(payload.include_subfolder).toBe(recursion)
        expect(payload.start_time).toBeNull()
        expect(query.start_time).toBe('old')
    })
})
