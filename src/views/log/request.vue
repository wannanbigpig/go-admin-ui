<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item :label="t('log.request.operationName')" prop="operation_name">
                            <el-input :placeholder="t('log.request.inputOperationName')" v-model.trim="queryWhere.operation_name" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item :label="t('log.request.route')" prop="base_url">
                            <el-input :placeholder="t('log.request.inputRoute')" v-model.trim="queryWhere.base_url" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('log.request.operationStatus')" prop="operation_status">
                            <el-select v-model="queryWhere.operation_status" clearable :placeholder="t('log.request.selectStatus')">
                                <el-option :label="t('common.status.success')" :value="0" />
                                <el-option :label="t('common.status.failed')" :value="1" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('log.request.operatorAccount')" prop="operator_account">
                            <el-input :placeholder="t('log.request.inputAccount')" v-model.trim="queryWhere.operator_account" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item :label="t('log.request.createdAt')" prop="dateRange">
                            <xl-date-range-picker v-model="dateRange" />
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="6" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <xl-table-list :loading="loading" :data="logList" :tableTitle="tableTitle" :pagination="pagination">
                <template #td="{ item, val }">
                    <el-tag v-if="item.tag" :type="item.tag[val as keyof typeof item.tag]?.type || 'info'">
                        {{ item.tag[val as keyof typeof item.tag]?.text || val }}
                    </el-tag>
                    <el-tooltip v-else-if="item.copy" trigger="click" effect="customized" :content="t('common.actions.copySuccess')" placement="left">
                        <span @click="handleCopyClick(String(val))" class="xl-cursor-pointer"> {{ val }}</span>
                    </el-tooltip>
                    <span v-else>
                        {{ val }}
                    </span>
                </template>
                <template #operation>
                    <el-table-column width="100" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-button v-permission="'requestLog:detail'" :button-info="detailButtonInfo" type="primary" link :show-icon="false" @click="openDetailDrawer(scope.row)" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>

        <!-- 详情抽屉 -->
        <el-drawer v-model="showDetailDrawer" :title="t('log.request.detailTitle')" direction="rtl" size="50%">
            <div v-loading="detailLoading" :element-loading-text="t('log.request.loadingText')" class="detail-content">
                <template v-if="currentDetail">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item :label="t('log.request.operationName')" :span="2">{{ currentDetail.operation_name || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.operationApi')" :span="2">
                            <el-tag :type="getMethodTagType(currentDetail.method)" class="xl-m-right-10">{{ currentDetail.method || '-' }}</el-tag>
                            {{ currentDetail.base_url || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.operationStatus')">
                            <el-tag :type="currentDetail.operation_status === 0 ? 'success' : 'danger'">
                                {{ currentDetail.operation_status === 0 ? t('common.status.success') : t('common.status.failed') }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.durationMs')">{{ currentDetail.execution_time || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.responseCode')">
                            <el-tag :type="getResponseStatusTagType(currentDetail.response_status)">{{ currentDetail.response_status || '-' }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('common.labels.ipAddress')" :span="2">{{ formatIpAddress(currentDetail.ip, currentDetail.ip_location) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.operatorAccount')">{{ currentDetail.operator_account || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.operatorName')">{{ currentDetail.operator_name || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.createdAt')" :span="2">{{ currentDetail.created_at || '-' }}</el-descriptions-item>
                    </el-descriptions>

                    <el-divider />

                    <el-collapse v-model="activeCollapse">
                        <el-collapse-item v-if="currentDetail.request_query" name="requestQuery" :title="t('log.request.requestQuery')">
                            <pre class="json-content">{{ formatJson(currentDetail.request_query) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.request_body" name="requestBody" :title="t('log.request.requestBody')">
                            <pre class="json-content">{{ formatJson(currentDetail.request_body) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.response_body" name="responseBody" :title="t('log.request.responseBody')">
                            <pre class="json-content">{{ formatJson(currentDetail.response_body) }}</pre>
                        </el-collapse-item>
                    </el-collapse>
                </template>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { computed, onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useRequestLogPage } from '@/modules/log/useRequestLogPage'
import type { TableColumn } from '@/types/common'
import type { RequestLog } from '@/types/log'
import { Logger } from '@/utils/logger'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const detailButtonInfo = getButtonInfoFull('requestLog:detail')
const { t } = useI18n()

const {
    loading,
    logList,
    pagination,
    queryFormRef,
    queryWhere,
    dateRange,
    showDetailDrawer,
    currentDetail,
    detailLoading,
    activeCollapse,
    formatJson,
    formatIpAddress,
    getMethodTagType,
    getResponseStatusTagType,
    handleSearch,
    getList,
    openDetailDrawer,
} = useRequestLogPage()

const handleCopyClick = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
    } catch (error) {
        Logger.error('复制失败:', error)
    }
}

onMounted(() => {
    getList()
})

const tableTitle = computed(
    () =>
        [
            { prop: 'id', align: 'center', h_label: t('common.labels.id'), width: 80 },
            { prop: 'operation_name', h_label: t('log.request.operationName'), minWidth: 150, overflow: true },
            { prop: 'operator_account', h_label: t('log.request.account'), width: 120, overflow: true },
            {
                prop: 'method',
                h_label: t('log.request.method'),
                align: 'center',
                width: 100,
                customRow: true,
                tag: {
                    GET: { type: 'success', text: 'GET' },
                    POST: { type: 'primary', text: 'POST' },
                    PUT: { type: 'warning', text: 'PUT' },
                    DELETE: { type: 'danger', text: 'DELETE' },
                },
            },
            { prop: 'base_url', h_label: t('log.request.route'), minWidth: 200, overflow: true, copy: true, customRow: true },
            {
                prop: 'operation_status',
                h_label: t('log.request.status'),
                align: 'center',
                width: 100,
                customRow: true,
                tag: {
                    0: { type: 'success', text: t('common.status.success') },
                    1: { type: 'danger', text: t('common.status.failed') },
                },
            },
            { prop: 'execution_time', h_label: t('log.request.durationMs'), align: 'center', width: 100 },
            { prop: 'created_at', h_label: t('log.request.createdAt'), align: 'center', width: 160 },
        ] as TableColumn<RequestLog>[]
)
</script>

<style lang="scss" scoped>
.el-form-item {
    width: 100% !important;
}
.detail-content {
    padding: 20px;
    .json-content {
        background-color: var(--el-fill-color-light);
        padding: 15px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.6;
        overflow-x: auto;
        white-space: pre-wrap;
    }
}
</style>
