<template>
    <div class="login-container">
        <!-- 右上角工具栏 -->
        <div class="login-toolbar">
            <el-dropdown v-if="ENABLE_I18N" trigger="click" @command="handleLanguageCommand" teleported persistent>
                <div class="toolbar-btn" :title="t('layout.language.switch')" role="button" tabindex="0" :aria-label="t('layout.language.switch')" @keydown.enter="triggerClick" @keydown.space.prevent="triggerClick">
                    <el-icon size="18"><i-lucide-languages /></el-icon>
                </div>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item v-for="item in LOCALE_OPTIONS" :key="item.value" :command="item.value" :disabled="settingStore.locale === item.value">
                            {{ item.label }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
            <el-dropdown trigger="click" @command="handleThemeCommand" teleported persistent>
                <div class="toolbar-btn" :title="t('layout.themeSwitch')" role="button" tabindex="0" :aria-label="t('layout.themeSwitch')" @keydown.enter="triggerClick" @keydown.space.prevent="triggerClick">
                    <el-icon size="18"><i-lucide-sun-moon /></el-icon>
                </div>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item :command="THEME_MODE.LIGHT" :disabled="settingStore.theme === THEME_MODE.LIGHT">
                            <el-icon><i-lucide-sun /></el-icon> {{ t('layout.theme.light') }}
                        </el-dropdown-item>
                        <el-dropdown-item :command="THEME_MODE.DARK" :disabled="settingStore.theme === THEME_MODE.DARK">
                            <el-icon><i-lucide-moon /></el-icon> {{ t('layout.theme.dark') }}
                        </el-dropdown-item>
                        <el-dropdown-item :command="THEME_MODE.SYSTEM" :disabled="settingStore.theme === THEME_MODE.SYSTEM">
                            <el-icon><i-lucide-monitor /></el-icon> {{ t('layout.theme.system') }}
                        </el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>

        <transition appear enter-active-class="animate__animated animate__fadeInUp">
            <div ref="loginShellRef" class="login-shell">
                <main class="login-card">
                    <div class="login-header">
                        <span class="logo-wrapper">
                            <img src="@/assets/images/gin-layout-mark.svg" :alt="t('login.appTitle')" />
                        </span>
                        <h1 class="app-title">{{ t('login.appTitle') }}</h1>
                        <p class="app-subtitle">{{ t('login.title') }}</p>
                    </div>

                    <div class="login-form">
                        <el-alert v-if="loginError" class="login-error" type="error" :title="loginError" :closable="false" show-icon />
                        <el-tabs v-if="smsLoginEnabled" v-model="loginMode" class="login-mode-tabs" stretch>
                            <el-tab-pane :label="t('login.modes.password')" name="password" />
                            <el-tab-pane :label="t('login.modes.sms')" name="sms" />
                        </el-tabs>
                        <el-form :model="loginForm" ref="loginFormRef" :rules="validateRules" :validate-on-rule-change="false" size="large">
                            <template v-if="loginMode === 'password'">
                                <el-form-item prop="username" :label="t('login.username')">
                                    <el-input
                                        v-model.trim="loginForm.username"
                                        class="custom-input"
                                        name="username"
                                        autocomplete="username"
                                        :placeholder="t('login.placeholders.username')"
                                        @keyup.enter="handleLogin(loginFormRef)"
                                    >
                                        <template #prefix>
                                            <i-ep-user class="input-icon" />
                                        </template>
                                    </el-input>
                                </el-form-item>
                                <el-form-item prop="password" :label="t('login.password')">
                                    <el-input
                                        v-model="loginForm.password"
                                        class="custom-input"
                                        name="password"
                                        autocomplete="current-password"
                                        :placeholder="t('login.placeholders.password')"
                                        type="password"
                                        show-password
                                        @keyup.enter="handleLogin(loginFormRef)"
                                    >
                                        <template #prefix>
                                            <i-ep-lock class="input-icon" />
                                        </template>
                                    </el-input>
                                </el-form-item>
                            </template>

                            <el-row v-else :gutter="12">
                                <el-col :span="7">
                                    <el-form-item prop="countryCode" :label="t('login.countryCode')">
                                        <el-input v-model.trim="loginForm.countryCode" class="custom-input" name="country-code" autocomplete="tel-country-code" :placeholder="t('login.placeholders.countryCode')">
                                            <template #prefix>+</template>
                                        </el-input>
                                    </el-form-item>
                                </el-col>
                                <el-col :span="17">
                                    <el-form-item prop="phoneNumber" :label="t('login.phoneNumber')">
                                        <el-input
                                            v-model.trim="loginForm.phoneNumber"
                                            class="custom-input"
                                            name="phone-number"
                                            autocomplete="tel-national"
                                            :placeholder="t('login.placeholders.phoneNumber')"
                                            @keyup.enter="handleLogin(loginFormRef)"
                                        >
                                            <template #prefix><i-ep-iphone class="input-icon" /></template>
                                        </el-input>
                                    </el-form-item>
                                </el-col>
                            </el-row>
                            <el-form-item prop="captcha" :label="t('login.captcha')">
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
                                    <div
                                        class="captcha-img"
                                        :class="{ 'is-loading': captchaLoading, 'is-error': captchaFailed }"
                                        @click="refreshCaptcha"
                                        :title="t('login.captchaImageAlt')"
                                        role="button"
                                        tabindex="0"
                                        :aria-label="t('login.captchaImageAlt')"
                                        :aria-busy="captchaLoading"
                                        @keydown.enter="refreshCaptcha"
                                        @keydown.space.prevent="refreshCaptcha"
                                    >
                                        <img v-if="captchaSrc" :src="captchaSrc" :alt="t('login.captchaImageAlt')" />
                                        <div v-else class="captcha-loading" aria-live="polite">
                                            {{ captchaFailed ? t('login.retryCaptcha') : t('login.loadingCaptcha') }}
                                        </div>
                                    </div>
                                </div>
                            </el-form-item>

                            <el-form-item v-if="loginMode === 'sms'" prop="smsCode" :label="t('login.smsCode')">
                                <div class="sms-code-wrapper">
                                    <el-input
                                        v-model.trim="loginForm.smsCode"
                                        class="custom-input"
                                        name="sms-code"
                                        autocomplete="one-time-code"
                                        maxlength="8"
                                        :placeholder="t('login.placeholders.smsCode')"
                                        @keyup.enter="handleLogin(loginFormRef)"
                                    >
                                        <template #prefix><i-ep-message class="input-icon" /></template>
                                    </el-input>
                                    <el-button class="send-code-btn" :loading="smsSending" :disabled="smsRetrySeconds > 0" @click="handleSendSmsCode(loginFormRef)">
                                        {{ smsRetrySeconds > 0 ? t('login.resendAfter', { seconds: smsRetrySeconds }) : t('login.sendSmsCode') }}
                                    </el-button>
                                </div>
                            </el-form-item>

                            <el-form-item class="submit-item">
                                <el-button class="submit-btn" type="primary" :loading="loginLoading" @click="handleLogin(loginFormRef)">
                                    {{ !loginLoading ? t('login.login') : t('login.loggingIn') }}
                                </el-button>
                            </el-form-item>
                        </el-form>
                    </div>
                    <p class="security-hint"><i-ep-lock /> {{ t('login.securityHint') }}</p>
                </main>
            </div>
        </transition>

        <a class="project-link" href="https://github.com/wannanbigpig" target="_blank" rel="noopener noreferrer" :title="t('login.authorGithub')">
            <i-lucide-github />
            <span>{{ t('login.openSourceProject') }}</span>
        </a>
    </div>
</template>

<script setup lang="ts">
import { USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, USERNAME_PATTERN, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from '@/modules/auth/validation'
import { fetchCaptcha, fetchLoginOptions, sendLoginSmsCode } from '@/modules/auth/service'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, type FormInstance } from 'element-plus'
import router from '@/router'
import { Logger } from '@/utils/logger'
import { normalizeRedirectPath } from '@/utils/redirect'
import { computed, ref, reactive, onBeforeMount, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSettingStore, type ThemeMode } from '@/stores/setting'
import { LOCALE_OPTIONS, ENABLE_I18N } from '@/locales'
import type { LocaleCode } from '@/types/i18n'

// ==================== 常量定义 ====================
/** 默认用户名 */
const DEFAULT_USERNAME = import.meta.env.DEV ? (import.meta.env.VITE_DEV_USERNAME ?? '') : ''

/** 默认密码 */
const DEFAULT_PASSWORD = import.meta.env.DEV ? (import.meta.env.VITE_DEV_PASSWORD ?? '') : ''

// ==================== 响应式数据 ====================
const loginLoading = ref(false)
const captchaSrc = ref('')
const captchaLoading = ref(false)
const captchaFailed = ref(false)
const loginError = ref('')
const loginMode = ref<'password' | 'sms'>('password')
const smsLoginEnabled = ref(false)
const smsSending = ref(false)
const smsRetrySeconds = ref(0)
const smsChallengeId = ref('')
const loginFormRef = ref<FormInstance>()
const loginShellRef = ref<HTMLDivElement>()
const authStore = useAuthStore()
const settingStore = useSettingStore()
const { t } = useI18n()

const THEME_MODE = {
    LIGHT: 'light' as ThemeMode,
    DARK: 'dark' as ThemeMode,
    SYSTEM: 'system' as ThemeMode,
}

const handleThemeCommand = (mode: ThemeMode) => {
    settingStore.setTheme(mode)
}

const handleLanguageCommand = (locale: LocaleCode) => {
    settingStore.setLocale(locale)
}

// 表单数据
const loginForm = reactive({
    username: DEFAULT_USERNAME,
    password: DEFAULT_PASSWORD,
    captcha: '',
    captchaId: '',
    countryCode: '86',
    phoneNumber: '',
    smsCode: '',
})

// ==================== 表单验证规则 ====================
const validateRules = computed(() => ({
    username:
        loginMode.value === 'password'
            ? [
                  { required: true, message: t('login.usernameRequired') },
                  { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH, message: t('login.usernameInvalid') },
                  { pattern: USERNAME_PATTERN, message: t('login.usernameInvalid') },
              ]
            : [],
    password:
        loginMode.value === 'password'
            ? [
                  { required: true, message: t('login.passwordRequired') },
                  { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH, message: t('login.passwordInvalid') },
              ]
            : [],
    captcha: [
        { required: loginMode.value === 'password' || !smsChallengeId.value, message: t('login.captchaRequired') },
        { pattern: /^[a-zA-Z0-9]{4}$/, message: t('login.captchaInvalid') },
    ],
    countryCode: loginMode.value === 'sms' ? [{ required: true, pattern: /^\d{1,4}$/, message: t('login.countryCodeInvalid') }] : [],
    phoneNumber: loginMode.value === 'sms' ? [{ required: true, pattern: /^1[3-9]\d{9}$/, message: t('login.phoneNumberInvalid') }] : [],
    smsCode: loginMode.value === 'sms' ? [{ required: true, pattern: /^\d{6}$/, message: t('login.smsCodeInvalid') }] : [],
}))

// ==================== 方法 ====================
/**
 * 刷新验证码
 */
const refreshCaptcha = async () => {
    captchaLoading.value = true
    captchaFailed.value = false
    try {
        const captcha = await fetchCaptcha()
        captchaSrc.value = captcha.b64s
        loginForm.captchaId = captcha.id
    } catch (error) {
        captchaFailed.value = true
        Logger.error('获取验证码失败:', error)
        ElMessage.error(t('login.fetchCaptchaFailed'))
    } finally {
        captchaLoading.value = false
    }
}

const loadLoginOptions = async () => {
    try {
        const options = await fetchLoginOptions()
        smsLoginEnabled.value = options.sms_login_enabled === true
        if (!smsLoginEnabled.value) loginMode.value = 'password'
    } catch (error) {
        smsLoginEnabled.value = false
        loginMode.value = 'password'
        Logger.warn('获取登录选项失败，继续使用密码登录:', error)
    }
}

let smsCountdownTimer: ReturnType<typeof setInterval> | undefined

const clearSmsCountdown = () => {
    if (smsCountdownTimer) clearInterval(smsCountdownTimer)
    smsCountdownTimer = undefined
    smsRetrySeconds.value = 0
}

const startSmsCountdown = (seconds: number) => {
    clearSmsCountdown()
    smsRetrySeconds.value = Math.max(0, Math.floor(seconds))
    if (smsRetrySeconds.value === 0) return
    smsCountdownTimer = setInterval(() => {
        smsRetrySeconds.value = Math.max(0, smsRetrySeconds.value - 1)
        if (smsRetrySeconds.value === 0) clearSmsCountdown()
    }, 1000)
}

const invalidateSmsChallenge = () => {
    smsChallengeId.value = ''
    loginForm.smsCode = ''
    clearSmsCountdown()
}

const handleSendSmsCode = async (formEl: FormInstance | undefined) => {
    if (!formEl || smsSending.value || smsRetrySeconds.value > 0) return
    loginError.value = ''
    if (!/^[a-zA-Z0-9]{4}$/.test(loginForm.captcha)) {
        loginError.value = loginForm.captcha ? t('login.captchaInvalid') : t('login.captchaRequired')
        return
    }

    try {
        await formEl.validateField(['countryCode', 'phoneNumber'])
    } catch {
        return
    }

    smsSending.value = true
    try {
        const result = await sendLoginSmsCode({
            country_code: loginForm.countryCode,
            phone_number: loginForm.phoneNumber,
            captcha: loginForm.captcha,
            captcha_id: loginForm.captchaId,
        })
        if (!result.challenge_id) throw new Error('短信验证码响应缺少 challenge_id')
        smsChallengeId.value = result.challenge_id
        startSmsCountdown(result.retry_after)
        loginForm.smsCode = ''
        loginForm.captcha = ''
        await refreshCaptcha()
        ElMessage.success(t('login.smsCodeSent'))
    } catch (error) {
        loginError.value = t('login.sendSmsCodeFailed')
        Logger.error('发送短信验证码失败:', error)
        loginForm.captcha = ''
        await refreshCaptcha()
    } finally {
        smsSending.value = false
    }
}

/**
 * 处理登录
 */
const handleLogin = async (formEl: FormInstance | undefined) => {
    if (!formEl) return

    if (loginMode.value === 'sms' && !smsChallengeId.value) {
        loginError.value = t('login.sendCodeFirst')
        return
    }

    let credentialsSubmitted = false
    try {
        loginLoading.value = true
        loginError.value = ''
        await formEl.validate()

        credentialsSubmitted = true
        if (loginMode.value === 'sms') {
            await authStore.loginWithSmsCode({
                country_code: loginForm.countryCode,
                phone_number: loginForm.phoneNumber,
                sms_code: loginForm.smsCode,
                challenge_id: smsChallengeId.value,
            })
        } else {
            await authStore.loginWithCredentials({
                username: loginForm.username,
                password: loginForm.password,
                captcha: loginForm.captcha,
                captcha_id: loginForm.captchaId,
            })
        }

        if (authStore.routerData.length === 0) {
            // 走到这里说明 refreshUserInfo 已 resolve 但 routerData 仍空：要么后端返回空菜单，要么前端把 menu 当作空集合处理了。
            // 打印 raw menu 帮助下次复现时定位是后端给空还是前端 race 导致 menu 没写入。
            Logger.warn('登录成功但 routerData 为空，停留在登录页。raw menu:', JSON.parse(JSON.stringify(authStore.menu)))
            ElMessage.warning(t('login.noPermission'))
            return
        }

        ElMessage.success(t('login.loginSuccess'))
        const redirectQuery = router.currentRoute.value.query.redirect
        const targetPath = normalizeRedirectPath(redirectQuery, authStore.firstPath || '/')
        await router.push(targetPath)
    } catch (error) {
        if (credentialsSubmitted) loginError.value = t(loginMode.value === 'sms' ? 'login.smsLoginFailed' : 'login.loginFailed')
        Logger.error('登录失败:', error)
        await refreshCaptcha()
        loginForm.captcha = ''
    } finally {
        loginLoading.value = false
    }
}

watch([() => loginForm.countryCode, () => loginForm.phoneNumber], ([countryCode, phoneNumber], [previousCountryCode, previousPhoneNumber]) => {
    if (countryCode !== previousCountryCode || phoneNumber !== previousPhoneNumber) invalidateSmsChallenge()
})

watch(loginMode, () => {
    loginError.value = ''
    loginFormRef.value?.clearValidate?.()
})

// ==================== 生命周期 ====================
const triggerClick = (e: Event) => {
    ;(e.currentTarget as HTMLElement)?.click()
}

let shellParallaxFrame = 0
let disposeShellParallax: (() => void) | undefined

const initShellParallax = () => {
    const shell = loginShellRef.value
    if (!shell || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches || !window.matchMedia?.('(pointer: fine)').matches) return

    const reset = () => {
        cancelAnimationFrame(shellParallaxFrame)
        shellParallaxFrame = 0
        shell.style.setProperty('--shell-parallax-x', '0px')
        shell.style.setProperty('--shell-parallax-y', '0px')
    }
    const update = (event: PointerEvent) => {
        if (shellParallaxFrame) return
        shellParallaxFrame = requestAnimationFrame(() => {
            const x = ((event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 36).toFixed(2)
            const y = ((event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 28).toFixed(2)
            shell.style.setProperty('--shell-parallax-x', `${x}px`)
            shell.style.setProperty('--shell-parallax-y', `${y}px`)
            shellParallaxFrame = 0
        })
    }

    window.addEventListener('pointermove', update, { passive: true })
    window.addEventListener('pointerleave', reset)
    window.addEventListener('blur', reset)

    return () => {
        cancelAnimationFrame(shellParallaxFrame)
        shellParallaxFrame = 0
        window.removeEventListener('pointermove', update)
        window.removeEventListener('pointerleave', reset)
        window.removeEventListener('blur', reset)
    }
}

onBeforeMount(() => {
    void Promise.all([refreshCaptcha(), loadLoginOptions()])
})
onMounted(() => {
    disposeShellParallax = initShellParallax()

    // 预加载首页路由组件，图表库由首页按需加载，避免登录页提前拉取大包。
    const prefetch = () => {
        import('@/views/home/index.vue').catch(() => undefined)
    }

    if (window.requestIdleCallback) {
        window.requestIdleCallback(() => prefetch())
    } else {
        setTimeout(prefetch, 2000)
    }
})
onBeforeUnmount(() => {
    disposeShellParallax?.()
    clearSmsCountdown()
})
</script>

<style scoped lang="scss">
/* 登录页保持单一任务焦点，背景只保留静态层次。 */
.login-container {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
    width: 100%;
    min-height: 100vh;
    padding: 72px 24px 48px;
    overflow: hidden auto;
    scrollbar-gutter: stable both-edges;
    background: #f4f7fb;
    background-image:
        radial-gradient(circle at 8% 8%, rgba(125, 211, 252, 0.24), transparent 32%), radial-gradient(circle at 90% 18%, rgba(167, 139, 250, 0.17), transparent 30%),
        radial-gradient(circle at 48% 100%, rgba(110, 231, 183, 0.18), transparent 34%);
}

.login-container::before {
    position: fixed;
    inset: 0;
    z-index: 1;
    content: '';
    pointer-events: none;
}

/* 与项目文档站首页保持同一套静态细网格。 */
.login-container::before {
    opacity: 0.3;
    background-image: linear-gradient(rgba(147, 197, 253, 0.36) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 197, 253, 0.36) 1px, transparent 1px);
    background-position: 0 0;
    background-size: 48px 48px;
    mask-image: radial-gradient(circle at center, #000 0, transparent 70%);
}

.login-toolbar {
    position: fixed;
    top: 22px;
    right: 24px;
    z-index: 10;
    display: flex;
    gap: var(--xl-space-2);
}

.login-toolbar .toolbar-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 1px solid rgba(255, 255, 255, 0.68);
    border-radius: 11px;
    color: #64748b;
    background: rgba(255, 255, 255, 0.68);
    box-shadow: 0 6px 18px rgba(30, 64, 175, 0.08);
    cursor: pointer;
    backdrop-filter: blur(16px);
    transition:
        color 0.2s,
        border-color 0.2s,
        background-color 0.2s;

    &:hover,
    &:focus-visible {
        outline: none;
        color: var(--el-color-primary);
        border-color: rgba(64, 158, 255, 0.4);
        background: rgba(255, 255, 255, 0.92);
    }
}

.login-shell {
    --shell-parallax-x: 0px;
    --shell-parallax-y: 0px;
    position: relative;
    z-index: 2;
    width: min(420px, 100%);
}

.login-shell::before {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: -1;
    width: 500px;
    height: 500px;
    border: 1px solid rgba(22, 119, 255, 0.12);
    border-radius: 50%;
    box-shadow:
        0 0 0 76px rgba(22, 119, 255, 0.024),
        0 0 0 152px rgba(22, 119, 255, 0.014);
    content: '';
    pointer-events: none;
    transform: translate(calc(-50% + var(--shell-parallax-x)), calc(-50% + var(--shell-parallax-y)));
    transition: transform 0.18s ease-out;
}

.login-card {
    box-sizing: border-box;
    width: 100%;
    padding: 44px 38px 28px;
    border: 1px solid rgba(255, 255, 255, 0.72);
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.78);
    box-shadow:
        0 26px 70px rgba(15, 23, 42, 0.12),
        inset 0 1px 0 rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(24px) saturate(1.12);
}

.login-header {
    margin-bottom: 32px;
    text-align: center;

    .logo-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 64px;
        height: 64px;
        margin: 0 auto 18px;
        padding: 11px;
        border: 1px solid rgba(255, 255, 255, 0.82);
        border-radius: 18px;
        background: #fff;
        box-shadow: 0 12px 28px rgba(37, 99, 235, 0.13);

        img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
    }

    h1 {
        margin: 0 0 6px;
        color: #172033;
        font-size: 26px;
        font-weight: 750;
        line-height: 1.35;
        letter-spacing: 0.02em;
    }

    .app-subtitle {
        margin: 0;
        color: #64748b;
        font-size: var(--xl-font-sm);
        line-height: 1.6;
        letter-spacing: 0.08em;
    }
}

