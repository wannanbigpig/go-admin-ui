import type { WithId, WithTimestamp } from './common'

export interface Role extends WithId, WithTimestamp {
    name: string
    code: string
    sort?: number
    description?: string
    menu_list?: number[]
    permission_ids?: number[]
    status: number
    remark?: string
    is_system?: number
}
