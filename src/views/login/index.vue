<template>
    <div class="login-container">
        <!-- 动态背景装饰 -->
        <div class="bg-shape shape-1"></div>
        <div class="bg-shape shape-2"></div>
        <div class="bg-shape shape-3"></div>

        <!-- 顶部/底部 作者链接 -->
        <a class="author-link" href="https://github.com/wannanbigpig" target="_blank" title="作者 GitHub">
            <img src="@/assets/images/bigpig.jpg" class="avatar" alt="Author" />
        </a>

        <transition appear enter-active-class="animate__animated animate__fadeInUp">
            <div class="login-card">
                <div class="login-header">
                    <div class="logo-wrapper">
                        <img src="@/assets/images/logo-frontend.png" alt="Logo" />
                    </div>
                    <h1 class="app-title">{{ t('login.appTitle') }}</h1>
                    <p class="app-subtitle">{{ t('login.title') }}</p>
                </div>

                <div class="login-form">
                    <el-form :model="loginForm" ref="loginFormRef" :rules="validateRules" size="large">
                        <el-form-item prop="username">
                            <el-input v-model.trim="loginForm.username" class="custom-input" :placeholder="t('login.placeholders.username')" @keyup.enter="handleLogin(loginFormRef)">
                                <template #prefix>
                                    <i-ep-user class="input-icon" />
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item prop="password">
                            <el-input v-model.trim="loginForm.password" class="custom-input" :placeholder="t('login.placeholders.password')" type="password" show-password @keyup.enter="handleLogin(loginFormRef)">
                                <template #prefix>
                                    <i-ep-lock class="input-icon" />
                                </template>
                            </el-input>
                        </el-form-item>
                        <el-form-item prop="captcha">
                            <div class="captcha-wrapper">
                                <el-input
                                    v-model.trim="loginForm.captcha"
                                    class="custom-input captcha-input"
                                    :placeholder="t('login.placeholders.captcha')"
                                    maxlength="4"
                                    name="captcha"
                                    autocomplete="off"
                                    @keyup.enter="handleLogin(loginFormRef)"
                                >
                                    <template #prefix>
                                        <i-ant-design-safety-outlined class="input-icon" />
                                    </template>
                                </el-input>
                                <div class="captcha-img" @click="refreshCaptcha" :title="t('login.placeholders.captcha')">
                                    <img :src="captchaSrc" alt="captcha" v-if="captchaSrc" />
                                    <div class="captcha-loading" v-else>...</div>
                                </div>
                            </div>
                        </el-form-item>

                        <el-form-item class="submit-item">
                            <el-button class="submit-btn" type="primary" :loading="loginLoading" @click="handleLogin(loginFormRef)">
                                {{ !loginLoading ? t('login.login') : t('login.loggingIn') }}
                            </el-button>
                        </el-form-item>
                    </el-form>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup lang="ts">
import { fetchCaptcha } from '@/modules/auth/service'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, type FormInstance } from 'element-plus'
import router from '@/router'
import { Logger } from '@/utils/logger'
import { normalizeRedirectPath } from '@/utils/redirect'
import { computed, ref, reactive, onBeforeMount } from 'vue'
import { useI18n } from 'vue-i18n'

// ==================== 常量定义 ====================
/** 默认用户名 */
const DEFAULT_USERNAME = import.meta.env.DEV ? 'super_admin' : ''

/** 默认密码 */
const DEFAULT_PASSWORD = import.meta.env.DEV ? '123456' : ''

// ==================== 响应式数据 ====================
const loginLoading = ref(false)
const captchaSrc = ref('')
const loginFormRef = ref<FormInstance>()
const authStore = useAuthStore()
const { t } = useI18n()

// 表单数据
const loginForm = reactive({
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
    captcha: '',
    captchaId: '',
})

// ==================== 表单验证规则 ====================
const validateRules = computed(() => ({
    username: [
        { required: true, message: t('login.usernameRequired') },
        { pattern: /^[a-zA-Z0-9_]{3,16}$/, message: t('login.usernameInvalid') },
    ],
    password: [
        { required: true, message: t('login.passwordRequired') },
        { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]{6,18}$/, message: t('login.passwordInvalid') },
    ],
    captcha: [
        { required: true, message: t('login.captchaRequired') },
        { pattern: /^[a-zA-Z0-9]{4}$/, message: t('login.captchaInvalid') },
    ],
}))

