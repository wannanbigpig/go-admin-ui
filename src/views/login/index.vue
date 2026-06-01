<template>
    <div class="login-container">
        <!-- canvas 动画背景 -->
        <canvas ref="canvasRef" class="bg-canvas"></canvas>

        <!-- 右上角工具栏 -->
        <div class="login-toolbar">
            <el-dropdown v-if="ENABLE_I18N" trigger="click" @command="handleLanguageCommand" teleported persistent>
                <div class="toolbar-btn" :title="t('layout.language.switch')">
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
                <div class="toolbar-btn" :title="t('layout.themeSwitch')">
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

        <!-- 作者链接 -->
        <a class="author-link" href="https://github.com/wannanbigpig" target="_blank" rel="noopener noreferrer" :title="t('login.authorGithub')">
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
import { computed, ref, reactive, onBeforeMount, onMounted, onBeforeUnmount } from 'vue'
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
const loginFormRef = ref<FormInstance>()
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
        Logger.error('登录失败:', error)
        await refreshCaptcha()
        loginForm.captcha = ''
    } finally {
        loginLoading.value = false
    }
}

// ==================== Canvas 动画背景 ====================
const canvasRef = ref<HTMLCanvasElement>()
let animId = 0

interface Blob {
    cx: number
    cy: number
    radius: number
    color: { r: number; g: number; b: number }
    vx: number
    vy: number
    phase: number
    maxSpeed: number
    minSpeed: number
}

