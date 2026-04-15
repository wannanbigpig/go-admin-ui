const EMPTY_LIST_RESULT = Object.freeze({
    list: [],
    total: 0,
    page: 1,
    pageSize: 10,
})

/**
 * 提取业务响应中的 data 载荷。
 * request.js 已经将 axios 响应处理为业务响应对象，因此这里统一从 response.data 取值。
 */
export function unwrapResponseData(response) {
    return response?.data
}

/**
 * 归一化详情对象。
 */
export function normalizeDetailData(response, fallback = {}) {
    const payload = unwrapResponseData(response)
    if (payload == null) return fallback
    if (Array.isArray(payload)) return payload[0] ?? fallback
    if (payload && typeof payload === 'object' && payload.data && !Array.isArray(payload.data)) {
        return payload.data
    }
    return payload
}

/**
 * 归一化数组结构，兼容 payload / payload.data 两种形式。
 */
export function normalizeArrayData(response) {
    const payload = unwrapResponseData(response)
    if (Array.isArray(payload)) return payload
    if (Array.isArray(payload?.data)) return payload.data
    return []
}

/**
 * 归一化分页列表结构。
 */
export function normalizeListData(response) {
    const payload = unwrapResponseData(response)

    if (Array.isArray(payload)) {
        return {
            ...EMPTY_LIST_RESULT,
            list: payload,
            total: payload.length,
        }
    }

    if (!payload || typeof payload !== 'object') {
        return { ...EMPTY_LIST_RESULT }
    }

    if (Array.isArray(payload.data)) {
        return {
            list: payload.data,
            total: Number(payload.total ?? payload.data.length ?? 0),
            page: Number(payload.current_page ?? payload.page ?? 1),
            pageSize: Number(payload.per_page ?? payload.page_size ?? payload.pageSize ?? 10),
        }
    }

    if (payload.data && typeof payload.data === 'object' && Array.isArray(payload.data.data)) {
        return {
            list: payload.data.data,
            total: Number(payload.data.total ?? payload.total ?? payload.data.data.length ?? 0),
            page: Number(payload.data.current_page ?? payload.data.page ?? payload.current_page ?? payload.page ?? 1),
            pageSize: Number(payload.data.per_page ?? payload.data.page_size ?? payload.per_page ?? payload.page_size ?? 10),
        }
    }

    return {
        ...EMPTY_LIST_RESULT,
        list: [],
    }
}

export function createPaginationResult(data = {}) {
    return {
        total: Number(data.total ?? 0),
        page: Number(data.page ?? 1),
        pageSize: Number(data.pageSize ?? 10),
    }
}
