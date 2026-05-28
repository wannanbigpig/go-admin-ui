<template>
    <div class="file-explorer-layout">
        <div class="file-explorer-container xl-container" :class="{ 'is-compact': isCompact }">
            <!-- 桌面端: 内联 sidebar -->
            <template v-if="!isCompact">
                <slot name="sidebar" />
            </template>
            <!-- 移动/窄屏端: sidebar 折叠到 drawer -->
            <el-drawer v-else v-model="sidebarDrawerVisible" direction="ltr" :with-header="false" size="280px" :append-to-body="true">
                <slot name="sidebar" />
            </el-drawer>

            <main class="file-main">
                <div v-if="isCompact" class="file-compact-trigger">
                    <el-button text @click="sidebarDrawerVisible = true">
                        <el-icon><Menu /></el-icon>
                        <span class="trigger-text">{{ t('system.file.sidebarToggle') }}</span>
                    </el-button>
                </div>
                <slot name="content" />
            </main>
        </div>
        <slot name="extras" />
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Menu } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const COMPACT_BREAKPOINT = 960
const isCompact = ref(false)
const sidebarDrawerVisible = ref(false)

const updateLayout = () => {
    if (typeof window === 'undefined') return
    isCompact.value = window.innerWidth <= COMPACT_BREAKPOINT
    if (!isCompact.value) sidebarDrawerVisible.value = false
}

onMounted(() => {
    updateLayout()
    window.addEventListener('resize', updateLayout)
})

onBeforeUnmount(() => {
    window.removeEventListener('resize', updateLayout)
})
</script>

<style scoped lang="scss">
.file-explorer-layout {
    height: calc(100vh - 120px);
    padding: 10px;
}

.file-explorer-container {
    display: grid;
    grid-template-columns: 240px 1fr;
    height: 100%;
    background: var(--el-bg-color);
    border-radius: var(--xl-radius-lg);
    box-shadow: var(--el-box-shadow-light);
    overflow: hidden;
    padding: 0;

    &.is-compact {
        grid-template-columns: 1fr;
    }
}

.file-main {
    display: flex;
    flex-direction: column;
    background: var(--el-bg-color);
    min-width: 0;
    min-height: 0;
}

.file-compact-trigger {
    display: flex;
    align-items: center;
    padding: var(--xl-space-2) var(--xl-space-4);
    border-bottom: 1px solid var(--el-border-color-lighter);

    .trigger-text {
        margin-left: 6px;
    }
}
</style>
