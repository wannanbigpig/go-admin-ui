/**
 * 通用 API 响应接口
 */
export interface ApiResponse<T = any> {
    code: number
    msg: string
    data: T
}

/**
 * 分页请求参数
 */
export interface PageParams {
    page?: number
    page_size?: number
    [key: string]: any
}

/**
 * 分页响应数据
 */
export interface PageData<T> {
    list: T[]
    total: number
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
export interface TableColumn<T = any> {
    prop: keyof T | string
    h_label: string
    align?: 'left' | 'center' | 'right'
    width?: string | number
    minWidth?: string | number
    overflow?: boolean
    h_tip?: string
    customRow?: boolean
    tag?: Record<string | number, { type: 'success' | 'warning' | 'danger' | 'info' | 'primary'; text?: string }>
    tagKey?: keyof T | string
    eye?: boolean
    avatar?: boolean
    copy?: boolean
    hidden?: boolean
    getFullInfo?: (row: T, item: TableColumn<T>) => void
    formatter?: (row: T) => any
}
