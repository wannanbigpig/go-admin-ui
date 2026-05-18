<template>
    <div class="error-page-container">
        <!-- 动态光晕背景 -->
        <div class="glow glow-1"></div>
        <div class="glow glow-2"></div>
        <div class="glow glow-3"></div>

        <!-- 流星雨动画层 -->
        <div class="meteor-shower">
            <div class="meteor m-1"></div>
            <div class="meteor m-2"></div>
            <div class="meteor m-3"></div>
            <div class="meteor m-4"></div>
            <div class="meteor m-5"></div>
            <div class="meteor m-6"></div>
            <div class="meteor m-7"></div>
        </div>

        <div class="content-wrapper">
            <!-- 创意纯CSS 404 视觉主体替代丑陋图片 -->
            <div class="visual-404">
                <div class="number" data-text="4">4</div>
                <div class="planet-container">
                    <div class="planet">
                        <div class="crater crater-1"></div>
                        <div class="crater crater-2"></div>
                        <div class="crater crater-3"></div>
                        <div class="orbit"></div>
                    </div>
                </div>
                <div class="number" data-text="4">4</div>
            </div>

            <div class="text-section">
                <h2 class="error-title">Oops! 页面走失了</h2>
                <p class="error-desc">{{ t('other.notFound.pageNotFound') }}</p>
                <div class="action-buttons">
                    <el-button type="primary" size="large" round @click="goHome" class="btn-home">
                        <template #icon>
                            <i-ep-home-filled />
                        </template>
                        {{ t('other.notFound.backHome') }}
                    </el-button>
                    <el-button size="large" round @click="goBack" class="btn-back">
                        <template #icon>
                            <i-ep-back />
                        </template>
                        返回上一页
                    </el-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

const { t } = useI18n()
const router = useRouter()

const goHome = () => {
    router.push('/')
}

const goBack = () => {
    router.back()
}
</script>

<style lang="scss" scoped>
.error-page-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #f8fafc;
    overflow: hidden;
}

/* 背景动态光晕 */
.glow {
    position: absolute;
    border-radius: 50%;
    filter: blur(100px);
    opacity: 0.5;
    animation: drift 15s infinite alternate ease-in-out;
    pointer-events: none;
}

.glow-1 {
    width: 600px;
    height: 600px;
    background: rgba(56, 189, 248, 0.2); /* Sky blue */
    top: -10%;
    left: -10%;
}

.glow-2 {
    width: 500px;
    height: 500px;
    background: rgba(129, 140, 248, 0.2); /* Indigo */
    bottom: -10%;
    right: -10%;
    animation-delay: -5s;
}

.glow-3 {
    width: 400px;
    height: 400px;
    background: rgba(244, 114, 182, 0.15); /* Pink */
    top: 40%;
    left: 40%;
    animation-delay: -10s;
}

@keyframes drift {
    0% {
        transform: translate(0, 0) scale(1);
    }
    100% {
        transform: translate(50px, -50px) scale(1.1);
    }
}

/* 流星雨动画层 */
.meteor-shower {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    z-index: 0;
    pointer-events: none;
}

.meteor {
    position: absolute;
    width: 150px;
    height: 2px;
    /* 亮色模式下，流星稍微带点主题蓝 */
    background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(0, 102, 255, 0.4));
    transform-origin: right;
    animation: meteor-fall linear infinite;
    opacity: 0;

    &::before {
        content: '';
        position: absolute;
        right: -2px;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: #3aa3ff;
        box-shadow:
            0 0 8px #3aa3ff,
            0 0 15px #0066ff;
    }
}

/* 分布流星的位置、延迟和动画时长 */
.m-1 {
    top: 5%;
    right: 15%;
    animation-delay: 0s;
    animation-duration: 4s;
}
.m-2 {
    top: -10%;
    right: 35%;
    animation-delay: 1.2s;
    animation-duration: 5s;
    width: 120px;
}
.m-3 {
    top: 25%;
    right: -5%;
    animation-delay: 2.5s;
    animation-duration: 3.5s;
    width: 180px;
}
.m-4 {
    top: 45%;
    right: 10%;
    animation-delay: 3.8s;
    animation-duration: 6s;
}
.m-5 {
    top: -20%;
    right: 65%;
    animation-delay: 1.8s;
    animation-duration: 4.5s;
    width: 100px;
}
.m-6 {
    top: 15%;
    right: 55%;
    animation-delay: 4.5s;
    animation-duration: 3.8s;
}
.m-7 {
    top: 60%;
    right: -10%;
    animation-delay: 5.2s;
    animation-duration: 4.2s;
    width: 140px;
}

@keyframes meteor-fall {
    0% {
        opacity: 0;
        transform: translateX(100px) translateY(-100px) rotate(-45deg);
    }
    10% {
        opacity: 1;
    }
    20% {
        opacity: 0;
        transform: translateX(-800px) translateY(800px) rotate(-45deg);
    }
    100% {
        opacity: 0;
        transform: translateX(-800px) translateY(800px) rotate(-45deg);
    }
}

/* 内容布局 */
.content-wrapper {
    position: relative;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    animation: fade-up 0.8s ease-out forwards;
}

