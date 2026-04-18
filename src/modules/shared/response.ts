import type { ApiResponse, PageData } from '@/types/common'

const EMPTY_LIST_RESULT = Object.freeze({
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
})

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
 */
export function unwrapResponseData<T>(response: ApiResponse<T>): T {
    return unwrapPayload(response.data) as T
}

/**
 * 归一化详情对象
 */
export function normalizeDetailData<T>(response: ApiResponse<T | { data: T } | T[]>, fallback: T): T {
    const payload = unwrapPayload(response.data)
    if (payload == null) return fallback

    // 如果是数组，取第一个元素（适用于上传接口返回数组的情况）
    if (Array.isArray(payload)) {
        return payload[0] as T
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
export function normalizeArrayData<T>(response: ApiResponse<T[] | { data: T[] }>): T[] {
    const payload = unwrapPayload(response.data)
    if (Array.isArray(payload)) return payload
    if (payload && typeof payload === 'object' && 'data' in payload && Array.isArray((payload as Record<string, unknown>).data)) {
        return (payload as { data: T[] }).data
    }
    return []
}

/**
 * 归一化分页列表结构
 */
export function normalizeListData<T>(response: ApiResponse<unknown>): PageData<T> & { page: number; pageSize: number } {
    const payload = unwrapPayload(response.data)

    if (Array.isArray(payload)) {
        return {
            ...EMPTY_LIST_RESULT,
            list: payload as T[],
            total: payload.length,
        }
    }

    if (!payload || typeof payload !== 'object') {
        return { ...EMPTY_LIST_RESULT } as PageData<T> & { page: number; pageSize: number }
    }

    const data = payload as Record<string, unknown>

    // 标准分页结构 1: { list: [], total: 0 }
    if (Array.isArray(data.list)) {
        return {
            list: data.list as T[],
            total: Number(data.total ?? 0),
            page: Number(data.page ?? 1),
            pageSize: Number(data.pageSize ?? 10),
        }
    }

    // 标准分页结构 2: { data: [], total: 0 } (PHP/Laravel 风格)
    if (Array.isArray(data.data)) {
        return {
            list: data.data as T[],
            total: Number(data.total ?? 0),
            page: Number((data.current_page as number) ?? (data.page as number) ?? 1),
            pageSize: Number((data.per_page as number) ?? (data.pageSize as number) ?? 10),
        }
    }

    return {
        ...EMPTY_LIST_RESULT,
        list: [],
    } as PageData<T> & { page: number; pageSize: number }
}
