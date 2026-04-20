import type { LoginResult, UserInfo } from '@/types/auth'

export function createEmptyUserInfo(): UserInfo {
    return {
        id: 0,
        username: '',
        nickname: '',
        avatar: '',
        role_ids: [],
        dept_id: 0,
        created_at: '',
        updated_at: '',
    }
}

export function createEmptyLoginResult(): LoginResult {
    return {
        access_token: '',
        expires_at: 0,
    }
}
