<template>
    <router-view v-slot="{ Component }">
        <transition
            class="xl-main-transition animate__animated"
            :enter-active-class="routeMetaAnimateEnter"
            :leave-active-class="routeMetaAnimateLeave"
            :style="{ animationDuration: routeMetaAnimateDuration }"
            mode="out-in"
            appear
        >
            <div class="xl-main-inner" :key="refreshStore.key">
                <div class="xl-main-content" id="main-content" tabindex="-1">
                    <Suspense>
                        <component :is="Component" @vue:updated="renderComplete" />
                        <template #fallback>
                            <div class="xl-main-loading">
                                <el-skeleton :rows="8" animated />
                            </div>
                        </template>
                    </Suspense>
                </div>
                <!-- 底部说明 -->
                <div class="xl-main-footer">
                    <p>
                        Copyright © {{ currentYear }}
                        <a href="https://github.com/wannanbigpig" target="_blank" rel="noopener noreferrer" class="footer-link"> {{ t('layout.footer.author') }} </a>
                        . All rights reserved.
                    </p>
                    <p>{{ t('layout.footer.poweredBy') }}</p>
                </div>
            </div>
        </transition>
    </router-view>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRefreshStore } from '@/stores/refresh'
import { useI18n } from 'vue-i18n'

// ==================== Store ====================
const refreshStore = useRefreshStore()
const route = useRoute()
const { t } = useI18n()

// ==================== 计算属性 ====================
/** 路由动画持续时间 */
const routeMetaAnimateDuration = computed(() => {
    const duration = route.meta?.animate_duration || '0.3'
    return `${duration}s`
})

/** 路由进入动画类名 */
const routeMetaAnimateEnter = computed(() => {
    return route.meta?.animate_enter || 'animate__fadeIn'
})

/** 路由离开动画类名 */
const routeMetaAnimateLeave = computed(() => {
    return route.meta?.animate_leave || 'animate__fadeOut'
})

/** 当前年份 */
const currentYear = computed(() => {
    return new Date().getFullYear()
})

// ==================== 方法 ====================
/**
 * 处理组件渲染完成
 * 将刷新状态设置为 false
 */
const renderComplete = () => {
    refreshStore.isRefreshing = false
}

// ==================== 监听器 ====================
/**
 * 监听刷新 key 变化
 * 当 key 变化时，设置刷新状态为 true
 */
watch(
    () => refreshStore.key,
    () => {
        refreshStore.isRefreshing = true
    }
)
</script>

<style scoped lang="scss">
.xl-main-inner {
    display: flex;
    flex-direction: column;
    min-height: calc(100vh - $xl-header-height - $xl-main-padding * 2 - $xl-main-inner-padding * 2);
}

.xl-main-content {
    flex: 1;
    &:focus {
        outline: none;
    }
}

.xl-main-loading {
    padding: 10px;
    border-radius: 8px;
    background: var(--xl-bg-color);
}

.xl-main-footer {
    flex-shrink: 0;
    margin-top: 40px;
    padding-top: 20px;
    // padding-bottom: 20px;
    // border-top: 1px solid var(--el-border-color-lighter);
    text-align: center;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    line-height: 1.8;

    p {
        margin: 4px 0;
    }

    .footer-link {
        color: var(--el-color-primary);
        text-decoration: none;
        transition: color 0.3s;

        &:hover {
            color: var(--el-color-primary-light-3);
            text-decoration: underline;
        }
    }
}
</style>
