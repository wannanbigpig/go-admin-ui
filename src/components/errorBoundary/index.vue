<template>
    <div v-if="hasError" class="error-boundary-container">
        <div class="error-boundary-card">
            <el-icon class="error-boundary-icon" :size="64">
                <i-ep-circle-close-filled />
            </el-icon>
            <h2 class="error-boundary-title">{{ t('common.result.renderError') }}</h2>
            <p class="error-boundary-message">{{ t('common.result.renderErrorMessage') }}</p>
            <div class="error-boundary-actions">
                <el-button type="primary" @click="handleRetry">
                    <el-icon class="el-icon--left"><i-ep-refresh-right /></el-icon>
                    {{ t('common.actions.retry') }}
                </el-button>
                <el-button @click="handleGoHome">
                    <el-icon class="el-icon--left"><i-ep-home-filled /></el-icon>
                    {{ t('common.result.goHome') }}
                </el-button>
            </div>
        </div>
    </div>
    <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useI18n } from 'vue-i18n'
import { Logger } from '@/utils/logger'

const { t } = useI18n()
const hasError = ref(false)

onErrorCaptured((err: Error) => {
    Logger.error('[ErrorBoundary] captured error:', err)
    hasError.value = true
    // 阻止错误继续向上传播
    return false
})

const handleRetry = () => {
    window.location.reload()
}

const handleGoHome = () => {
    window.location.href = '/'
}
</script>

<style lang="scss" scoped>
.error-boundary-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 24px;
    background-color: var(--el-bg-color-page, #f5f7fa);
}

.error-boundary-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 48px 40px;
    max-width: 480px;
    width: 100%;
    background: var(--el-bg-color, #ffffff);
    border-radius: 12px;
    box-shadow: var(--el-box-shadow-light, 0 2px 12px rgba(0, 0, 0, 0.06));
}

.error-boundary-icon {
    color: var(--el-color-danger, #f56c6c);
    margin-bottom: 24px;
}

.error-boundary-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--el-text-color-primary, #303133);
    margin: 0 0 12px;
    line-height: 1.4;
}

.error-boundary-message {
    font-size: 14px;
    color: var(--el-text-color-secondary, #909399);
    margin: 0 0 32px;
    line-height: 1.6;
}

.error-boundary-actions {
    display: flex;
    gap: 12px;
}
</style>
