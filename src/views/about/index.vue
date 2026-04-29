<template>
    <main class="about-page" :class="{ 'is-dark': isDark }">
        <section class="about-panel">
            <header class="about-hero">
                <div class="logo-wrap">
                    <img :src="logoSrc" alt="X-L-Admin" class="logo" />
                </div>

                <h1>X-L-Admin</h1>

                <div class="meta-list" aria-label="project meta">
                    <span class="meta-pill">v{{ version }}</span>
                    <span class="meta-pill">Vue 3 管理端</span>
                </div>

                <h2>Gin Layout 后台管理前端</h2>
                <p>X-L-Admin 是一个面向后台管理场景的前端项目，用于承载权限管理、 系统参数、系统字典、任务中心和审计日志等后台能力。</p>
            </header>

            <section class="link-grid" aria-label="project links">
                <a v-for="item in linkCards" :key="item.title" class="link-card" :href="item.href" target="_blank" rel="noopener noreferrer">
                    <Icon :icon="item.icon" class="link-icon" :class="item.tone" />
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.text }}</span>
                </a>
            </section>

            <section class="content-section">
                <h3>项目用途说明</h3>
                <ul>
                    <li>可作为 <strong>业务后台、内部管理系统和工程化后台项目</strong> 的前后端基础骨架， 提供认证、RBAC 权限、菜单路由、日志、系统配置和任务中心等通用能力。</li>
                    <li>
                        项目支持在生产等真实环境中二次开发和落地使用；上线前应结合业务场景补齐
                        <strong>安全加固、权限验收、配置密钥、审计策略、数据备份和性能评估</strong>。
                    </li>
                    <li>默认数据、演示配置和通用规则只提供项目启动基线，生产部署时应按实际组织、 业务流程、数据治理和运维规范进行收敛与替换。</li>
                </ul>
            </section>

            <section class="content-section">
                <h3>使用须知与风险提示</h3>
                <ul>
                    <li>生产环境使用前，请按业务实际情况检查 <strong>权限模型、默认账号、配置密钥和审计策略</strong>。</li>
                    <li>如因权限配置错误、凭证泄露、服务限流、数据误操作或二次开发缺陷导致问题， 风险由使用者自行承担。</li>
                </ul>
            </section>

            <section class="disclaimer">
                <h3>免责声明</h3>
                <p>
                    本项目按 <strong>“现状”提供</strong>，不附带任何明示或默示担保。 项目可能存在缺陷、安全漏洞或与特定业务场景不匹配的实现；上线前请自行完成代码审查、
                    安全加固、配置审查、权限验收和数据备份。因使用、依赖、部署、改造或运维本项目导致的问题， 由使用者自行承担。
                </p>
            </section>
        </section>
    </main>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { onBeforeUnmount, onMounted, ref } from 'vue'

import logoSrc from '@/assets/images/logo-frontend.png'
import appPackage from '../../../package.json'

const version = appPackage.version
const isDark = ref(false)

let themeObserver: MutationObserver | undefined

const syncDarkMode = () => {
    isDark.value = document.documentElement.classList.contains('dark')
}

onMounted(() => {
    syncDarkMode()
    themeObserver = new MutationObserver(syncDarkMode)
    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    })
})

onBeforeUnmount(() => {
    themeObserver?.disconnect()
})

const linkCards = [
    {
        icon: 'lucide:user-round',
        title: '主作者',
        text: 'wannanbigpig',
        href: 'https://github.com/wannanbigpig',
        tone: 'tone-default',
    },
    {
        icon: 'lucide:github',
        title: '前端仓库',
        text: 'github.com/wannanbigpig/go-admin-ui',
        href: 'https://github.com/wannanbigpig/go-admin-ui',
        tone: 'tone-default',
    },
    {
        icon: 'lucide:server',
        title: '后端仓库',
        text: 'github.com/wannanbigpig/gin-layout',
        href: 'https://github.com/wannanbigpig/gin-layout',
        tone: 'tone-default',
    },
    {
        icon: 'lucide:heart',
        title: '赞助支持',
        text: '后端赞赏文档',
        href: 'https://github.com/wannanbigpig/gin-layout/blob/main/docs/DONATE.md',
        tone: 'tone-danger',
    },
    {
        icon: 'lucide:message-square',
        title: '前端反馈',
        text: 'Issues / Pull Requests',
        href: 'https://github.com/wannanbigpig/go-admin-ui/issues',
        tone: 'tone-primary',
    },
    {
        icon: 'lucide:message-circle',
        title: '后端反馈',
        text: 'Issues / Pull Requests',
        href: 'https://github.com/wannanbigpig/gin-layout/issues',
        tone: 'tone-primary',
    },
] as const
</script>

<style scoped lang="scss">
.about-page {
    min-height: 100%;
    background: var(--xl-main-bg-color);
}

