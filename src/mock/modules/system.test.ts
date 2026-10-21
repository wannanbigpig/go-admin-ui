import { describe, expect, it } from 'vitest'
import { systemMock } from './system'
import type { ExportRecord, ExportSummary } from '@/types/exportCenter'

const handle = (path: string, params?: Record<string, unknown>) => systemMock.find((route) => route.method === 'GET' && route.pattern.test(path))!.handler(params)

describe('development export contract', () => {
    it('返回真实形状的分页和全量汇总，六种状态均可精确筛选', async () => {
        const all = (await handle('/v1/system/export/list')) as { data: ExportRecord[]; total: number; summary: ExportSummary }
        expect(all.summary.total).toBe(all.total)
        expect(await handle('/v1/system/export/summary')).toEqual(all.summary)
        for (const status of ['pending', 'running', 'retrying', 'success', 'failed', 'canceled'] as const) {
            const filtered = (await handle('/v1/system/export/list', { status })) as typeof all
            expect(filtered.total).toBeGreaterThan(0)
            expect(filtered.total).toBe(all.summary[status])
            expect(filtered.data.every((row) => row.status === status)).toBe(true)
            expect(filtered.summary).toEqual(all.summary)
        }
        const page = (await handle('/v1/system/export/list', { page: 2, per_page: 1 })) as typeof all
        expect(page.data).toHaveLength(1)
        expect(page.total).toBe(all.total)
        expect(await handle('/v1/system/export/detail', { public_id: page.data[0].public_id })).toEqual(page.data[0])
    })
})
