import type { WithId, WithTimestamp } from './common'

export interface Role extends WithId, WithTimestamp {
    name: string
    code: string
    status: number
    remark?: string
    permission_ids?: number[]
}