.login-error {
    margin-bottom: var(--xl-space-4);
}

.login-mode-tabs {
    margin-bottom: var(--xl-space-4);

    :deep(.el-tabs__header) {
        margin-bottom: 0;
    }
}

.login-form {
    :deep(.el-form-item) {
        margin-bottom: 20px;
    }

    :deep(.el-form-item__label) {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
    }

    :deep(.el-input__wrapper) {
        height: 50px;
        padding: 0 16px;
        border: 1px solid rgba(148, 163, 184, 0.2);
        border-radius: 13px;
        background: rgba(255, 255, 255, 0.78);
        box-shadow: 0 4px 16px rgba(15, 23, 42, 0.035);
        transition:
            border-color 0.2s,
            box-shadow 0.2s;

        &.is-focus,
        &:hover {
            border-color: rgba(64, 158, 255, 0.55);
            box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
        }
    }

    .input-icon {
        color: var(--el-text-color-placeholder);
    }

    .captcha-wrapper {
        display: flex;
        width: 100%;
        gap: var(--xl-space-3);

        .captcha-input {
            min-width: 0;
            flex: 1;
        }

        .captcha-img {
            display: flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: 132px;
            height: 50px;
            overflow: hidden;
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 13px;
            background: rgba(255, 255, 255, 0.78);
            cursor: pointer;

            img {
                width: 100%;
                height: 100%;
                object-fit: fill;
            }

            &:hover,
            &:focus-visible {
                outline: none;
                border-color: rgba(64, 158, 255, 0.55);
                box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
            }

            &.is-error {
                border-color: var(--el-color-danger-light-5);
                color: var(--el-color-danger);
            }

            .captcha-loading {
                padding: 0 var(--xl-space-2);
                color: inherit;
                font-size: var(--xl-font-xs);
                text-align: center;
            }
        }
    }

    .sms-code-wrapper {
        display: flex;
        width: 100%;
        gap: var(--xl-space-3);

        .custom-input {
            min-width: 0;
        }

        .send-code-btn {
            flex: 0 0 132px;
            height: 50px;
            border-radius: 13px;
        }
    }

    .submit-item {
        margin-top: 30px;
        margin-bottom: 0;
    }

    .submit-btn {
        width: 100%;
        height: 50px;
        border: 0;
        border-radius: 13px;
        background: linear-gradient(135deg, #4ca8ff, #1677ff);
        font-weight: 600;
        letter-spacing: 0.08em;
        box-shadow: 0 12px 24px rgba(22, 119, 255, 0.22);
        transition:
            transform 0.2s,
            box-shadow 0.2s;

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 15px 28px rgba(22, 119, 255, 0.28);
        }

        &:active {
            transform: translateY(0);
        }
    }
}

