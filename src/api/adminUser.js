import request from '@/utils/request'

// 获取用户信息
export function getUserInfo() {
  return request({
    url: '/v1/admin/admin-user/get',
    method: 'get',
  })
}
export function getUserMenuList() {
  return request({
    url: '/v1/admin/user/menu-list',
    method: 'get',
  })
}
