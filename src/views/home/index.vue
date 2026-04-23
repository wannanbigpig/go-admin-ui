<template>
    <div class="home-page">
        <h1>{{ t('home.welcome') }}</h1>
        <div class="welcome-info">
            <p>{{ t('home.loginUsername') }}：{{ username }}</p>
            <p>{{ t('home.loginTime') }}：{{ loginTime }}</p>
            <p>{{ t('home.lastLoginIp') }}：{{ lastLoginIP }}</p>
        </div>
        <div class="random-str">
            <h2>{{ t('home.randomString') }}</h2>
            <p>{{ str }}</p>
        </div>
    </div>
</template>

<script setup>
import { randomStr } from '@/utils/helper'
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const str = ref('')
const username = ref('')
const loginTime = ref('')
const lastLoginIP = ref('')

onMounted(() => {
    const authStore = useAuthStore()
    const userInfo = authStore.userInfo || {}

    str.value = randomStr()
    username.value = userInfo.nickname || userInfo.username || t('home.unknownUser')
    loginTime.value = new Date().toLocaleString()
    lastLoginIP.value = userInfo.last_ip || t('home.unknown')
})
</script>

<style scoped>
.home-page {
    color: var(--el-text-color-primary);
}

.welcome-info {
    margin-bottom: 20px;
    padding: 10px;
    border: 1px solid var(--el-border-color);
    border-radius: 5px;
    background-color: var(--xl-bg-color);
}

.welcome-info p {
    margin: 5px 0;
    color: var(--el-text-color-secondary);
}

.random-str {
    margin-top: 20px;
    padding: 10px;
    border: 1px solid var(--el-border-color);
    border-radius: 5px;
    background-color: var(--xl-bg-color);
}

.random-str h2 {
    margin-bottom: 10px;
}

.random-str p {
    color: var(--el-text-color-secondary);
}
</style>
