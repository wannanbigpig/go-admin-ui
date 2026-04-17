import type { WithId, WithTimestamp } from './common'

export interface Department extends WithId, WithTimestamp {
    pid: number | string
    name: string
    code?: string
    sort: number
    description?: string
    children?: Department[]
    is_system?: number
    role_ids?: number[]
}

export interface DepartmentQuery {
    name?: string
}
