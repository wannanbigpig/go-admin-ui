<template>
    <div>
        <div class="xl-container xl-m-bottom-10 task-page-heading">
            <h2>{{ t('system.task.operationsTitle') }}</h2>
            <p>{{ activeTabDescription }}</p>
        </div>

        <el-tabs v-model="activeTab" class="xl-container xl-tabs xl-m-bottom-10">
            <el-tab-pane :label="t('system.task.definitionTab')" name="definition" />
            <el-tab-pane :label="t('system.task.runTab')" name="run" />
            <el-tab-pane :label="t('system.task.cronTab')" name="cron" />
        </el-tabs>

        <KeepAlive>
            <TaskDefinitionPanel v-if="activeTab === 'definition'" key="definition" @triggered="handleTriggered" />
            <TaskRunPanel v-else-if="activeTab === 'run'" key="run" ref="runPanelRef" :active="activeTab === 'run'" />
            <CronStatePanel v-else-if="activeTab === 'cron'" key="cron" />
        </KeepAlive>
    </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import TaskDefinitionPanel from '../components/TaskDefinitionPanel.vue'
import TaskRunPanel from '../components/TaskRunPanel.vue'
import CronStatePanel from '../components/CronStatePanel.vue'

type TaskTab = 'definition' | 'run' | 'cron'

const DEFAULT_TASK_TAB: TaskTab = 'definition'
const TASK_TABS: TaskTab[] = ['definition', 'run', 'cron']

const { t } = useI18n()
const route = useRoute()
const router = useRouter()

const normalizeTaskTab = (value: unknown): TaskTab => {
    if (typeof value !== 'string') return DEFAULT_TASK_TAB
    return TASK_TABS.includes(value as TaskTab) ? (value as TaskTab) : DEFAULT_TASK_TAB
}

const activeTab = ref<TaskTab>(normalizeTaskTab(route.query.tab))
const runPanelRef = ref<InstanceType<typeof TaskRunPanel> | null>(null)
const activeTabDescription = computed(() => t(`system.task.tabDescriptions.${activeTab.value}`))

const syncTabToRoute = (tab: TaskTab) => {
    if (route.query.tab === tab) return
    void router.replace({
        query: {
            ...route.query,
            tab,
        },
    })
}

const handleTriggered = () => {
    runPanelRef.value?.refresh?.()
}

watch(
    () => route.query.tab,
    (value) => {
        const nextTab = normalizeTaskTab(value)
        if (nextTab !== activeTab.value) {
            activeTab.value = nextTab
        }
    }
)

watch(
    activeTab,
    (tab) => {
        syncTabToRoute(tab)
    },
    { immediate: true }
)
</script>

<style scoped lang="scss">
.task-page-heading {
    h2 {
        margin: 0;
        color: var(--el-text-color-primary);
        font-size: var(--xl-font-xl);
    }

    p {
        margin: 6px 0 0;
        color: var(--el-text-color-secondary);
        font-size: var(--xl-font-sm);
        line-height: 1.5;
    }
}
</style>
