<template>
    <div class="xl-container about-container" :class="{ 'is-dark': isDark }">
        <header class="about-hero">
            <div class="logo-wrap">
                <img :src="logoSrc" alt="X-L-Admin" class="logo" />
            </div>

            <h1>X-L-Admin</h1>

            <div class="meta-list" :aria-label="t('about.metaAria')">
                <el-tag size="default" effect="plain" round>v{{ version }}</el-tag>
                <el-tag size="default" effect="plain" type="info" round>{{ t('about.meta.appType') }}</el-tag>
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
    </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import logoSrc from '@/assets/images/gin-layout-mark.svg'

const { t } = useI18n()
const version = __APP_VERSION__
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
.about-container {
    box-sizing: border-box;
    width: 100%;
    max-width: 100%;

    *,
    *::before,
    *::after {
        box-sizing: border-box;
    }
}

.about-hero {
    padding: 12px 0 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    text-align: center;

    h1 {
        margin: 12px 0 8px;
        color: var(--el-text-color-primary);
        font-size: 22px;
        font-weight: 700;
        line-height: 1.25;
        letter-spacing: -0.01em;
    }

    h2 {
        margin: 0 0 6px;
        color: var(--el-text-color-primary);
        font-size: 15px;
        font-weight: 600;
        line-height: 1.4;
    }

    p {
        max-width: 720px;
        margin: 0 auto;
        color: var(--el-text-color-secondary);
        font-size: 13px;
        line-height: 1.6;
        text-align: center;
    }
}

.logo-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 60px;
    margin: 0 auto;
    border-radius: 14px;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
}

.logo {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.meta-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
    margin-bottom: 12px;
}

.link-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    padding: 18px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
}

.link-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 84px;
    padding: 12px 10px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 8px;
    background: var(--el-fill-color-blank);
    color: var(--el-text-color-primary);
    text-align: center;
    text-decoration: none;
    transition:
        border-color 0.2s ease,
        box-shadow 0.2s ease,
        transform 0.2s ease;

    &:hover {
        border-color: var(--el-color-primary-light-5);
        box-shadow: 0 4px 12px var(--xl-shadow-color, rgba(0, 0, 0, 0.06));
        transform: translateY(-1px);
    }

    strong {
        margin-top: 6px;
        font-size: 13px;
        font-weight: 600;
        line-height: 1.35;
    }

    span {
        margin-top: 3px;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        line-height: 1.4;
        overflow-wrap: anywhere;
    }
}

.link-icon {
    width: 22px;
    height: 22px;
    color: var(--el-text-color-primary);
}

.tone-danger {
    color: #ef4444;
}

.tone-primary {
    color: #2563eb;
}

.content-section {
    padding: 18px 0;
    border-bottom: 1px solid var(--el-border-color-lighter);

    h3 {
        margin: 0 0 10px;
        color: var(--el-text-color-primary);
        font-size: 15px;
        font-weight: 600;
        line-height: 1.4;
    }

    ul {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin: 0;
        padding-left: 18px;
        color: var(--el-text-color-regular);
        font-size: 13px;
        line-height: 1.6;
    }

    strong {
        color: var(--el-text-color-primary);
        font-weight: 600;
    }
}

.disclaimer {
    margin-top: 18px;
    padding: 14px 18px;
    border-radius: 8px;
    background: var(--el-color-warning-light-9);
    border: 1px solid var(--el-color-warning-light-7);

    h3 {
        margin: 0 0 6px;
        color: var(--el-color-warning-dark-2, var(--el-text-color-primary));
        font-size: 14px;
        font-weight: 600;
    }

    p {
        margin: 0;
        color: var(--el-text-color-regular);
        font-size: 13px;
        line-height: 1.6;
    }
}

.about-container.is-dark .link-card:hover {
    border-color: var(--el-color-primary-light-3);
    box-shadow: 0 6px 16px rgb(0 0 0 / 25%);
}

.about-container.is-dark .tone-danger {
    color: #f87171;
}

.about-container.is-dark .tone-primary {
    color: #60a5fa;
}

.about-container.is-dark .disclaimer {
    background: var(--el-color-warning-light-9);
    border-color: var(--el-color-warning-light-7);
}

@media (max-width: 960px) {
    .link-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }
}

@media (max-width: 600px) {
    .link-grid {
        grid-template-columns: 1fr;
    }
}
</style>
