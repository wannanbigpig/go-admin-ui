import { describe, it, expect } from 'vitest'
import { checkNumber, isEmpty, pick, filterNullUndefined, formatDate, isExternal, getSystemFileUrl, getImageUrl } from '@/utils/helper'

describe('helper.ts', () => {
    describe('checkNumber', () => {
        it('应该验证整数', () => {
            expect(checkNumber(123)).toBe(true)
            expect(checkNumber('123')).toBe(true)
        })

        it('应该验证小数位数', () => {
            expect(checkNumber(123.45, 2)).toBe(true)
            expect(checkNumber(123.456, 2)).toBe(false)
        })

        it('应该处理负数验证', () => {
            expect(checkNumber(-1, 2, false)).toBe(false)
            expect(checkNumber(-1, 2, true)).toBe(true)
        })

        it('应该处理无效输入', () => {
            expect(checkNumber(NaN)).toBe(false)
            expect(checkNumber('abc')).toBe(false)
        })

        it('应该在极小数或科学计数法下正确判断小数位数', () => {
            expect(checkNumber(1.23e-11, 2)).toBe(false)
            expect(checkNumber(1.23e-11, 13)).toBe(true)
            expect(checkNumber(1.23e-11, 12)).toBe(false)

            expect(checkNumber('1.23e-11', 2)).toBe(false)
            expect(checkNumber('1.23e-11', 13)).toBe(true)

            expect(checkNumber(1e-10, 10)).toBe(true)
            expect(checkNumber(1e-10, 9)).toBe(false)

            expect(checkNumber(0.00000000001, 2)).toBe(false)
            expect(checkNumber(0.00000000001, 11)).toBe(true)
        })
    })

    describe('isEmpty', () => {
        it('应该判断 null 和 undefined 为空', () => {
            expect(isEmpty(null)).toBe(true)
            expect(isEmpty(undefined)).toBe(true)
        })

        it('应该判断空字符串为空', () => {
            expect(isEmpty('')).toBe(true)
            expect(isEmpty('   ')).toBe(true)
        })

        it('应该判断 0 为空', () => {
            expect(isEmpty(0)).toBe(true)
            expect(isEmpty(false)).toBe(true)
        })

        it('应该判断空数组为空', () => {
            expect(isEmpty([])).toBe(true)
            expect(isEmpty([1, 2, 3])).toBe(false)
        })

        it('应该判断空对象为空', () => {
            expect(isEmpty({})).toBe(true)
            expect(isEmpty({ key: 'value' })).toBe(false)
        })

        it('非空值应该返回 false', () => {
            expect(isEmpty('hello')).toBe(false)
            expect(isEmpty(123)).toBe(false)
            expect(isEmpty(true)).toBe(false)
        })

        it('应该正确判定 Date 对象是否为空', () => {
            expect(isEmpty(new Date('2024-01-01'))).toBe(false)
            expect(isEmpty(new Date())).toBe(false)
            expect(isEmpty(new Date('invalid-date'))).toBe(true)
        })
    })

    describe('pick', () => {
        it('应该提取指定的属性', () => {
            const obj = { a: 1, b: 2, c: 3 }
            expect(pick(obj, ['a', 'c'])).toEqual({ a: 1, c: 3 })
        })

        it('应该处理不存在的属性', () => {
            const obj = { a: 1, b: 2 }
            expect(pick(obj, ['a'])).toEqual({ a: 1 })
        })

        it('空对象应该返回空对象', () => {
            expect(pick({}, [])).toEqual({})
        })
    })

    describe('filterNullUndefined', () => {
        it('应该过滤 null 和 undefined', () => {
            const obj = { a: 1, b: null, c: undefined, d: 'hello' }
            expect(filterNullUndefined(obj)).toEqual({ a: 1, d: 'hello' })
        })

        it('应该保留空字符串和 0', () => {
            const obj = { a: '', b: 0, c: false }
            expect(filterNullUndefined(obj)).toEqual({ a: '', b: 0, c: false })
        })

        it('空对象应该返回空对象', () => {
            expect(filterNullUndefined({})).toEqual({})
        })
    })

    describe('formatDate', () => {
        it('应该格式化 Date 对象', () => {
            const date = new Date('2024-01-15 10:30:45')
            expect(formatDate(date)).toBe('2024-01-15 10:30:45')
        })

        it('应该格式化日期字符串', () => {
            expect(formatDate('2024-01-15T10:30:45')).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
        })

        it('应该格式化时间戳', () => {
            const timestamp = new Date('2024-01-15T10:30:45').getTime()
            expect(formatDate(timestamp)).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
        })
    })

    describe('isExternal', () => {
        it('应该识别外部链接', () => {
            expect(isExternal('https://example.com')).toBe(true)
            expect(isExternal('http://example.com')).toBe(true)
        })

        it('应该识别内部路径', () => {
            expect(isExternal('/dashboard')).toBe(false)
            expect(isExternal('dashboard')).toBe(false)
            expect(isExternal('./dashboard')).toBe(false)
        })
    })

    describe('getSystemFileUrl & getImageUrl', () => {
        it('空值或占位符 "-" 应返回空字符串', () => {
            expect(getSystemFileUrl('')).toBe('')
            expect(getSystemFileUrl('-')).toBe('')
            expect(getImageUrl('')).toBe('')
            expect(getImageUrl('-')).toBe('')
        })

        it('网络地址应原样返回', () => {
            expect(getSystemFileUrl('https://example.com/a.png')).toBe('https://example.com/a.png')
            expect(getSystemFileUrl('http://example.com/b.png')).toBe('http://example.com/b.png')
        })

        it('本地相对文件名应拼接为完整的 API 地址', () => {
            expect(getSystemFileUrl('some-file-id')).toContain('/admin/v1/file/some-file-id')
        })
    })
})