// ==================== 方法 ====================
/**
 * 刷新验证码
 */
const refreshCaptcha = async () => {
    try {
        const captcha = await fetchCaptcha()
        captchaSrc.value = captcha.b64s
        loginForm.captchaId = captcha.id
    } catch (error) {
        Logger.error('获取验证码失败:', error)
        ElMessage.error(t('login.fetchCaptchaFailed'))
    }
}

/**
 * 处理登录
 */
const handleLogin = async (formEl: FormInstance | undefined) => {
    if (!formEl) return

    try {
        loginLoading.value = true
        await formEl.validate()

        await authStore.loginWithCredentials({
            username: loginForm.username,
            password: loginForm.password,
            captcha: loginForm.captcha,
            captcha_id: loginForm.captchaId,
        })

        ElMessage.success(t('login.loginSuccess'))
        const redirectQuery = router.currentRoute.value.query.redirect
        await router.push(normalizeRedirectPath(redirectQuery))
    } catch (error) {
        Logger.error('登录失败:', error)
        await refreshCaptcha()
        loginForm.captcha = ''
    } finally {
        loginLoading.value = false
    }
}

// ==================== 生命周期 ====================
onBeforeMount(refreshCaptcha)
</script>

<style scoped lang="scss">
.login-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f4f7fb;
    background-image: radial-gradient(at 0% 0%, hsla(210, 100%, 95%, 1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(200, 100%, 90%, 1) 0, transparent 50%),
        radial-gradient(at 50% 100%, hsla(220, 100%, 95%, 1) 0, transparent 50%);
}

/* 动态背景图形 */
.bg-shape {
    position: absolute;
    filter: blur(90px);
    z-index: 0;
    opacity: 0.6;
    border-radius: 50%;
    animation: floatShape 12s infinite ease-in-out alternate;
}
.shape-1 {
    width: 600px;
    height: 600px;
    background: #60a5fa;
    top: -150px;
    left: -150px;
}
.shape-2 {
    width: 500px;
    height: 500px;
    background: #34d399;
    bottom: -100px;
    right: -50px;
    animation-delay: -4s;
}
.shape-3 {
    width: 400px;
    height: 400px;
    background: #a78bfa;
    top: 20%;
    left: 50%;
    animation-delay: -8s;
    opacity: 0.4;
}

@keyframes floatShape {
    0% {
        transform: translate(0, 0) scale(1);
    }
    100% {
        transform: translate(30px, -40px) scale(1.1);
    }
}

.author-link {
    position: absolute;
    bottom: 30px;
    right: 40px;
    z-index: 10;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    &:hover {
        transform: scale(1.15);

        .avatar {
            animation-play-state: paused;
        }
    }

    .avatar {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: 3px solid rgba(255, 255, 255, 0.8);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        object-fit: cover;
        animation: spin-avatar 6s linear infinite;
    }
}

@keyframes spin-avatar {
    0% {
        transform: rotate(0deg);
    }
    100% {
        transform: rotate(-360deg);
    }
}

.login-card {
    position: relative;
    z-index: 1;
    width: 420px;
    padding: 50px 40px;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 28px;
    box-shadow:
        0 25px 50px rgba(0, 0, 0, 0.08),
        inset 0 0 0 1px rgba(255, 255, 255, 0.5);
    transition:
        transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275),
        box-shadow 0.4s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow:
            0 35px 60px rgba(0, 0, 0, 0.1),
            inset 0 0 0 1px rgba(255, 255, 255, 0.6);
    }
}