.about-panel {
    overflow: hidden;
    border: 1px solid var(--el-border-color-light);
    border-radius: 8px;
    background: var(--xl-bg-color);
}

.about-hero {
    padding: 46px 64px 44px;
    border-bottom: 1px solid var(--el-border-color-light);
    background: radial-gradient(circle at 50% 0%, rgb(218 233 255 / 80%) 0, rgb(247 251 255 / 75%) 42%, #f8fbff 100%);
    text-align: center;

    h1 {
        margin: 26px 0 22px;
        color: var(--el-text-color-primary);
        font-size: 48px;
        font-weight: 800;
        line-height: 1.1;
        letter-spacing: 0;
    }

    h2 {
        margin: 28px 0 16px;
        color: var(--el-text-color-primary);
        font-size: 24px;
        font-weight: 700;
        line-height: 1.35;
        letter-spacing: 0;
    }

    p {
        max-width: 920px;
        margin: 0 auto;
        color: var(--el-text-color-secondary);
        font-size: 18px;
        line-height: 1.8;
        text-align: center;
    }
}

.logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 132px;
    height: 132px;
    margin: 0 auto;
    border-radius: 32px;
    background: rgb(255 255 255 / 45%);
    box-shadow:
        inset 0 1px 0 rgb(255 255 255 / 80%),
        0 18px 40px rgb(59 130 246 / 14%);
}

.logo {
    width: 86px;
    height: 86px;
    object-fit: contain;
}

.meta-list {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
}

.meta-pill {
    min-width: 112px;
    padding: 10px 22px;
    border: 1px solid #cbd5e1;
    border-radius: 999px;
    background: rgb(255 255 255 / 88%);
    color: var(--el-text-color-secondary);
    font-size: 18px;
    font-weight: 700;
    line-height: 1.25;
    box-shadow: 0 3px 8px rgb(15 23 42 / 10%);
}

.link-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
    padding: 30px;
    border-bottom: 1px solid var(--el-border-color-light);
}

.link-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 138px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 26px;
    color: var(--el-text-color-primary);
    text-align: center;
    text-decoration: none;
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;

    &:hover {
        border-color: #94a3b8;
        box-shadow: 0 14px 26px rgb(15 23 42 / 10%);
        transform: translateY(-2px);
    }

    strong {
        margin-top: 12px;
        font-size: 19px;
        line-height: 1.35;
        letter-spacing: 0;
    }

    span {
        margin-top: 10px;
        color: var(--el-text-color-secondary);
        font-size: 15px;
        line-height: 1.45;
        overflow-wrap: anywhere;
    }
}

.link-icon {
    width: 31px;
    height: 31px;
    color: var(--el-text-color-primary);
}

.tone-danger {
    color: #ef4444;
}

.tone-primary {
    color: #2563eb;
}

.content-section,
.disclaimer {
    padding: 34px 38px;
    border-bottom: 1px solid var(--el-border-color-light);

    h3 {
        margin: 0 0 22px;
        color: var(--el-text-color-primary);
        font-size: 22px;
        font-weight: 800;
        line-height: 1.35;
        letter-spacing: 0;
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 16px;
        margin: 0;
        padding-left: 22px;
        color: var(--el-text-color-secondary);
        font-size: 18px;
        line-height: 1.75;
    }

    strong {
        color: var(--el-text-color-primary);
        font-weight: 800;
    }
}

.disclaimer {
    border-bottom: 0;
    background: #fff8f2;

    p {
        margin: 0;
        color: var(--el-text-color-secondary);
        font-size: 18px;
        line-height: 1.8;
        text-indent: 2em;
    }
}

.about-page.is-dark .about-hero {
    border-bottom-color: #334155;
    background: radial-gradient(circle at 50% 0%, rgb(37 99 235 / 22%) 0, rgb(15 23 42 / 90%) 46%, #111827 100%);
}

.about-page.is-dark .logo-wrap {
    background: rgb(30 41 59 / 70%);
    box-shadow:
        inset 0 1px 0 rgb(255 255 255 / 10%),
        0 18px 40px rgb(37 99 235 / 14%);
}

.about-page.is-dark .meta-pill {
    border-color: #475569;
    background: rgb(15 23 42 / 72%);
    box-shadow: 0 3px 8px rgb(0 0 0 / 26%);
}

.about-page.is-dark .link-card:hover {
    border-color: #64748b;
    box-shadow: 0 14px 26px rgb(0 0 0 / 28%);
}

.about-page.is-dark .tone-danger {
    color: #f87171;
}

.about-page.is-dark .tone-primary {
    color: #60a5fa;
}

.about-page.is-dark .disclaimer {
    background: #1f1a16;
}

@media (min-width: 769px) and (max-width: 1100px) {
    .link-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}
</style>
