import { describe, expect, it } from 'vitest'
import { buildTaskRunDrilldownQuery, parseTaskRunDrilldownQuery } from './taskRunDrilldown'

describe('task run stats drilldown contract', () => {
    it('carries echoed filters and the backend-provided finished-at detail range', () => {
        expect(
            buildTaskRunDrilldownQuery(
                {
                    task_code: 'report:export',
                    kind: 'async',
                    source: 'queue',
                    detail_time_basis: 'finished_at',
                    detail_start_time: '2026-09-10 09:00:00',
                    detail_end_time: '2026-09-10 10:59:59',
                },
                'failed'
            )
        ).toEqual({
            tab: 'run',
            task_code: 'report:export',
            kind: 'async',
            source: 'queue',
            status: 'failed',
            time_basis: 'finished_at',
            detail_start_time: '2026-09-10 09:00:00',
            detail_end_time: '2026-09-10 10:59:59',
        })
    })

    it('parses only supported run filters and maps detail dates to the list query range', () => {
        expect(
            parseTaskRunDrilldownQuery({
                task_code: 'report:export',
                kind: 'async',
                source: 'queue',
                status: 'timeout',
                time_basis: 'finished_at',
                detail_start_time: '2026-09-10 09:00:00',
                detail_end_time: '2026-09-10 10:59:59',
                ignored: 'value',
            })
        ).toEqual({
            filters: {
                task_code: 'report:export',
                kind: 'async',
                source: 'queue',
                status: 'timeout',
                time_basis: 'finished_at',
            },
            dateRange: ['2026-09-10 09:00:00', '2026-09-10 10:59:59'],
        })
    })

    it('rejects unsupported values and incomplete detail ranges', () => {
        expect(
            parseTaskRunDrilldownQuery({
                kind: 'other',
                source: 'other',
                status: 'success',
                time_basis: 'updated_at',
                detail_start_time: '2026-09-10 09:00:00',
            })
        ).toEqual({ filters: { status: 'success' }, dateRange: null })
    })
})
