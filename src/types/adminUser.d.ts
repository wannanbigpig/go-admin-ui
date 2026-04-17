import type { WithId, WithTimestamp } from './common'

export interface AdminUser extends WithId, WithTimestamp {
    username: string
    nickname: string
    avatar?: string
    mobile?: string
    email?: string
    status: number
    remark?: string
    role_ids?: number[]
    dept_id?: number
    last_login_at?: string
    last_login_ip?: string
}

export interface AdminUserQuery {
    username?: string
    nickname?: string
    status?: number
    dept_id?: number
    mobile?: string
    email?: string
}

export function createAdminUserQuery(): AdminUserQuery {
    return {
        username: '',
        nickname: '',
        status: undefined,
        dept_id: undefined,
        mobile: '',
        email: '',
    }
}
