export const PROFILE_STATUS = {
    NORMAL: 1,
    DISABLED: 0,
}

export const PROFILE_AVATAR_CONFIG = {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
    MAX_SIZE: 2 * 1024 * 1024,
    UPLOAD_PATH: 'avatar',
}

export function createProfileForm() {
    return {
        id: 0,
        nickname: '',
        username: '',
        email: '',
        avatar: '',
        /** 仅勾选后才展示并提交修改密码相关字段 */
        change_password: false,
        current_password: '',
        password: '',
        confirm_password: '',
        sms_code: '',
        sms_challenge_id: '',
    }
}
