import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'
import router from '@/router'

// create an axios instance
const service = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL + import.meta.env.VITE_BASE_API, // url = base url + request url
  // withCredentials: true, // send cookies when cross-domain requests
  timeout: 10000, // request timeout
})

// request interceptor
service.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    config.headers['Authorization'] = 'Bearer ' + authStore.token
    config.headers['Content-Type'] = 'application/json'
    return config
  },
  (error) => {
    // do something with request error
    return Promise.reject(error)
  }
)

// response interceptor
service.interceptors.response.use(
  /**
   * If you want to get http information such as headers or status
   * Please return  response => response
   */

  /**
   * Determine the request status by custom code
   * Here is just an example
   * You can also judge the status by HTTP Status Code
   */
  (response) => {
    const authStore = useAuthStore()
    if (response.headers['refresh-access-token']) {
      authStore.updateToken(response.headers['refresh-access-token'], response.headers['refresh-exp'])
    }

    const code = response.data.code
    if (code == 401) {
      ElMessageBox.alert('登录状态已过期，请重新登录', '系统提示', {
        // if you want to disable its autofocus
        // autofocus: false,
        confirmButtonText: '重新登陆',
        callback: (action) => {
          if (action === 'confirm') {
            // 获取页面当前路由
            const redirectUrl = router.currentRoute.value.fullPath
            authStore.logout(redirectUrl)
          } else {
            return Promise.reject(response.data.msg)
          }
        },
      })
    }
    if (code !== 0) {
      ElMessage({
        message: response.data.msg,
        type: 'error',
      })
      return Promise.reject(response.data.msg)
    }
    return response.data
  },
  (error) => {
    if (error.message === 'Network Error') {
      ElMessage({
        message: '服务器连接异常，请检查服务器！',
        type: 'error',
        duration: 5 * 1000,
      })
      return
    }

    ElMessage({
      message: error.message,
      type: 'error',
      duration: 5 * 1000,
    })

    return Promise.reject(error)
  }
)

export default service
