import { get, post, upload } from '@/utils/request'

// 获取管理员用户列表
export function getAdminUserList(params) {
    return get('/v1/admin-user/list', params)
}

// 获取管理员用户手机详情
export function getFullPhone(query) {
    return get('/v1/admin-user/get-full-phone', query)
}

// 获取管理员用户邮箱详情
export function getFullEmail(query) {
    return get('/v1/admin-user/get-full-email', query)
}

// 获取管理员用户详情
export function getAdminUserDetail(params) {
    return get('/v1/admin-user/detail', params)
}

// 上传头像文件
export function uploadAvatar(files, extra = {}) {
    return upload('/v1/common/upload', files, extra)
}

// 新增管理员用户
export function createAdminUser(data) {
    return post('/v1/admin-user/create', data)
}

// 更新管理员用户
export function updateAdminUser(data) {
    return post('/v1/admin-user/update', data)
}

// 删除管理员用户
export function deleteAdminUser(id) {
    return post('/v1/admin-user/delete', { id })
}

// 绑定角色
export function bindAdminUserRole(data) {
    return post('/v1/admin-user/bind-role', data)
}
