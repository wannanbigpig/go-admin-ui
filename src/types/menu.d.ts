import type { WithId, WithTimestamp } from './common'

export interface Menu extends WithId, WithTimestamp {
    pid: number | string
    parent_id?: number | string // 别名，保持兼容性
    title?: string
    title_i18n?: Record<string, string>
    code: string
    name?: string
    type: number // 1: 目录，2: 菜单，3: 按钮
    icon?: string
    path?: string
    component?: string
    redirect?: string
    is_show: number
    is_auth?: number
    is_new_window?: number
    is_external_links?: number
    sort: number
    status?: number
    description?: string
    animate_duration?: number
    animate_enter?: string
    animate_leave?: string
    api_list?: number[]
    children?: Menu[]
    disabled?: boolean
    full_path?: string
    [key: string]: unknown
}
