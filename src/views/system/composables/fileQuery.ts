import { applyDateRangeToQuery } from '@/modules/log/helpers'

/** 文件列表和导出必须使用相同的目录、递归搜索和日期范围。 */
export function buildFileQueryParams<Q extends Record<string, unknown>>(query: Q, category: string, folderId: number | string | null, dateRange: [string, string] | [] | null): Q {
    const params: Record<string, unknown> = { ...query }
    if (category === 'all') {
        params.folder_id = folderId ?? 0
        params.include_subfolder = params.origin_name ? 1 : 0
    } else {
        params.folder_id = folderId || undefined
        params.include_subfolder = 1
    }
    applyDateRangeToQuery(params, dateRange?.length === 2 ? dateRange : null)
    return params as Q
}
