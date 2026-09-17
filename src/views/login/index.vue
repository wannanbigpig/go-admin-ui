<template>
    <div class="login-container">
        <canvas ref="canvasRef" class="bg-canvas" aria-hidden="true"></canvas>

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
            <div class="login-shell">
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
                        <el-form :model="loginForm" ref="loginFormRef" :rules="validateRules" size="large">
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
const captchaLoading = ref(false)
const captchaFailed = ref(false)
const loginError = ref('')
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
        { min: USERNAME_MIN_LENGTH, max: USERNAME_MAX_LENGTH, message: t('login.usernameInvalid') },
        { pattern: USERNAME_PATTERN, message: t('login.usernameInvalid') },
    ],
    password: [
        { required: true, message: t('login.passwordRequired') },
        { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH, message: t('login.passwordInvalid') },
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

/**
 * 处理登录
 */
const handleLogin = async (formEl: FormInstance | undefined) => {
    if (!formEl) return

    let credentialsSubmitted = false
    try {
        loginLoading.value = true
        loginError.value = ''
        await formEl.validate()

        credentialsSubmitted = true
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
        if (credentialsSubmitted) loginError.value = t('login.loginFailed')
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
    depth: number
}

const initCanvasBg = () => {
    const canvas = canvasRef.value
    if (!canvas) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const stage = canvas.parentElement

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

    const rand = (min: number, max: number) => Math.random() * (max - min) + min
    const pointer = {
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        clientX: w / 2,
        clientY: h / 2,
        active: false,
    }
    let pointerStyleFrame = 0

    const supportsPointerMotion = window.matchMedia?.('(pointer: fine)').matches ?? false
    const updatePointer = (event: PointerEvent) => {
        pointer.clientX = event.clientX
        pointer.clientY = event.clientY
        pointer.targetX = (event.clientX / Math.max(w, 1) - 0.5) * 2
        pointer.targetY = (event.clientY / Math.max(h, 1) - 0.5) * 2
        pointer.active = true
        if (pointerStyleFrame) return
        pointerStyleFrame = requestAnimationFrame(() => {
            const xRatio = pointer.clientX / Math.max(w, 1)
            const yRatio = pointer.clientY / Math.max(h, 1)
            stage?.style.setProperty('--parallax-x', `${((xRatio - 0.5) * 42).toFixed(2)}px`)
            stage?.style.setProperty('--parallax-y', `${((yRatio - 0.5) * 32).toFixed(2)}px`)
            pointerStyleFrame = 0
        })
    }
    const resetPointer = () => {
        pointer.targetX = 0
        pointer.targetY = 0
        pointer.active = false
        stage?.style.setProperty('--parallax-x', '0px')
        stage?.style.setProperty('--parallax-y', '0px')
    }

    if (supportsPointerMotion) {
        window.addEventListener('pointermove', updatePointer, { passive: true })
        window.addEventListener('pointerleave', resetPointer)
        window.addEventListener('blur', resetPointer)
    }

    const lightColors = [
        { r: 96, g: 165, b: 250 },
        { r: 56, g: 189, b: 248 },
        { r: 129, g: 140, b: 248 },
        { r: 147, g: 197, b: 253 },
    ]

    const darkColors = [
        { r: 37, g: 99, b: 235 },
        { r: 79, g: 70, b: 229 },
        { r: 14, g: 165, b: 233 },
        { r: 124, g: 58, b: 237 },
    ]

    const createBlobs = (colors: typeof lightColors): Blob[] =>
        colors.map((color) => {
            const minSpeed = rand(12, 24)
            const maxSpeed = rand(30, 58)
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
                depth: rand(0.35, 1),
            }
        })

    const lightBlobs = createBlobs(lightColors)
    const darkBlobs = createBlobs(darkColors)
    let lastTime = performance.now()

    const draw = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.05)
        lastTime = now

        const dark = document.documentElement.classList.contains('dark')
        const blobs = dark ? darkBlobs : lightBlobs
        pointer.x += (pointer.targetX - pointer.x) * 0.085
        pointer.y += (pointer.targetY - pointer.y) * 0.085

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

        for (const blob of blobs) {
            blob.phase += dt * 0.5
            const r = blob.radius * (1 + Math.sin(elapsed * 0.4 + blob.phase) * 0.08)
            let renderX = blob.cx + pointer.x * 88 * blob.depth
            let renderY = blob.cy + pointer.y * 66 * blob.depth

            if (pointer.active) {
                const dx = renderX - pointer.clientX
                const dy = renderY - pointer.clientY
                const distance = Math.hypot(dx, dy)
                const influenceRadius = 320
                if (distance > 0 && distance < influenceRadius) {
                    const force = (1 - distance / influenceRadius) * 36 * blob.depth
                    renderX += (dx / distance) * force
                    renderY += (dy / distance) * force
                }
            }

            const alpha = dark ? 0.2 : 0.34
            const grad = ctx.createRadialGradient(renderX, renderY, 0, renderX, renderY, r)
            grad.addColorStop(0, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},${alpha})`)
            grad.addColorStop(0.45, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},${alpha * 0.35})`)
            grad.addColorStop(1, `rgba(${blob.color.r},${blob.color.g},${blob.color.b},0)`)

            ctx.beginPath()
            ctx.arc(renderX, renderY, r, 0, Math.PI * 2)
            ctx.fillStyle = grad
            ctx.fill()
        }

        animId = requestAnimationFrame(draw)
    }

    animId = requestAnimationFrame(draw)

    return () => {
        cancelAnimationFrame(animId)
        cancelAnimationFrame(pointerStyleFrame)
        window.removeEventListener('resize', resize)
        if (supportsPointerMotion) {
            window.removeEventListener('pointermove', updatePointer)
            window.removeEventListener('pointerleave', resetPointer)
            window.removeEventListener('blur', resetPointer)
        }
    }
}

