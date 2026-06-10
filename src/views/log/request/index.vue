<template>
    <div>
        <xl-pro-table :loading="loading" :data="logList" :table-title="tableTitle" :pagination="pagination" @sort-change="handleSortChange">
            <template #search>
                <el-form class="xl-search-form" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                    <el-row id="searchForm" :gutter="20">
                        <el-col :span="5">
                            <el-form-item :label="t('log.request.requestId')" prop="request_id">
                                <el-input name="request_id" :placeholder="t('log.request.inputRequestId')" v-model.trim="queryWhere.request_id" clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="5">
                            <el-form-item :label="t('log.request.operationName')" prop="operation_name">
                                <el-input name="operation_name" :placeholder="t('log.request.inputOperationName')" v-model.trim="queryWhere.operation_name" clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="5">
                            <el-form-item :label="t('log.request.route')" prop="base_url">
                                <el-input name="base_url" :placeholder="t('log.request.inputRoute')" v-model.trim="queryWhere.base_url" clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="5">
                            <el-form-item :label="t('log.request.operatorAccount')" prop="operator_account">
                                <el-input name="operator_account" :placeholder="t('log.request.inputAccount')" v-model.trim="queryWhere.operator_account" clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="5">
                            <el-form-item :label="t('log.request.operatorId')" prop="operator_id">
                                <el-select
                                    name="operator_id"
                                    v-model="queryWhere.operator_id"
                                    filterable
                                    remote
                                    clearable
                                    reserve-keyword
                                    :remote-method="remoteSearchOperators"
                                    :loading="operatorLoading"
                                    :placeholder="t('log.request.inputOperatorId')"
                                >
                                    <el-option v-for="item in operatorOptions" :key="item.id" :label="item.nickname ? `${item.username} (${item.nickname})` : item.username" :value="item.id" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="5">
                            <el-form-item :label="t('log.request.ip')" prop="ip">
                                <el-input name="ip" :placeholder="t('log.request.inputIp')" v-model.trim="queryWhere.ip" clearable></el-input>
                            </el-form-item>
                        </el-col>
                        <el-col :span="4">
                            <el-form-item :label="t('log.request.operationStatus')" prop="operation_status">
                                <el-select name="operation_status" v-model="queryWhere.operation_status" clearable :placeholder="t('log.request.selectStatus')">
                                    <el-option :label="t('common.status.success')" :value="0" />
                                    <el-option :label="t('common.status.failed')" :value="1" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="4">
                            <el-form-item :label="t('log.request.highRisk')" prop="is_high_risk">
                                <el-select name="is_high_risk" v-model="queryWhere.is_high_risk" clearable :placeholder="t('log.request.selectHighRisk')">
                                    <el-option :label="t('common.yes')" :value="1" />
                                    <el-option :label="t('common.no')" :value="0" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="4">
                            <el-form-item :label="t('log.request.method')" prop="method">
                                <el-select name="method" v-model="queryWhere.method" clearable :placeholder="t('log.request.selectMethod')">
                                    <el-option v-for="item in methodOptions" :key="item.value" :label="item.label" :value="item.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="4">
                            <el-form-item :label="t('log.request.requestKind')" prop="request_kind">
                                <el-select name="request_kind" v-model="requestKindValue" clearable :placeholder="t('log.request.selectRequestKind')">
                                    <el-option v-for="item in requestKindOptions" :key="item.value" :label="t(item.label)" :value="item.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="4">
                            <el-form-item :label="t('log.request.executionTimeScope')" prop="execution_time_scope">
                                <el-select name="execution_time_scope" v-model="executionTimeScopeValue" clearable :placeholder="t('log.request.selectExecutionTimeScope')">
                                    <el-option v-for="item in executionTimeScopeOptions" :key="item.value" :label="t(item.label)" :value="item.value" />
                                </el-select>
                            </el-form-item>
                        </el-col>
                        <el-col :span="8">
                            <el-form-item :label="t('log.request.createdAt')" prop="dateRange">
                                <xl-date-range-picker v-model="dateRange" />
                            </el-form-item>
                        </el-col>
                        <xl-collapsible-search-btn :loading="loading" :maxShow="4" :onSearch="handleSearch" :onReset="handleReset" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                    </el-row>
                </el-form>
            </template>

            <template #actions>
                <xl-action-button type="primary" :show-icon="false" :text="t('log.request.export')" :loading="exporting" @click="exportCsv" />
                <xl-action-button type="primary" :show-icon="false" :text="t('log.request.maskConfig')" @click="openMaskConfigDialog" />
            </template>

            <template #td="{ item, val, row }">
                <el-tag v-if="item.tag" :type="item.tag[val as keyof typeof item.tag]?.type || 'info'">
                    {{ item.tag[val as keyof typeof item.tag]?.text || val }}
                </el-tag>
                <template v-else-if="item.prop === 'operation_status'">
                    <el-tag :type="Number(val) === 0 ? 'success' : 'danger'">
                        {{ Number(val) === 0 ? t('common.status.success') : t('common.status.failed') }}
                    </el-tag>
                </template>
                <template v-else-if="item.prop === 'response_status'">
                    <el-tag v-if="val !== null && val !== undefined && val !== ''" :type="getResponseStatusTagType(Number(val))">{{ val }}</el-tag>
                    <span v-else>-</span>
                </template>
                <template v-else-if="item.prop === 'execution_time_us'">
                    <div class="request-log-duration">
                        <span>{{ formatExecutionTimeDisplay(row) }}</span>
                        <el-tag size="small" effect="plain" :type="getExecutionTimeScopeTagType(row.execution_time_scope)">
                            {{ getExecutionTimeScopeText(row.execution_time_scope) }}
                        </el-tag>
                    </div>
                </template>
                <el-tooltip v-else-if="item.copy" trigger="click" effect="customized" :content="t('common.actions.copySuccess')" placement="left">
                    <span @click="copyText(String(val))" class="xl-cursor-pointer"> {{ val }}</span>
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
        </xl-pro-table>

        <!-- 详情抽屉 -->
        <el-drawer v-model="showDetailDrawer" :title="t('log.request.detailTitle')" direction="rtl" size="50%">
            <div v-loading="detailLoading" :element-loading-text="t('log.request.loadingText')" class="detail-content">
                <template v-if="currentDetail">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item :label="t('log.request.operationName')" :span="2">{{ currentDetail.operation_name || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.requestId')" :span="2">{{ currentDetail.request_id || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.operationApi')" :span="2">
                            <el-tag :type="getMethodTagType(currentDetail.method)" class="xl-m-right-10">{{ currentDetail.method || '-' }}</el-tag>
                            {{ currentDetail.base_url || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.requestKind')">
                            <el-tag v-if="currentDetail.request_kind" :type="getRequestKindTagType(currentDetail.request_kind)">
                                {{ getRequestKindText(currentDetail.request_kind) }}
                            </el-tag>
                            <span v-else>-</span>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.operationStatus')">
                            <el-tag :type="currentDetail.operation_status === 0 ? 'success' : 'danger'">
                                {{ currentDetail.operation_status === 0 ? t('common.status.success') : t('common.status.failed') }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.duration')">{{ formatExecutionTimeDisplay(currentDetail) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.executionTimeScope')">
                            <el-tag v-if="currentDetail.execution_time_scope" size="small" effect="plain" :type="getExecutionTimeScopeTagType(currentDetail.execution_time_scope)">
                                {{ getExecutionTimeScopeText(currentDetail.execution_time_scope) }}
                            </el-tag>
                            <span v-else>-</span>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.responseCode')">
                            <el-tag :type="getResponseStatusTagType(currentDetail.response_status)">{{ currentDetail.response_status || '-' }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item :label="t('common.labels.ipAddress')" :span="2">{{ formatIpAddress(currentDetail.ip, currentDetail.ip_location) }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.operatorAccount')">{{ currentDetail.operator_account || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.operatorName')">{{ currentDetail.operator_name || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.jwtId')" :span="2">{{ currentDetail.jwt_id || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.login.os')">{{ currentDetail.os || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.login.browser')">{{ currentDetail.browser || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.createdAt')" :span="2">{{ currentDetail.created_at || '-' }}</el-descriptions-item>
                        <el-descriptions-item :label="t('log.request.userAgent')" :span="2">{{ currentDetail.user_agent || '-' }}</el-descriptions-item>
                    </el-descriptions>

                    <el-divider />

                    <el-collapse v-model="activeCollapse">
                        <el-collapse-item v-if="currentDetail.request_headers" name="requestHeaders" :title="t('log.request.requestHeaders')">
                            <pre class="json-content">{{ formatJson(currentDetail.request_headers) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.request_query" name="requestQuery" :title="t('log.request.requestQuery')">
                            <pre class="json-content">{{ formatJson(currentDetail.request_query) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.request_body" name="requestBody" :title="t('log.request.requestBody')">
                            <pre class="json-content">{{ formatJson(currentDetail.request_body) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.response_header" name="responseHeader" :title="t('log.request.responseHeader')">
                            <pre class="json-content">{{ formatJson(currentDetail.response_header) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item name="responseBody" :title="t('log.request.responseBody')">
                            <pre class="json-content">{{ formatJson(currentDetail.response_body || '') }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.change_diff" name="changeDiff" :title="t('log.request.changeDiff')">
                            <pre class="json-content">{{ formatJson(currentDetail.change_diff) }}</pre>
                        </el-collapse-item>
                    </el-collapse>
                </template>
            </div>
        </el-drawer>
    </div>
</template>

<script setup lang="ts">
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlProTable from '@/components/proTable/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { computed, onMounted, ref } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useClipboard } from '@/composables/useClipboard'
import { useRequestLogPage } from '@/modules/log/useRequestLogPage'
import { getAdminUserOptions, type AdminUserOption } from '@/api/adminUser'
import { normalizeArrayData } from '@/modules/shared/response'
import { Logger } from '@/utils/logger'
import { EXECUTION_TIME_SCOPE_ALL_VALUE, EXECUTION_TIME_SCOPE_FILTER_OPTIONS, LOG_METHOD_OPTIONS, REQUEST_KIND_ALL_VALUE, REQUEST_KIND_FILTER_OPTIONS } from '@/modules/log/model'
import type { TableColumn } from '@/types/common'
import type { ExecutionTimeScope, RequestKind, RequestLog } from '@/types/log'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const { copyText } = useClipboard()
const detailButtonInfo = getButtonInfoFull('requestLog:detail')
const { t } = useI18n()
const requestKindOptions = REQUEST_KIND_FILTER_OPTIONS
const executionTimeScopeOptions = EXECUTION_TIME_SCOPE_FILTER_OPTIONS
const methodOptions = LOG_METHOD_OPTIONS

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
    exporting,
    formatJson,
    formatIpAddress,
    getMethodTagType,
    getRequestKindTagType,
    getExecutionTimeScopeTagType,
    getResponseStatusTagType,
    formatExecutionTimeDisplay,
    handleSortChange,
    handleSearch,
    handleReset,
    getList,
    openDetailDrawer,
    openMaskConfigDialog,
    exportCsv,
} = useRequestLogPage()

onMounted(() => {
    getList()
    remoteSearchOperators('')
})

const requestKindValue = computed<string>({
    get: () => queryWhere.request_kind ?? REQUEST_KIND_ALL_VALUE,
    set: (value) => {
        queryWhere.request_kind = value ? (value as RequestKind) : null
    },
})

// 操作人选择器：远程按账号/昵称搜索管理员，选中后以 user id 作为 operator_id 精确筛选。
const operatorOptions = ref<AdminUserOption[]>([])
const operatorLoading = ref(false)
const remoteSearchOperators = async (keyword: string) => {
    operatorLoading.value = true
    try {
        operatorOptions.value = normalizeArrayData<AdminUserOption>(await getAdminUserOptions(keyword))
    } catch (error) {
        Logger.error('搜索操作人失败:', error)
        operatorOptions.value = []
    } finally {
        operatorLoading.value = false
    }
}

const executionTimeScopeValue = computed<string>({
    get: () => queryWhere.execution_time_scope ?? EXECUTION_TIME_SCOPE_ALL_VALUE,
    set: (value) => {
        queryWhere.execution_time_scope = value ? (value as ExecutionTimeScope) : null
    },
})

const getRequestKindText = (kind?: RequestKind) => {
    switch (kind) {
        case 'websocket':
            return t('log.request.requestKindWebsocket')
        case 'http':
            return t('log.request.requestKindHttp')
        default:
            return '-'
    }
}

const getExecutionTimeScopeText = (scope?: ExecutionTimeScope) => {
    switch (scope) {
        case 'request':
            return t('log.request.executionTimeScopeRequest')
        case 'connection':
            return t('log.request.executionTimeScopeConnection')
        case 'none':
            return t('log.request.executionTimeScopeNone')
        default:
            return '-'
    }
}

const tableTitle = computed(
    () =>
        [
            { prop: 'id', align: 'center', h_label: t('common.labels.id'), width: 80, sortable: 'custom' },
            { prop: 'operation_name', h_label: t('log.request.operationName'), minWidth: 150, overflow: true },
            { prop: 'operator_account', h_label: t('log.request.account'), width: 120, overflow: true },
            {
                prop: 'request_kind',
                h_label: t('log.request.requestKind'),
                align: 'center',
                width: 120,
                customRow: true,
                tag: {
                    http: { type: getRequestKindTagType('http'), text: t('log.request.requestKindHttp') },
                    websocket: { type: getRequestKindTagType('websocket'), text: t('log.request.requestKindWebsocket') },
                },
            },
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
            },
            {
                prop: 'is_high_risk',
                h_label: t('log.request.highRisk'),
                align: 'center',
                width: 100,
                customRow: true,
                tag: {
                    1: { type: 'danger', text: t('common.yes') },
                    0: { type: 'info', text: t('common.no') },
                },
            },
            {
                prop: 'response_status',
                h_label: t('log.request.httpStatus'),
                align: 'center',
                width: 120,
                customRow: true,
            },
            { prop: 'execution_time_us', h_label: t('log.request.duration'), align: 'center', width: 220, sortable: 'custom', customRow: true },
            { prop: 'created_at', h_label: t('log.request.createdAt'), align: 'center', width: 160, sortable: 'custom' },
        ] as TableColumn<RequestLog>[]
)
</script>

<style lang="scss" scoped>
.request-log-duration {
    display: inline-flex;
    align-items: center;
    gap: var(--xl-space-2);
    justify-content: center;
    flex-wrap: wrap;
}

:deep(.el-form-item) {
    width: 100%;
}
.detail-content {
    padding: var(--xl-space-5);
    .json-content {
        background-color: var(--el-fill-color-light);
        padding: 15px;
        border-radius: var(--xl-radius-sm);
        font-size: var(--xl-font-sm);
        line-height: 1.6;
        overflow-x: auto;
        white-space: pre-wrap;
    }
}
</style>
