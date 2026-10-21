import { afterEach, describe, expect, it, vi } from 'vitest'
import * as systemApi from '@/api/system'
import { fetchExportRecordDetail, fetchExportRecordListWithSummary } from './service'

describe('export record list', () => {
    afterEach(() => vi.restoreAllMocks())

    it('按公共编号读取最终文件详情', async () => {
        const record = { public_id: 'export-public-id', status: 'success' as const, download_ready: true, file_uuid: 'ready-file' }
        const getDetail = vi.spyOn(systemApi, 'getExportRecordDetail').mockResolvedValue(record)
        expect(await fetchExportRecordDetail(record.public_id)).toEqual(record)
        expect(getDetail).toHaveBeenCalledWith(record.public_id)
    })

    it('一次列表请求同时取得分页和全量汇总', async () => {
        const summary = { total: 5, pending: 1, running: 1, retrying: 0, success: 2, failed: 1, canceled: 0 }
        const getList = vi.spyOn(systemApi, 'getExportRecordList').mockResolvedValue({ list: [], total: 0, summary })
        const getSummary = vi.spyOn(systemApi, 'getMyExportSummary')

        const result = await fetchExportRecordListWithSummary({ status: 'success' })

        expect(getList).toHaveBeenCalledOnce()
        expect(getList).toHaveBeenCalledWith({ status: 'success' })
        expect(getSummary).not.toHaveBeenCalled()
        expect(result).toMatchObject({ list: [], total: 0, summary })
    })

    it('旧版列表缺少汇总时保留原汇总接口兼容', async () => {
        const summary = { total: 1, pending: 0, running: 0, retrying: 0, success: 1, failed: 0, canceled: 0 }
        vi.spyOn(systemApi, 'getExportRecordList').mockResolvedValue({ list: [], total: 0 })
        const getSummary = vi.spyOn(systemApi, 'getMyExportSummary').mockResolvedValue(summary)

        const result = await fetchExportRecordListWithSummary()

        expect(getSummary).toHaveBeenCalledOnce()
        expect(result.summary).toEqual(summary)
    })
})