// ==================== 生命周期 ====================
const triggerClick = (e: Event) => {
    ;(e.currentTarget as HTMLElement)?.click()
}

let disposeCanvasBg: (() => void) | undefined

onBeforeMount(refreshCaptcha)
onMounted(() => {
    disposeCanvasBg = initCanvasBg()

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
onBeforeUnmount(() => disposeCanvasBg?.())
</script>

<style scoped lang="scss">
/* 登录页保持单一任务焦点，动态效果只放在背景层，避免表单跟随鼠标晃动。 */
.login-container {
    --parallax-x: 0px;
    --parallax-y: 0px;
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
    background: #f4f7fb;
    background-image:
        radial-gradient(circle at 8% 8%, rgba(125, 211, 252, 0.24), transparent 32%), radial-gradient(circle at 90% 18%, rgba(167, 139, 250, 0.17), transparent 30%),
        radial-gradient(circle at 48% 100%, rgba(110, 231, 183, 0.18), transparent 34%);
}

.bg-canvas {
    position: fixed;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.login-container::before {
    position: fixed;
    inset: 0;
    z-index: 1;
    content: '';
    pointer-events: none;
}

/* 与项目文档站首页保持同一套细网格和视差语言，不设置追随光标的独立光斑。 */
.login-container::before {
    opacity: 0.3;
    background-image: linear-gradient(rgba(147, 197, 253, 0.36) 1px, transparent 1px), linear-gradient(90deg, rgba(147, 197, 253, 0.36) 1px, transparent 1px);
    background-position: var(--parallax-x) var(--parallax-y);
    background-size: 48px 48px;
    mask-image: radial-gradient(circle at center, #000 0, transparent 70%);
    transition: background-position 0.18s ease-out;
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
    transform: translate(calc(-50% + var(--parallax-x)), calc(-50% + var(--parallax-y)));
    transition: transform 0.22s ease-out;
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

    .project-link {
        right: auto;
        bottom: 14px;
        left: 50%;
        transform: translateX(-50%);
    }
}

@media (prefers-reduced-motion: reduce) {
    .bg-canvas {
        display: none;
    }

    .login-shell {
        animation: none !important;
    }

    .login-toolbar .toolbar-btn,
    .login-form :deep(.el-input__wrapper) {
        transition: none;
    }
}
</style>
