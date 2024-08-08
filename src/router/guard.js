import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import { useRefreshStore } from '@/stores/refresh'
import { useAuthStore } from '@/stores/auth'

NProgress.configure({
  showSpinner: false,
})

const appTitle = import.meta.env.VITE_APP_TITLE

// 当路由请求之前
export function beforeEach(to, from) {
  const authStore = useAuthStore()
  const refreshStore = useRefreshStore()

  // 处理 refresh 路由
  if (to.name === 'refresh') {
    refreshStore.setKey()
    return from
  }

  // 登录页面逻辑
  if (to.name === 'Login') {
    // 如果已经有 token，重定向到 redirect 参数指定的页面或首页
    if (authStore.token) {
      return to.query.redirect || '/'
    }
  } else {
    // 如果不是登录页面，检查 token 是否存在
    if (!authStore.token) {
      // 如果没有 token，重定向到登录页面
      return {
        name: 'Login',
        query: {
          redirect: to.fullPath,
        },
      }
    }

    // 如果用户信息不存在，则刷新用户信息
    if (Object.keys(authStore.userInfo).length === 0) {
      authStore.refreshUserInfo()
    }
  }

  // 开始进度条
  NProgress.start()

  // 设置页面标题
  const title = to.meta && to.meta.title
  document.title = `${title || ''}${title ? ' - ' : ''}` + appTitle
}

// 当路由请求之后：关闭进度条
export function afterEach() {
  // 在即将进入新的页面组件前，关闭掉进度条
  NProgress.done()
}
