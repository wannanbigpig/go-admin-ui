import { describe, expect, it } from 'vitest'
import { applyExportProgressEvent, canDownloadExportRecord, isExportRecordExpired } from './model'
import type { ExportRecord } from '@/types/exportCenter'

describe('export center realtime progress', () => {
    it('只更新 public_id 匹配的导出记录', () => {
        const records: ExportRecord[] = [
            { public_id: 'export-101', status: 'running', progress: 10, processed_count: 10, total_count: 100 },
            { public_id: 'export-102', status: 'pending', progress: 0 },
        ]

        const updated = applyExportProgressEvent(records, {
            public_id: 'export-101',
            status: 'running',
            progress: 48,
            processed_count: 48,
            total_count: 100,
            stage: 'processing',
            received_at: Date.now(),
        })

        expect(updated[0]).toMatchObject({ progress: 48, processed_count: 48, total_count: 100, stage: 'processing' })
        expect(updated[1]).toBe(records[1])
        expect(records[0].progress).toBe(10)
    })
})

describe('export record download availability', () => {
    it('disables download after the exported file expires', () => {
        const record: ExportRecord = {
            public_id: 'export-101',
            file_uuid: 'file-uuid',
            download_ready: true,
            file_expires_at: '2026-09-18 10:00:00',
        }

        expect(isExportRecordExpired(record, new Date('2026-09-18T10:00:01').getTime())).toBe(true)
        expect(canDownloadExportRecord({ ...record, file_expired: true })).toBe(false)
    })

    it('respects an explicit backend download_ready=false result', () => {
        expect(canDownloadExportRecord({ file_uuid: 'file-uuid', download_ready: false })).toBe(false)
    })
})