.security-hint {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--xl-space-1);
    margin: 18px 0 0;
    color: #94a3b8;
    font-size: var(--xl-font-xs);
}

.project-link {
    position: fixed;
    right: 28px;
    bottom: 24px;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 10px;
    border-radius: 10px;
    color: #64748b;
    background: rgba(255, 255, 255, 0.46);
    font-size: var(--xl-font-xs);
    text-decoration: none;
    backdrop-filter: blur(10px);

    &:hover,
    &:focus-visible {
        outline: none;
        color: var(--el-color-primary);
    }
}

:global(html.dark .login-container) {
    background: #0b1220;
    background-image:
        radial-gradient(circle at 8% 8%, rgba(37, 99, 235, 0.2), transparent 34%), radial-gradient(circle at 90% 18%, rgba(124, 58, 237, 0.16), transparent 31%),
        radial-gradient(circle at 48% 100%, rgba(5, 150, 105, 0.12), transparent 36%);
}

:global(html.dark .login-container::before) {
    opacity: 0.16;
    background-image: linear-gradient(rgba(96, 165, 250, 0.28) 1px, transparent 1px), linear-gradient(90deg, rgba(96, 165, 250, 0.28) 1px, transparent 1px);
}

:global(html.dark .login-shell::before) {
    border-color: rgba(96, 165, 250, 0.1);
    box-shadow:
        0 0 0 76px rgba(59, 130, 246, 0.018),
        0 0 0 152px rgba(59, 130, 246, 0.01);
}

