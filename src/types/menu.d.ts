import type { WithId, WithTimestamp } from './common'

export interface Menu extends WithId, WithTimestamp {
    parent_id: number | string
    title: string
    code: string
    name?: string
    type: number // 1: 目录, 2: 菜单, 3: 按钮
    icon?: string
    path?: string
    component?: string
    redirect?: string
    is_show: number
    is_auth?: number
    is_new_window?: number
    is_external_links?: number
    sort: number
    children?: Menu[]
}