@keyframes fade-up {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* 创意的 404 视觉体 */
.visual-404 {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 15px;
    margin-bottom: 30px;

    .number {
        font-size: clamp(120px, 15vw, 220px);
        font-weight: 900;
        line-height: 1;
        color: #1e293b;
        text-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
        position: relative;
        z-index: 2;
    }

    .planet-container {
        width: clamp(100px, 12vw, 180px);
        height: clamp(100px, 12vw, 180px);
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .planet {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #3aa3ff, #818cf8);
        border-radius: 50%;
        box-shadow:
            inset -15px -15px 30px rgba(0, 0, 0, 0.1),
            0 20px 40px rgba(58, 163, 255, 0.3);
        position: relative;
        animation: float 6s infinite ease-in-out;

        .crater {
            position: absolute;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            box-shadow: inset 2px 2px 5px rgba(0, 0, 0, 0.1);
        }

        .crater-1 {
            width: 25%;
            height: 25%;
            top: 20%;
            left: 20%;
        }
        .crater-2 {
            width: 15%;
            height: 15%;
            top: 50%;
            right: 20%;
        }
        .crater-3 {
            width: 10%;
            height: 10%;
            bottom: 20%;
            left: 40%;
        }

        .orbit {
            position: absolute;
            top: 50%;
            left: 50%;
            width: 160%;
            height: 40%;
            border: 3px solid rgba(255, 255, 255, 0.4);
            border-radius: 50%;
            transform: translate(-50%, -50%) rotate(-20deg);
            box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
            animation: spin 10s linear infinite;
        }
    }
}

@keyframes float {
    0%,
    100% {
        transform: translateY(0);
    }
    50% {
        transform: translateY(-15px);
    }
}

@keyframes spin {
    from {
        transform: translate(-50%, -50%) rotate(-20deg) scaleX(1);
    }
    50% {
        transform: translate(-50%, -50%) rotate(-20deg) scaleX(0.2);
        opacity: 0.5;
    }
    to {
        transform: translate(-50%, -50%) rotate(-20deg) scaleX(1);
    }
}

/* 文本与按钮区域 */
.text-section {
    max-width: 500px;
    margin: 0 auto;
}

.error-title {
    font-size: 32px;
    font-weight: 800;
    color: #0f172a;
    margin-bottom: 15px;
    letter-spacing: 1px;
}

.error-desc {
    font-size: 16px;
    color: #64748b;
    margin-bottom: 40px;
    line-height: 1.6;
}

.action-buttons {
    display: flex;
    justify-content: center;
    gap: 20px;

    :deep(.el-button) {
        padding: 14px 36px;
        font-size: 16px;
        font-weight: 600;
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        border: none;
        height: auto;

        &.btn-home {
            background: linear-gradient(135deg, #3aa3ff, #005ce6);
            color: #fff;
            box-shadow: 0 8px 20px rgba(0, 102, 255, 0.25);

            &:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 28px rgba(0, 102, 255, 0.4);
            }
        }

        &.btn-back {
            background: #ffffff;
            color: #475569;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.05);

            &:hover {
                transform: translateY(-3px);
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.1);
                color: #0f172a;
            }
        }

        &:active {
            transform: translateY(0) !important;
            box-shadow: 0 4px 10px rgba(0, 102, 255, 0.2);
        }

        .el-icon {
            margin-right: 6px;
            font-size: 18px;
        }
    }
}

/* 暗色模式适配 */
html.dark {
    .error-page-container {
        background-color: #0f172a;
    }
    .glow-1 {
        background: rgba(56, 189, 248, 0.1);
    }
    .glow-2 {
        background: rgba(129, 140, 248, 0.1);
    }
    .glow-3 {
        background: rgba(244, 114, 182, 0.05);
    }

    .meteor {
        /* 暗黑模式下流星为高亮的白色 */
        background: linear-gradient(90deg, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.8));

        &::before {
            background: #fff;
            box-shadow:
                0 0 8px #fff,
                0 0 15px rgba(58, 163, 255, 0.8);
        }
    }

    .visual-404 {
        .number {
            color: #f8fafc;
        }
        .planet {
            box-shadow:
                inset -15px -15px 30px rgba(0, 0, 0, 0.3),
                0 20px 40px rgba(58, 163, 255, 0.15);
            .crater {
                background: rgba(0, 0, 0, 0.2);
            }
        }
    }

    .error-title {
        color: #f8fafc;
    }
    .error-desc {
        color: #94a3b8;
    }

    .action-buttons :deep(.el-button.btn-back) {
        background: rgba(30, 41, 59, 0.8);
        color: #e2e8f0;
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);

        &:hover {
            background: rgba(51, 65, 85, 0.9);
            color: #f8fafc;
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.4);
        }
    }
}

/* 移动端适配 */
@media (max-width: 600px) {
    .visual-404 {
        gap: 5px;
        .number {
            font-size: 90px;
        }
        .planet-container {
            width: 80px;
            height: 80px;
        }
    }
    .action-buttons {
        flex-direction: column;
        gap: 15px;
        padding: 0 20px;
        :deep(.el-button) {
            width: 100%;
            margin: 0;
        }
    }
}
</style>