:global(html.dark .login-toolbar .toolbar-btn) {
    color: #a8b2c3;
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(20, 30, 48, 0.64);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.2);
}

:global(html.dark .login-toolbar .toolbar-btn:hover),
:global(html.dark .login-toolbar .toolbar-btn:focus-visible) {
    color: #70b7ff;
    border-color: rgba(96, 165, 250, 0.38);
    background: rgba(26, 39, 62, 0.88);
}

:global(html.dark .login-card) {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(17, 25, 40, 0.72);
    box-shadow:
        0 28px 80px rgba(0, 0, 0, 0.38),
        inset 0 1px 0 rgba(255, 255, 255, 0.04);
    backdrop-filter: blur(26px) saturate(1.05);
}

:global(html.dark .login-header h1) {
    color: #eef3fa;
}

:global(html.dark .login-header .app-subtitle) {
    color: #9aa8bc;
}

:global(html.dark .login-header .logo-wrapper) {
    border-color: rgba(255, 255, 255, 0.14);
    box-shadow: 0 14px 34px rgba(0, 0, 0, 0.24);
}

:global(html.dark .login-form .el-input__wrapper) {
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(9, 16, 29, 0.7);
    box-shadow: none;
}

:global(html.dark .login-form .el-input__wrapper.is-focus),
:global(html.dark .login-form .el-input__wrapper:hover) {
    border-color: rgba(96, 165, 250, 0.66);
    background: rgba(10, 20, 36, 0.88);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.13);
}

