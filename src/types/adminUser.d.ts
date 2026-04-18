import type { WithId, WithTimestamp } from './common'

/**
 * 部门信息接口
 */
export interface DepartmentInfo extends WithId {
    name: string
    code?: string
}

/**
 * 管理员用户接口
 */
export interface AdminUser extends WithId, WithTimestamp {
    username: string
    nickname: string
    avatar?: string
    phone_number?: string
    email?: string
    country_code?: string
    status: number
    dept_ids?: number[]
    departments?: DepartmentInfo[]
    password?: string
    confirm_password?: string
    last_login_at?: string
    last_login_ip?: string
    role_ids?: number[]
    [key: string]: unknown
}

/**
 * 管理员查询参数
 */
export interface AdminUserQuery {
    page?: number
    per_page?: number
    username?: string | null
    phone_number?: string | null
    status?: number | null
    email?: string | null
    dept_id?: number | null
}
