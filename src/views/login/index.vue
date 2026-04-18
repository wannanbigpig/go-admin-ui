<template>
    <div class="login-container">
        <div class="top">
            <div></div>
            <div>
                <el-link class="login-top-text" href="https://github.com/wannanbigpig" target="_blank"><img src="@/assets/images/bigpig.jpg" class="top-logo" /></el-link>
            </div>
        </div>
        <div class="login">
            <div class="left">
                <transition class="animate__animated animate__fadeInLeft">
                    <div class="left-dh" v-if="showLeftDh">
                        <img src="@/assets/images/logo-frontend.png" alt="" />

                        <div class="left-text">X-L-Admin 后台管理系统</div>
                    </div>
                </transition>
            </div>
            <div class="right">
                <transition class="animate__animated animate__fadeInRight">
                    <div v-if="showRightDh">
                        <div class="login-title">用 户 登 录</div>

                        <div class="login-form">
                            <el-form :model="loginForm" ref="loginFormRef" :rules="validateRules">
                                <el-form-item prop="username">
                                    <el-input v-model.trim="loginForm.username" class="input" placeholder="请输入用户名" @keyup.enter="handleLogin(loginFormRef)">
                                        <template #prefix>
                                            <i-ep-user></i-ep-user>
                                        </template>
                                    </el-input>
                                </el-form-item>
                                <el-form-item prop="password">
                                    <el-input v-model.trim="loginForm.password" class="input" placeholder="请输入密码" type="password" show-password @keyup.enter="handleLogin(loginFormRef)">
                                        <template #prefix>
                                            <i-ep-lock></i-ep-lock>
                                        </template>
                                    </el-input>
                                </el-form-item>
                                <el-form-item prop="captcha">
                                    <el-input v-model.trim="loginForm.captcha" class="input input-captha" placeholder="验证码" maxlength="4" name="username" autocomplete="off" @keyup.enter="handleLogin(loginFormRef)">
                                        <template #prefix>
                                            <i-ant-design-safety-outlined></i-ant-design-safety-outlined>
                                        </template>
                                    </el-input>
                                    <img :src="captchaSrc" alt="captcha" class="captcha xl-cursor-pointer" @click="refreshCaptcha" />
                                </el-form-item>

                                <el-form-item>
                                    <el-button class="button" type="primary" :disabled="loginLoading" @click="handleLogin(loginFormRef)">{{ !loginLoading ? '登录' : '登录中...' }}</el-button>
                                </el-form-item>
                            </el-form>
                        </div>
                    </div>
                </transition>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { fetchCaptcha } from '@/modules/auth/service'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, type FormInstance } from 'element-plus'
import router from '@/router'
import { ref, reactive, onBeforeMount } from 'vue'

// ==================== 常量定义 ====================
/** 默认用户名 */
const DEFAULT_USERNAME = 'super_admin'

/** 默认密码 */
const DEFAULT_PASSWORD = '123456'

// ==================== 响应式数据 ====================
const showLeftDh = ref(true)
const showRightDh = ref(true)
const loginLoading = ref(false)
const captchaSrc = ref('')
const captchaAnswer = ref('')
const loginFormRef = ref<FormInstance>()
const authStore = useAuthStore()

// 表单数据
const loginForm = reactive({
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
    captcha: '',
    captchaId: '',
})

// ==================== 表单验证规则 ====================
const validateRules = {
    username: [
        { required: true, message: '用户名不能为空' },
        { pattern: /^[a-zA-Z0-9_]{3,16}$/, message: '用户名只能是数字+大小写字母+下划线，长度3-16位' },
    ],
    password: [
        { required: true, message: '密码不能为空' },
        { pattern: /^[a-zA-Z0-9!@#$%^&*()_+\-=\\[\]{};':"\\|,.<>\\/?]{6,18}$/, message: '密码只能包含数字、大小写字母和符号，长度6-18位' },
    ],
    captcha: [
        { required: true, message: '验证码不能为空' },
        { pattern: /^[a-zA-Z0-9]{4}$/, message: '验证码只能是小写字母和数字，长度4位' },
    ],
}

// ==================== 方法 ====================
interface CaptchaResult {
    b64s: string
    id: string
    answer: string
}

/**
 * 刷新验证码
 */
const refreshCaptcha = async () => {
    try {
        const response = await fetchCaptcha()
        const captcha = response as unknown as CaptchaResult
        captchaSrc.value = captcha.b64s
        loginForm.captchaId = captcha.id
        captchaAnswer.value = captcha.answer
    } catch (error) {
        console.error('获取验证码失败:', error)
        ElMessage.error('获取验证码失败')
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

        ElMessage.success('登录成功')

        // 等待一下确保路由已准备好，然后跳转
        await new Promise((resolve) => setTimeout(resolve, 100))

        const redirectPath = (router.currentRoute.value.query.redirect as string) || '/'
        await router.push(redirectPath)
    } catch (error) {
        console.error('登录失败:', error)
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
// ... (样式保持不变)
.login-container {
    background-image: url('@/assets/images/login_background.png');
    background-size: 100% 100%;
    background-position: center;
    background-attachment: fixed;
    min-height: 100vh;
    display: flex;
    width: 100vw;
    align-items: center;
    justify-content: center;
    position: relative;
    .top {
        top: 0;
        left: 0;
        right: 0;
        position: absolute;
        width: calc(100vw - 60px);
        height: 100px;
        background-color: #3aa3ff;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 30px;
        z-index: 1;
        .top-logo {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            display: inline-block;
            overflow: hidden;
            line-height: 1;
            vertical-align: middle;
            margin-right: 10px;
        }
        img {
            @include rotate-forever(5s);
        }
        .login-top-text {
            font-size: 26px !important;
            font-weight: 600 !important;
            color: #ffffff !important;
        }
    }

    .login {
        box-shadow: 0px 10px 20px 0px rgba(35, 35, 35, 0.7);
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 480px;
        margin: 120px 0;
        .left {
            width: 480px;
            height: 100%;
            background-size: 100% 100%;
            background-repeat: no-repeat;
            .left-dh {
                width: 100%;
                height: 100%;
                img {
                    width: 40%;
                    height: 40%;
                    position: relative;
                    top: 15%;
                    left: 32%;
                }
                .left-text {
                    width: 100%;
                    position: relative;
                    top: 30%;
                    text-align: center;
                    font-size: 28px;
                    font-weight: 600;
                    color: #ffffff;
                }
            }
        }
        .right {
            border-radius: 0 10px 10px 0;
            width: 360px;
            height: 100%;
            background-color: #eaf1ff;
            .login-title {
                width: 100%;
                margin: 50px 0 50px 0;
                font-size: 25px;
                font-weight: 500;
                color: #000000;
                text-align: center;
            }
            .login-form {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                width: 300px;
                margin: auto;
                font-size: 25px;
                font-weight: 500;
                color: #191919;
                .input {
                    flex: 1;
                    height: 48px;
                }
                .button {
                    width: 100%;
                    height: 48px;
                }
                .captcha {
                    width: 120px;
                    margin-left: 10px;
                    height: 48px;
                    border-radius: 3px;
                }
            }
        }
    }
}
.login-container {
    .login {
        .right {
            .login-form {
                .input,
                .button {
                    transition: all 0.3s ease;
                    &:hover {
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }
                }
                .captcha {
                    cursor: pointer;
                    &:hover {
                        opacity: 0.9;
                    }
                }
            }
        }
    }
}
</style>