.login-header {
    text-align: center;
    margin-bottom: 36px;

    .logo-wrapper {
        width: 72px;
        height: 72px;
        margin: 0 auto 24px;
        background: #ffffff;
        border-radius: 20px;
        padding: 12px;
        box-shadow: 0 10px 24px rgba(0, 102, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform 0.3s ease;

        &:hover {
            transform: scale(1.05) rotate(-5deg);
        }

        img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
    }

    .app-title {
        font-size: 26px;
        font-weight: 800;
        color: #1e293b;
        margin: 0 0 6px;
        letter-spacing: 0.5px;
    }

    .app-subtitle {
        font-size: 14px;
        color: #64748b;
        margin: 0;
        letter-spacing: 1px;
    }
}

.login-form {
    :deep(.el-input__wrapper) {
        background: rgba(255, 255, 255, 0.95);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        border-radius: 14px;
        padding: 0 18px;
        height: 52px;
        transition: all 0.3s ease;
        border: 1px solid transparent;

        &.is-focus,
        &:hover {
            box-shadow: 0 8px 20px rgba(58, 163, 255, 0.1);
            border-color: rgba(58, 163, 255, 0.4);
            background: #ffffff;
        }
    }

    .input-icon {
        font-size: 18px;
        color: #94a3b8;
        transition: color 0.3s;
    }

    :deep(.el-input__wrapper.is-focus) .input-icon {
        color: var(--el-color-primary);
    }

    .captcha-wrapper {
        display: flex;
        gap: 16px;
        width: 100%;

        .captcha-input {
            flex: 1;
        }

        .captcha-img {
            width: 140px;
            height: 52px;
            background: #ffffff;
            border-radius: 14px;
            overflow: hidden;
            cursor: pointer;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid transparent;

            &:hover {
                opacity: 0.9;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.06);
                transform: translateY(-1px);
            }

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .captcha-loading {
                font-size: 12px;
                color: #94a3b8;
                letter-spacing: 2px;
            }
        }
    }

    .submit-item {
        margin-top: 36px;
        margin-bottom: 0;
    }

    .submit-btn {
        width: 100%;
        height: 52px;
        font-size: 16px;
        font-weight: 600;
        letter-spacing: 2px;
        border-radius: 14px;
        background: linear-gradient(135deg, #3aa3ff, #005ce6);
        border: none;
        box-shadow: 0 10px 24px rgba(0, 102, 255, 0.25);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

        &:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(0, 102, 255, 0.35);
        }

        &:active {
            transform: translateY(0);
            box-shadow: 0 5px 15px rgba(0, 102, 255, 0.2);
        }
    }
}

/* 暗色模式适配 */
html.dark {
    .login-container {
        background: #0f172a;
        background-image: radial-gradient(at 0% 0%, hsla(220, 100%, 15%, 1) 0, transparent 50%), radial-gradient(at 100% 0%, hsla(250, 100%, 15%, 1) 0, transparent 50%),
            radial-gradient(at 50% 100%, hsla(200, 100%, 10%, 1) 0, transparent 50%);
    }

    .shape-1 {
        background: #3b82f6;
        opacity: 0.15;
    }
    .shape-2 {
        background: #8b5cf6;
        opacity: 0.15;
    }
    .shape-3 {
        background: #ec4899;
        opacity: 0.1;
    }

    .login-card {
        background: rgba(30, 41, 59, 0.6);
        border-color: rgba(255, 255, 255, 0.05);
        box-shadow:
            0 25px 50px rgba(0, 0, 0, 0.4),
            inset 0 0 0 1px rgba(255, 255, 255, 0.05);
    }

    .login-header {
        .logo-wrapper {
            background: rgba(15, 23, 42, 0.5);
            box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
        }
        .app-title {
            color: #f8fafc;
        }
        .app-subtitle {
            color: #94a3b8;
        }
    }

    .login-form {
        :deep(.el-input__wrapper) {
            background: rgba(15, 23, 42, 0.6);
            box-shadow: none;
            border-color: rgba(255, 255, 255, 0.05);

            input {
                color: #f8fafc;
            }

            &.is-focus,
            &:hover {
                background: rgba(15, 23, 42, 0.8);
                border-color: var(--el-color-primary);
                box-shadow: 0 0 0 1px var(--el-color-primary);
            }
        }

        .captcha-wrapper .captcha-img {
            background: rgba(15, 23, 42, 0.6);
            border-color: rgba(255, 255, 255, 0.05);
            box-shadow: none;
        }
    }
}
</style>
