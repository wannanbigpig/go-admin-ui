import { describe, expect, it } from 'vitest'
import { buildFolderIndexKey } from './useFileUploadFlow'

describe('views/system/composables/useFileUploadFlow.ts', () => {
    it('treats root parent_id values consistently when building folder index keys', () => {
        expect(buildFolderIndexKey(null, 'docs')).toBe(buildFolderIndexKey(0, 'docs'))
        expect(buildFolderIndexKey(undefined, 'docs')).toBe(buildFolderIndexKey('0', 'docs'))
    })

    it('keeps non-root parent_id values distinct', () => {
        expect(buildFolderIndexKey(1, 'docs')).not.toBe(buildFolderIndexKey(null, 'docs'))
        expect(buildFolderIndexKey('1', 'docs')).toBe('1::docs')
    })
})
