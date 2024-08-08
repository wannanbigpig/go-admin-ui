import { defineStore } from 'pinia'
import { login } from '@/api/login' // 导入api
import { getUserInfo } from '@/api/adminUser' // 导入api
import router from '@/router'

export const useAuthStore = defineStore({
  id: 'auth',
  state: () => ({
    access_token: '',
    expires_at: 0,
    userInfo: {},
  }),
  getters: {
    isTokenExpired: (state) => {
      return Date.now() / 1000 >= state.expires_at
    },
    token: (state) => {
      // 直接检查是否过期并返回相应的 token 值
      return state.isTokenExpired ? '' : state.access_token
    },
  },
  actions: {
    async loginWithCredentials(credentials) {
      const res = await login(credentials)
      this.updateToken(res.data.access_token, res.data.expires_at)
      return res
    },
    async refreshUserInfo() {
      const res = await getUserInfo()
      this.userInfo = res.data
    },
    updateToken(token, exp) {
      this.access_token = token
      this.expires_at = exp
    },
    logout(redirectUrl) {
      this.$reset()
      localStorage.removeItem('__persisted__auth')
      router.push({ name: 'Login', query: { redirect: redirectUrl } })
    },
  },
  persist: {
    key: 'auth',
    storage: localStorage,
    paths: ['access_token', 'expires_at', 'userInfo'],
  },
})