const initCanvasBg = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0
    let h = 0

    const resize = () => {
        w = window.innerWidth
        h = window.innerHeight
        canvas.width = w * dpr
        canvas.height = h * dpr
        canvas.style.width = `${w}px`
        canvas.style.height = `${h}px`
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const isDark = () => document.documentElement.classList.contains('dark')
    const rand = (min: number, max: number) => Math.random() * (max - min) + min

    const lightColors = [
        { r: 96, g: 165, b: 250 },
        { r: 52, g: 211, b: 153 },
        { r: 167, g: 139, b: 250 },
        { r: 251, g: 146, b: 60 },
        { r: 56, g: 189, b: 248 },
    ]

    const darkColors = [
        { r: 59, g: 130, b: 246 },
        { r: 139, g: 92, b: 246 },
        { r: 236, g: 72, b: 153 },
        { r: 34, g: 197, b: 94 },
        { r: 99, g: 102, b: 241 },
    ]

    const createBlobs = (colors: typeof lightColors): Blob[] =>
        colors.map((color) => {
            const minSpeed = rand(60, 120)
            const maxSpeed = rand(180, 350)
            const angle = rand(0, Math.PI * 2)
            const initSpeed = rand(minSpeed, maxSpeed)
            return {
                cx: rand(0, w),
                cy: rand(0, h),
                radius: rand(200, 400),
                color,
                vx: Math.cos(angle) * initSpeed,
                vy: Math.sin(angle) * initSpeed,
                phase: rand(0, Math.PI * 2),
                maxSpeed,
                minSpeed,
            }
        })

    const lightBlobs = createBlobs(lightColors)
    const darkBlobs = createBlobs(darkColors)
    let lastTime = performance.now()

    const draw = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.05)
        lastTime = now

        const dark = isDark()
        const blobs = dark ? darkBlobs : lightBlobs

        ctx.clearRect(0, 0, w, h)

        ctx.fillStyle = dark ? '#0f172a' : '#f4f7fb'
        ctx.fillRect(0, 0, w, h)

        const elapsed = now / 1000

        // ==================== 1. 物理位置与边界碰撞更新 ====================
        for (const blob of blobs) {
            blob.cx += blob.vx * dt
            blob.cy += blob.vy * dt

            // 边界碰撞检测（台球反射：入射角等于反射角）
            const margin = blob.radius * 0.3

            if (blob.cx < -margin) {
                blob.cx = -margin
                blob.vx = -blob.vx
            } else if (blob.cx > w + margin) {
                blob.cx = w + margin
                blob.vx = -blob.vx
            }

            if (blob.cy < -margin) {
                blob.cy = -margin
                blob.vy = -blob.vy
            } else if (blob.cy > h + margin) {
                blob.cy = h + margin
                blob.vy = -blob.vy
            }
        }

        // ==================== 2. 球与球之间的碰撞检测与处理 ====================
        const collisionThreshold = 0.4
        for (let i = 0; i < blobs.length; i++) {
            for (let j = i + 1; j < blobs.length; j++) {
                const b1 = blobs[i]
                const b2 = blobs[j]

                const dx = b1.cx - b2.cx
                const dy = b1.cy - b2.cy
                const dist = Math.sqrt(dx * dx + dy * dy)

                const r1 = b1.radius * collisionThreshold
                const r2 = b2.radius * collisionThreshold

                if (dist < r1 + r2) {
                    if (dist === 0) continue

                    // 位置修正以防止粘连
                    const overlap = r1 + r2 - dist
                    const nx = dx / dist
                    const ny = dy / dist

                    b1.cx += nx * overlap * 0.5
                    b1.cy += ny * overlap * 0.5
                    b2.cx -= nx * overlap * 0.5
                    b2.cy -= ny * overlap * 0.5

                    // 重置随机速度（速率）
                    const speed1 = rand(b1.minSpeed, b1.maxSpeed)
                    const speed2 = rand(b2.minSpeed, b2.maxSpeed)

                    // 反弹方向：沿着碰撞法线向外，并加上随机微调偏角（-45度 到 +45度）以增添随机感
                    const angleOffset1 = rand(-Math.PI / 4, Math.PI / 4)
                    const angleOffset2 = rand(-Math.PI / 4, Math.PI / 4)

                    const angle1 = Math.atan2(dy, dx) + angleOffset1
                    const angle2 = Math.atan2(-dy, -dx) + angleOffset2

                    b1.vx = Math.cos(angle1) * speed1
                    b1.vy = Math.sin(angle1) * speed1
                    b2.vx = Math.cos(angle2) * speed2
                    b2.vy = Math.sin(angle2) * speed2
                }
            }
        }

        // ==================== 3. 绘制渲染阶段 ====================
        for (const blob of blobs) {
            // 更新相位用于半径呼吸
            blob.phase += dt * 0.5

            // 半径呼吸
            const r = blob.radius * (1 + Math.sin(elapsed * 0.4 + blob.phase) * 0.08)

            const alpha = dark ? 0.2 : 0.5
            const grad = ctx.createRadialGradient(blob.cx, blob.cy, 0, blob.cx, blob.cy, r)
            grad.addColorStop(0, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},${alpha})`)
            grad.addColorStop(0.45, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},${alpha * 0.35})`)
            grad.addColorStop(1, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},0)`)

            ctx.beginPath()
            ctx.arc(blob.cx, blob.cy, r, 0, Math.PI * 2)
            ctx.fillStyle = grad
            ctx.fill()
        }

        animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    onBeforeUnmount(() => {
        cancelAnimationFrame(animId)
        window.removeEventListener('resize', resize)
    })
}

// ==================== 生命周期 ====================
onBeforeMount(refreshCaptcha)
onMounted(() => {
    initCanvasBg()

    // 预热/预加载 ECharts 与 Home 路由组件
    const prefetch = () => {
        // 并行预加载 ECharts 各子包（core / charts(bar+pie+line) / components / renderers），并预取首页路由组件
        Promise.all([import('echarts/core'), import('echarts/charts'), import('echarts/components'), import('echarts/renderers'), import('@/views/home/index.vue')]).catch(() => undefined)
    }

    if (window.requestIdleCallback) {
        window.requestIdleCallback(() => prefetch())
    } else {
        setTimeout(prefetch, 2000)
    }
})
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

/* canvas 动画背景 */
.bg-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
}

/* 右上角工具栏 */
.login-toolbar {
    position: absolute;
    top: 24px;
    right: 24px;
    z-index: 10;
    display: flex;
    gap: 8px;

    .toolbar-btn {
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        cursor: pointer;
        color: #64748b;
        background: rgba(255, 255, 255, 0.6);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.5);
        transition: all 0.25s ease;

        &:hover {
            color: var(--el-color-primary);
            background: rgba(255, 255, 255, 0.9);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            transform: translateY(-1px);
        }
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
                object-fit: fill;
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

    .login-toolbar .toolbar-btn {
        color: #94a3b8;
        background: rgba(30, 41, 59, 0.6);
        border-color: rgba(255, 255, 255, 0.08);

        &:hover {
            color: var(--el-color-primary);
            background: rgba(30, 41, 59, 0.9);
        }
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
