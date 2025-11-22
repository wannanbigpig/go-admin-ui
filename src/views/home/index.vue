<template>
  <div>
    <h1>欢迎来到首页</h1>
    <div class="welcome-info">
      <p>登录用户名：{{ username }}</p>
      <p>登录时间：{{ loginTime }}</p>
      <p>上次登录IP：{{ lastLoginIP }}</p>
    </div>
    <div class="random-str">
      <h2>随机字符串</h2>
      <p>{{ str }}</p>
    </div>
  </div>
</template>

<script setup>
import { randomStr } from '@/utils/helper'
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

// ==================== 响应式数据 ====================
const str = ref('')
const username = ref('')
const loginTime = ref('')
const lastLoginIP = ref('')

// ==================== 生命周期 ====================
onMounted(() => {
  const authStore = useAuthStore()
  const userInfo = authStore.userInfo || {}

  str.value = randomStr()
  username.value = userInfo.nickname || userInfo.username || '未知用户'
  loginTime.value = new Date().toLocaleString()
  lastLoginIP.value = userInfo.last_ip || '未知'
})
</script>

<style scoped>
.welcome-info {
  margin-bottom: 20px;
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  background-color: #f9f9f9;
}

.welcome-info p {
  margin: 5px 0;
}

.random-str {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  background-color: #fff;
}

.random-str h2 {
  margin-bottom: 10px;
}
</style>
