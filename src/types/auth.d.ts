/**
 * 用户权限信息
 */
export interface UserPermission {
    id: number
    pid: number
    title: string
    code: string
    name?: string
    type: 'menu' | 'button' | number
    icon?: string
    path?: string
    component?: string
    redirect?: string
    is_show: number | boolean
    is_auth?: number | boolean
    is_new_window?: number | boolean
    is_external_links?: number | boolean
    sort: number
    children?: UserPermission[]
}

/**
 * 用户信息模型
 */
export interface UserInfo {
    id: number
    username: string
    nickname: string
    avatar?: string
    role_ids?: number[]
    dept_id?: number
    created_at?: string
    updated_at?: string
    [key: string]: unknown
}

/**
 * 登录响应结果
 */
export interface LoginResult {
    access_token: string
    expires_at: number
}

export interface CaptchaResult {
    b64s: string
    id: string
    answer: string
}
