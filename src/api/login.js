import request from '@/utils/request'

// 获取验证码
export function getCaptcha() {
  return request({
    url: '/v1/login-captcha',
    method: 'get',
  })
}

export function login(data) {
  return request({
    url: '/v1/login',
    method: 'post',
    data,
  })
}
