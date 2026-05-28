/**
 * 通用 API 响应接口
 */
export interface ApiResponse<T = unknown> {
    code: number
    msg: string
    data: T
}

/**
 * 分页请求参数
 */
export interface PageParams {
    page?: number
    per_page?: number
    [key: string]: unknown
}

/**
 * 分页响应数据
 */
export interface PageData<T> {
    list: T[]
    total: number
    page?: number
    pageSize?: number
}

/**
 * 通用 ID 属性
 */
export interface WithId {
    id: number | string
}

/**
 * 通用时间戳属性
 */
export interface WithTimestamp {
    created_at?: string
    updated_at?: string
}

/**
 * 表格列配置定义
 */
export interface TableColumn<T = unknown> {
    prop: keyof T | string
    h_label: string
    align?: 'left' | 'center' | 'right'
    width?: string | number
    minWidth?: string | number
    sortable?: boolean | 'custom'
    overflow?: boolean
    h_tip?: string
    customRow?: boolean
    tag?: Record<string | number, { type: string; text?: string }>
    tagKey?: keyof T | string
    icon?: Record<string | number, { color: string; text: string }>
    eye?: boolean
    avatar?: boolean
    copy?: boolean
    hidden?: boolean
    getFullInfo?: (row: T, item: TableColumn<T>) => void
    formatter?: (row: T) => unknown
}

declare global {
    const __APP_VERSION__: string
}
