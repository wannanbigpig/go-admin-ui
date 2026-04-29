<template>
    <main class="about-page" :class="{ 'is-dark': isDark }">
        <section class="about-panel">
            <header class="about-hero">
                <div class="logo-wrap">
                    <img :src="logoSrc" alt="X-L-Admin" class="logo" />
                </div>

                <h1>X-L-Admin</h1>

                <div class="meta-list" :aria-label="t('about.metaAria')">
                    <span class="meta-pill">v{{ version }}</span>
                    <span class="meta-pill">{{ t('about.meta.appType') }}</span>
                </div>

                <h2>{{ t('about.hero.subtitle') }}</h2>
                <p>{{ t('about.hero.description') }}</p>
            </header>

            <section class="link-grid" :aria-label="t('about.linksAria')">
                <a v-for="item in linkCards" :key="item.key" class="link-card" :href="item.href" target="_blank" rel="noopener noreferrer">
                    <Icon :icon="item.icon" class="link-icon" :class="item.tone" />
                    <strong>{{ item.title }}</strong>
                    <span>{{ item.text }}</span>
                </a>
            </section>

            <section class="content-section">
                <h3>{{ t('about.purpose.title') }}</h3>
                <ul>
                    <li>
                        {{ t('about.purpose.items.foundation.prefix') }}
                        <strong>{{ t('about.purpose.items.foundation.strong') }}</strong>
                        {{ t('about.purpose.items.foundation.suffix') }}
                    </li>
                    <li>
                        {{ t('about.purpose.items.production.prefix') }}
                        <strong>{{ t('about.purpose.items.production.strong') }}</strong>
                        {{ t('about.purpose.items.production.suffix') }}
                    </li>
                    <li>{{ t('about.purpose.items.baseline') }}</li>
                </ul>
            </section>

            <section class="content-section">
                <h3>{{ t('about.risk.title') }}</h3>
                <ul>
                    <li>
                        {{ t('about.risk.items.check.prefix') }}
                        <strong>{{ t('about.risk.items.check.strong') }}</strong>
                        {{ t('about.risk.items.check.suffix') }}
                    </li>
                    <li>{{ t('about.risk.items.responsibility') }}</li>
                </ul>
            </section>

            <section class="disclaimer">
                <h3>{{ t('about.disclaimer.title') }}</h3>
                <p>
                    {{ t('about.disclaimer.prefix') }}
                    <strong>{{ t('about.disclaimer.strong') }}</strong>
                    {{ t('about.disclaimer.suffix') }}
                </p>
            </section>
        </section>
    </main>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import logoSrc from '@/assets/images/logo-frontend.png'
import appPackage from '../../../package.json'

const { t } = useI18n()
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

const linkCards = computed(() => [
    {
        key: 'author',
        icon: 'lucide:user-round',
        title: t('about.links.author.title'),
        text: t('about.links.author.text'),
        href: 'https://github.com/wannanbigpig',
        tone: 'tone-default',
    },
    {
        key: 'frontendRepo',
        icon: 'lucide:github',
        title: t('about.links.frontendRepo.title'),
        text: t('about.links.frontendRepo.text'),
        href: 'https://github.com/wannanbigpig/go-admin-ui',
        tone: 'tone-default',
    },
    {
        key: 'backendRepo',
        icon: 'lucide:server',
        title: t('about.links.backendRepo.title'),
        text: t('about.links.backendRepo.text'),
        href: 'https://github.com/wannanbigpig/gin-layout',
        tone: 'tone-default',
    },
    {
        key: 'sponsor',
        icon: 'lucide:heart',
        title: t('about.links.sponsor.title'),
        text: t('about.links.sponsor.text'),
        href: 'https://github.com/wannanbigpig/gin-layout/blob/main/docs/DONATE.md',
        tone: 'tone-danger',
    },
    {
        key: 'frontendFeedback',
        icon: 'lucide:message-square',
        title: t('about.links.frontendFeedback.title'),
        text: t('about.links.frontendFeedback.text'),
        href: 'https://github.com/wannanbigpig/go-admin-ui/issues',
        tone: 'tone-primary',
    },
    {
        key: 'backendFeedback',
        icon: 'lucide:message-circle',
        title: t('about.links.backendFeedback.title'),
        text: t('about.links.backendFeedback.text'),
        href: 'https://github.com/wannanbigpig/gin-layout/issues',
        tone: 'tone-primary',
    },
])
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
