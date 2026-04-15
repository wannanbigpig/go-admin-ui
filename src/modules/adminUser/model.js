import { DEFAULT_SUBMIT_DELAY } from '@/modules/shared/constants'

export const ADMIN_USER_STATUS = {
    NORMAL: 1,
    DISABLED: 0,
}

export const ADMIN_USER_EDIT_TYPE = {
    ADD: 1,
    EDIT: 2,
}

export const ADMIN_USER_SUBMIT_DELAY = DEFAULT_SUBMIT_DELAY
export const ROOT_ADMIN_USER_ID = 1

export const ADMIN_USER_AVATAR_CONFIG = {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    MAX_SIZE: 2 * 1024 * 1024,
    UPLOAD_PATH: 'avatar',
}

export function createAdminUserForm() {
    return {
        id: 0,
        nickname: '',
        username: '',
        status: ADMIN_USER_STATUS.NORMAL,
        phone_number: '',
        email: '',
        avatar: '',
        dept_ids: [],
        password: '',
        confirm_password: '',
    }
}

export function createAdminUserQuery() {
    return {
        page: 1,
        per_page: 10,
        username: null,
        phone_number: null,
        status: null,
        email: null,
        dept_id: null,
    }
}

export function isRootAdminUser(user) {
    return Number(user?.id) === ROOT_ADMIN_USER_ID
}
