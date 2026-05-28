import type { PageData } from '@/types/common'

const EMPTY_LIST_RESULT = Object.freeze({
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
})

function asRecord(value: unknown): Record<string, unknown> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    return value as Record<string, unknown>
}

function toNumber(value: unknown, fallback: number): number {
    const normalized = Number(value)
    return Number.isNaN(normalized) ? fallback : normalized
}

/**
 * 后端响应兜底解包：
 * - 新协议：data 为对象，非对象业务值会放在 data.result 中
 * - 兼容旧协议：data 直接是业务值
 */
function unwrapPayload(payload: unknown): unknown {
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        return payload
    }

    const dataObject = payload as Record<string, unknown>
    if ('result' in dataObject) {
        return dataObject.result
    }

    return payload
}

/**
 * 提取业务响应中的 data 载荷
 * 注意：现在 API 直接返回 T，所以这个函数主要用于兼容
 */
export function unwrapResponseData<T>(response: T): T {
    return unwrapPayload(response) as T
}

/**
 * 归一化详情对象
 * 现在 response 已经是业务数据 T，直接返回
 */
export function normalizeDetailData<T>(response: unknown, fallback: T): T {
    const payload = unwrapPayload(response)
    if (payload == null) return fallback

    // 如果是数组，取第一个元素（适用于上传接口返回数组的情况），空数组则返回 fallback
    if (Array.isArray(payload)) {
        return payload.length > 0 ? (payload[0] as T) : fallback
    }

    // 处理嵌套一层 data 的情况 (常见于某些 API 设计)
    if (typeof payload === 'object' && 'data' in payload && !Array.isArray((payload as Record<string, unknown>).data)) {
        return (payload as { data: T }).data
    }

    return payload as T
}

/**
 * 归一化数组结构
 */
export function normalizeArrayData<T>(response: unknown): T[] {
    const payload = unwrapPayload(response)
    if (Array.isArray(payload)) return payload
    if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as Record<string, unknown>).data)) {
        return (payload as { data: T[] }).data
    }
    return []
}

/**
 * 归一化分页列表结构
 * 现在 response 已经是 PageData<T> 或直接的业务数据
 */
export function normalizeListData<T>(response: unknown): PageData<T> & { page?: number; pageSize?: number } {
    const payload = unwrapPayload(response)

    if (Array.isArray(payload)) {
        return {
            ...EMPTY_LIST_RESULT,
            list: payload as T[],
            total: payload.length,
        }
    }

    if (!payload || typeof payload !== 'object') {
        return { ...EMPTY_LIST_RESULT } as PageData<T> & { page?: number; pageSize?: number }
    }

    const data = payload as Record<string, unknown>

    // 标准分页结构 1: { list: [], total: 0 }
    if (Array.isArray(data.list)) {
        return {
            list: data.list as T[],
            total: toNumber(data.total, 0),
            page: data.page !== undefined ? toNumber(data.page, 1) : undefined,
            pageSize: data.pageSize !== undefined ? toNumber(data.pageSize, 10) : undefined,
        }
    }

    // 标准分页结构 2: { data: [], total: 0 } (PHP/Laravel 风格)
    if (Array.isArray(data.data)) {
        return {
            list: data.data as T[],
            total: toNumber(data.total, 0),
            page: toNumber(data.current_page ?? data.page, 1),
            pageSize: toNumber(data.per_page ?? data.pageSize, 10),
        }
    }

    // 标准分页结构 3: { data: { list: [], total: 0, current_page: 1, per_page: 10 } }
    const nestedData = asRecord(data.data)
    if (nestedData && Array.isArray(nestedData.list)) {
        return {
            list: nestedData.list as T[],
            total: toNumber(nestedData.total ?? data.total, 0),
            page: toNumber(nestedData.current_page ?? nestedData.page ?? data.current_page ?? data.page, 1),
            pageSize: toNumber(nestedData.per_page ?? nestedData.pageSize ?? data.per_page ?? data.pageSize, 10),
        }
    }

    return {
        ...EMPTY_LIST_RESULT,
        list: [],
    } as PageData<T> & { page: number; pageSize: number }
}

/**
 * 提取列表数据（兼容 list / data / data.list）
 */
export function extractListData<T>(response: unknown): T[] {
    const normalized = normalizeListData<T>(response)
    if (normalized.list.length > 0) {
        return normalized.list
    }

    const payload = unwrapPayload(response)
    if (Array.isArray(payload)) return payload as T[]

    const payloadRecord = asRecord(payload)
    if (!payloadRecord) return []

    if (Array.isArray(payloadRecord.list)) {
        return payloadRecord.list as T[]
    }
    if (Array.isArray(payloadRecord.data)) {
        return payloadRecord.data as T[]
    }

    const nestedData = asRecord(payloadRecord.data)
    if (nestedData && Array.isArray(nestedData.list)) {
        return nestedData.list as T[]
    }

    return []
}
