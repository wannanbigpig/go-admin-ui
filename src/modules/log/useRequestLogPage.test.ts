import { describe, expect, it } from 'vitest'
import { createRequestLogQuery } from '@/modules/log/model'
import { buildRequestLogQueryParams } from '@/modules/log/useRequestLogPage'

describe('modules/log/useRequestLogPage query contract', () => {
    it('keeps the data-change-only filter in the shared list/export query', () => {
        const query = {
            ...createRequestLogQuery(),
            has_change_diff: 1,
        }

        const params = buildRequestLogQueryParams(query, ['2026-09-01 00:00:00', '2026-09-16 23:59:59'])

        expect(params).toEqual(
            expect.objectContaining({
                has_change_diff: 1,
                start_time: new Date('2026-09-01 00:00:00').toISOString(),
                end_time: new Date('2026-09-16 23:59:59').toISOString(),
            })
        )
        expect(query.start_time).toBeNull()
    })
})
