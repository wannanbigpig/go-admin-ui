import { describe, expect, it } from 'vitest'
import { buildFolderIndexKey, isSameUploadTaskBatch } from './useFileUploadFlow'
import type { UploadTask } from '@/composables/useFileUpload'

describe('views/system/composables/useFileUploadFlow.ts', () => {
    it('treats root parent_id values consistently when building folder index keys', () => {
        expect(buildFolderIndexKey(null, 'docs')).toBe(buildFolderIndexKey(0, 'docs'))
        expect(buildFolderIndexKey(undefined, 'docs')).toBe(buildFolderIndexKey('0', 'docs'))
    })

    it('keeps non-root parent_id values distinct', () => {
        expect(buildFolderIndexKey(1, 'docs')).not.toBe(buildFolderIndexKey(null, 'docs'))
        expect(buildFolderIndexKey('1', 'docs')).toBe('1::docs')
    })

    it('uses task ids instead of array identity to recognize the active upload batch', () => {
        const task = { id: 'task-1' } as UploadTask
        const reactiveEquivalent = [{ ...task }] as UploadTask[]

        expect(isSameUploadTaskBatch(reactiveEquivalent, [task])).toBe(true)
        expect(isSameUploadTaskBatch([{ ...task, id: 'task-2' }], [task])).toBe(false)
    })
})
