<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form ref="cronQueryFormRef" class="xl-search-form" :model="cronQuery" @submit.prevent="handleCronSearch" @keydown.enter.prevent="handleCronSearch">
                <el-row id="cronSearchForm" :gutter="20">
                    <el-col :span="5">
                        <el-form-item :label="t('system.task.code')" prop="task_code">
                            <el-input v-model.trim="cronQuery.task_code" :placeholder="t('system.task.codePlaceholder')" clearable />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('common.labels.status')" prop="last_status">
                            <el-select v-model="cronQuery.last_status" clearable>
                                <el-option v-for="item in taskRunStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="cronLoading" :maxShow="2" :onSearch="handleCronSearch" :onReset="handleCronReset" :modelRef="cronQueryFormRef" nodeName="#cronSearchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <xl-table-list :loading="cronLoading" :data="cronList" :tableTitle="cronTableTitle" :pagination="cronPagination">
                <template #td="{ item, val }">
                    <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                        {{ item.tag[val as string | number]?.text || val }}
                    </el-tag>
                    <span v-else>{{ val }}</span>
                </template>
            </xl-table-list>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { type FormInstance } from 'element-plus'
import { useI18n } from 'vue-i18n'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import { useListPage } from '@/composables/useListPage'
import { useDictOptions } from '@/composables/useDictOptions'
import { createCronTaskStateQuery } from '@/modules/system/model'
import { SYSTEM_DICT_TYPES, taskRunStatusFallbackOptions } from '@/modules/system/dictOptions'
import { fetchCronTaskStateList } from '@/modules/system/service'
import { Logger } from '@/utils/logger'
import type { TableColumn } from '@/types/common'
import type { CronTaskState } from '@/types/system'

const { t } = useI18n()
const { options: taskRunStatusOptions, tagMap: taskRunStatusTagMap, load: loadTaskRunStatusOptions } = useDictOptions(SYSTEM_DICT_TYPES.taskRunStatus, taskRunStatusFallbackOptions)

const cronQueryFormRef = ref<FormInstance>()
const cronQuery = reactive(createCronTaskStateQuery())

const {
    loading: cronLoading,
    items: cronList,
    pagination: cronPagination,
    getList: getCronList,
    handleSearch: handleCronSearch,
    handleReset: handleCronReset,
} = useListPage<CronTaskState, typeof cronQuery>({
    query: cronQuery,
    queryFormRef: cronQueryFormRef,
    fetcher: async (params) => {
        try {
            return await fetchCronTaskStateList(params)
        } catch (error) {
            Logger.error('获取定时任务状态失败:', error)
            return {
                list: [],
                total: 0,
                page: params.page ?? 1,
                pageSize: params.per_page ?? 10,
            }
        }
    },
})

const cronTableTitle = computed(
    () =>
        [
            { prop: 'id', h_label: t('common.labels.id'), width: 80, align: 'center' },
            { prop: 'task_code', h_label: t('system.task.code'), minWidth: 160, overflow: true },
            { prop: 'cron_spec', h_label: t('system.task.cronSpec'), minWidth: 180, overflow: true },
            {
                prop: 'last_status',
                h_label: t('system.task.lastStatus'),
                width: 120,
                align: 'center',
                customRow: true,
                tag: taskRunStatusTagMap.value,
            },
            { prop: 'next_run_at', h_label: t('system.task.nextRunAt'), width: 160, align: 'center' },
            { prop: 'last_started_at', h_label: t('system.task.startedAt'), width: 160, align: 'center' },
            { prop: 'last_finished_at', h_label: t('system.task.finishedAt'), width: 160, align: 'center' },
            { prop: 'last_error', h_label: t('system.task.lastError'), minWidth: 200, overflow: true },
        ] as TableColumn<CronTaskState>[]
)

onMounted(async () => {
    await loadTaskRunStatusOptions()
    await getCronList()
})
</script>

<style scoped lang="scss">
:deep(.el-form-item) {
    width: 100%;
}
</style>
