import { describe, expect, it } from 'vitest'
import { extractListData, normalizeArrayData, normalizeDetailData, normalizeListData, unwrapResponseData } from '@/modules/shared/response'

describe('modules/shared/response.ts', () => {
    it('unwrapResponseData 应返回 result 载荷', () => {
        const result = unwrapResponseData({ result: { id: 1 } })
        expect(result).toEqual({ id: 1 })
    })

    it('normalizeDetailData 应处理 fallback、数组和嵌套 data', () => {
        expect(normalizeDetailData(null, { id: 0 })).toEqual({ id: 0 })
        expect(normalizeDetailData([{ id: 2 }], { id: 0 })).toEqual({ id: 2 })
        expect(normalizeDetailData({ data: { id: 3 } }, { id: 0 })).toEqual({ id: 3 })
    })

    it('normalizeArrayData 应处理数组和 data 数组结构', () => {
        expect(normalizeArrayData<number>([1, 2, 3])).toEqual([1, 2, 3])
        expect(normalizeArrayData<number>({ data: [4, 5] })).toEqual([4, 5])
        expect(normalizeArrayData<number>({})).toEqual([])
    })

    it('normalizeListData 应处理 list 分页结构', () => {
        const result = normalizeListData<{ id: number }>({
            list: [{ id: 1 }],
            total: 10,
            page: 2,
            pageSize: 20,
        })

        expect(result).toEqual({
            list: [{ id: 1 }],
            total: 10,
            page: 2,
            pageSize: 20,
        })
    })

    it('normalizeListData 应处理 Laravel 风格分页结构', () => {
        const result = normalizeListData<{ id: number }>({
            data: [{ id: 7 }],
            total: 1,
            current_page: 3,
            per_page: 50,
        })

        expect(result).toEqual({
            list: [{ id: 7 }],
            total: 1,
            page: 3,
            pageSize: 50,
        })
    })

    it('normalizeListData 应处理 data.list 嵌套分页结构', () => {
        const result = normalizeListData<{ id: number }>({
            data: {
                list: [{ id: 9 }],
                total: 8,
                current_page: 4,
                per_page: 30,
            },
        })

        expect(result).toEqual({
            list: [{ id: 9 }],
            total: 8,
            page: 4,
            pageSize: 30,
        })
    })

    it('extractListData 应兼容 list / data / data.list', () => {
        expect(extractListData<number>({ list: [1, 2] })).toEqual([1, 2])
        expect(extractListData<number>({ data: [3, 4] })).toEqual([3, 4])
        expect(
            extractListData<number>({
                data: {
                    list: [5, 6],
                },
            })
        ).toEqual([5, 6])
    })

    it('normalizeListData 在无效输入时应返回空结果', () => {
        const result = normalizeListData<{ id: number }>('invalid')
        expect(result).toEqual({
            list: [],
            total: 0,
            page: 1,
            pageSize: 10,
        })
    })
})
