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
        phone_number: '',
        email: '',
        avatar: '',
        current_password: '',
        password: '',
        confirm_password: '',
    }
}
