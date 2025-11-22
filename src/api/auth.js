import { post, get } from '@/utils/request'

// 获取权限列表
export function logout() {
    return post('/v1/auth/logout')
}

// 获取用户信息
export function getUserInfo() {
    return get('/v1/admin-user/get')
}

export function getUserMenuList() {
    return get('/v1/admin-user/user-menu-info')
}

// 更新个人信息
export function updateProfile(data) {
    return post('/v1/admin-user/update-profile', data)
}
