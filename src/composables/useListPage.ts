import { ref, shallowRef, type Ref } from 'vue'
import { applyPaginationResult, createPaginationState, syncQueryPagination, type PaginationState } from '@/modules/shared/pagination'
import { Logger } from '@/utils/logger'
import type { FormInstance } from 'element-plus'

interface PaginationQuery {
    page?: number
    per_page?: number
}

interface ListPageResult<T> {
    list: T[]
    total: number
    page?: number
    pageSize?: number
}

interface UseListPageOptions<T, Q extends Record<string, unknown> & PaginationQuery> {
    query: Q
    fetcher: (params: Q) => Promise<ListPageResult<T>>
    /** 旧式参数转换，仍保留向后兼容。优先级高于 extraParams。 */
    transformParams?: (query: Q) => Q
    /**
     * 业务侧追加的查询参数（最常见用法：把 dateRange 拆成 start/end）。
     * 返回值会与 query 合并后传给 fetcher。
     */
    extraParams?: () => Record<string, unknown>
    queryFormRef?: Ref<FormInstance | undefined>
    defaultQuery?: Partial<Q>
    /**
     * fetcher 抛错时的回调。composable 内部已统一兜底返回空页结果并打印日志，
     * 业务层无需再写 try/catch。仅当需要额外提示/上报时使用。
     */
    onError?: (err: unknown) => void
    /**
     * 是否在首次加载时延迟避让路由切换动画，默认为 true。
     * 开启后在首次请求时会在 microtask 中等待 350ms，以防接口缓存立即同步 resolved 造成跳转卡死。
     */
    delayFirstFetch?: boolean
}

interface ResetOptions {
    /** 重置后是否立即重新拉取，默认 true（保持向后兼容）。 */
    refetch?: boolean
}

const EMPTY_RESULT = <T>(query: PaginationQuery): ListPageResult<T> => ({
    list: [],
    total: 0,
    page: query.page ?? 1,
    pageSize: query.per_page ?? 10,
})

/**
 * 通用列表页组合式函数，统一处理加载状态、分页、查询与重置逻辑。
 *
 * 错误处理：fetcher 抛出时返回空页结果并通过 Logger.error 打印，业务层无需 try/catch；
 * 如需上报或 Toast，请传入 onError。
 *
 * @param options 列表页配置项
 * @returns 列表数据、加载态、分页状态与列表操作方法
 */
export function useListPage<T = unknown, Q extends Record<string, unknown> & PaginationQuery = Record<string, unknown> & PaginationQuery>({
    query,
    fetcher,
    transformParams,
    extraParams,
    queryFormRef,
    defaultQuery,
    onError,
    delayFirstFetch = true,
}: UseListPageOptions<T, Q>) {
    const initialQuery = JSON.parse(JSON.stringify(query))
    const loading = ref(false)
    const items = shallowRef<T[]>([])
    const isFirstFetch = ref(true)
    let requestVersion = 0

    const buildParams = (): Q => {
        let base = query
        if (typeof transformParams === 'function') {
            base = transformParams(query)
        }
        if (typeof extraParams === 'function') {
            return { ...base, ...extraParams() } as Q
        }
        return base
    }

    const runFetch = async (): Promise<ListPageResult<T>> => {
        const currentVersion = ++requestVersion
        loading.value = true
        try {
            syncQueryPagination(query, pagination)
            const params = { ...buildParams() } as Q

            // 首次请求且启用了动画避让，则通过 setTimeout 等待过渡动画 (300ms) 彻底执行完毕，确保流畅展示骨架屏
            if (delayFirstFetch && isFirstFetch.value) {
                isFirstFetch.value = false
                await new Promise<void>((resolve) => setTimeout(resolve, 350))
            } else {
                isFirstFetch.value = false
            }

            if (currentVersion !== requestVersion) {
                return EMPTY_RESULT<T>(params)
            }

            const result = await fetcher(params)
            if (currentVersion !== requestVersion) {
                return result
            }
            items.value = result.list
            applyPaginationResult(pagination, result)
            return result
        } catch (error) {
            if (currentVersion !== requestVersion) {
                return EMPTY_RESULT<T>(query)
            }
            Logger.error('useListPage fetcher 失败:', error)
            if (typeof onError === 'function') {
                try {
                    onError(error)
                } catch (callbackError) {
                    Logger.error('useListPage onError 回调失败:', callbackError)
                }
            }
            const fallback = EMPTY_RESULT<T>(query)
            items.value = fallback.list
            applyPaginationResult(pagination, fallback)
            return fallback
        } finally {
            if (currentVersion === requestVersion) {
                loading.value = false
            }
        }
    }

    const getList = async () => {
        await runFetch()
    }

    const pagination: PaginationState = createPaginationState(runFetch, {
        page: query?.page ?? 1,
        pageSize: query?.per_page ?? 10,
    })

    const handleSearch = async () => {
        pagination.page = 1
        query.page = 1
        query.per_page = pagination.pageSize
        await runFetch()
    }

    const handleReset = async (options: ResetOptions = {}) => {
        const { refetch = true } = options

        // 先重置表单字段到挂载时的初始值（Element Plus resetFields 语义），
        // 再用 initialQuery/defaultQuery 覆盖，确保最终状态正确。
        if (queryFormRef?.value) {
            queryFormRef.value.resetFields()
        }

        Object.assign(query, JSON.parse(JSON.stringify(initialQuery)))

        if (defaultQuery) {
            Object.assign(query, JSON.parse(JSON.stringify(defaultQuery)))
        }

        if (refetch) {
            await handleSearch()
        }
    }

    return {
        loading,
        items,
        pagination,
        getList,
        handleSearch,
        handleReset,
    }
}