:global(html.dark .login-form .el-input__inner) {
    color: #e8eef8;
}

:global(html.dark .login-form .captcha-wrapper .captcha-img) {
    color: #a8b2c3;
    border-color: rgba(255, 255, 255, 0.08);
    background: rgba(9, 16, 29, 0.7);
}

:global(html.dark .security-hint) {
    color: #75839a;
}

:global(html.dark .project-link) {
    color: #94a3b8;
    background: rgba(15, 23, 42, 0.46);
}

@media (max-width: 520px) {
    .login-container {
        align-items: flex-start;
        padding: 74px 16px 24px;
    }

    .login-toolbar {
        top: 16px;
        right: 16px;
    }

    .login-card {
        padding: 30px 24px 24px;
        border-radius: 20px;
    }

    .login-header {
        margin-bottom: 26px;

        h1 {
            font-size: 24px;
        }

        .logo-wrapper {
            width: 58px;
            height: 58px;
            margin-bottom: 16px;
            border-radius: 16px;
        }
    }

    .login-form .captcha-wrapper {
        gap: var(--xl-space-2);

        .captcha-img {
            width: 108px;
        }
    }

    .login-form .sms-code-wrapper {
        flex-direction: column;

        .send-code-btn {
            flex-basis: auto;
            width: 100%;
        }
    }

    .project-link {
        right: auto;
        bottom: 14px;
        left: 50%;
        transform: translateX(-50%);
    }
}

@media (prefers-reduced-motion: reduce) {
    .login-shell {
        animation: none !important;
    }

    .login-toolbar .toolbar-btn,
    .login-form :deep(.el-input__wrapper) {
        transition: none;
    }
}
</style>
