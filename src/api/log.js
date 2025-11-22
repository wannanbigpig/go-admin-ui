import { get } from '@/utils/request'

// 获取请求日志列表
export function getRequestLogList(params) {
    return get('/v1/log/request/list', params)
}

// 获取请求日志详情
export function getRequestLogDetail(id) {
    return get(`/v1/log/request/detail`, { id })
}

// 获取登录日志列表
export function getLoginLogList(params) {
    return get('/v1/log/login/list', params)
}

// 获取登录日志详情
export function getLoginLogDetail(id) {
    return get(`/v1/log/login/detail`, { id })
}
