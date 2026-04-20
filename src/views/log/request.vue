<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="操作名称" prop="operation_name">
                            <el-input placeholder="请输入操作名称" v-model.trim="queryWhere.operation_name" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item label="接口路由" prop="base_url">
                            <el-input placeholder="请输入接口路由" v-model.trim="queryWhere.base_url" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="操作状态" prop="operation_status">
                            <el-select v-model="queryWhere.operation_status" clearable placeholder="请选择状态">
                                <el-option label="成功" :value="0" />
                                <el-option label="失败" :value="1" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="操作账号" prop="operator_account">
                            <el-input placeholder="操作账号" v-model.trim="queryWhere.operator_account" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="创建时间" prop="dateRange">
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
                    <el-tooltip v-else-if="item.copy" trigger="click" effect="customized" content="复制成功" placement="left">
                        <span @click="handleCopyClick(String(val))" class="xl-cursor-pointer"> {{ val }}</span>
                    </el-tooltip>
                    <span v-else>
                        {{ val }}
                    </span>
                </template>
                <template #operation>
                    <el-table-column width="100" label="操作" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-button v-permission="'requestLog:detail'" :button-info="detailButtonInfo" type="primary" link :show-icon="false" @click="openDetailDrawer(scope.row)" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>

        <!-- 详情抽屉 -->
        <el-drawer v-model="showDetailDrawer" title="操作日志详细信息" direction="rtl" size="50%">
            <div v-loading="detailLoading" element-loading-text="加载中..." class="detail-content">
                <template v-if="currentDetail">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="操作名称" :span="2">{{ currentDetail.operation_name || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="操作接口" :span="2">
                            <el-tag :type="getMethodTagType(currentDetail.method)" class="xl-m-right-10">{{ currentDetail.method || '-' }}</el-tag>
                            {{ currentDetail.base_url || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="操作状态">
                            <el-tag :type="currentDetail.operation_status === 0 ? 'success' : 'danger'">
                                {{ currentDetail.operation_status === 0 ? '成功' : '失败' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="耗时(ms)">{{ currentDetail.execution_time || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="响应代码">
                            <el-tag :type="getResponseStatusTagType(currentDetail.response_status)">{{ currentDetail.response_status || '-' }}</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="IP地址" :span="2">{{ formatIpAddress(currentDetail.ip, currentDetail.ip_location) }}</el-descriptions-item>
                        <el-descriptions-item label="操作账号">{{ currentDetail.operator_account || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="操作人员">{{ currentDetail.operator_name || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="创建时间" :span="2">{{ currentDetail.created_at || '-' }}</el-descriptions-item>
                    </el-descriptions>

                    <el-divider />

                    <el-collapse v-model="activeCollapse">
                        <el-collapse-item v-if="currentDetail.request_query" name="requestQuery" title="请求查询参数">
                            <pre class="json-content">{{ formatJson(currentDetail.request_query) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.request_body" name="requestBody" title="请求体">
                            <pre class="json-content">{{ formatJson(currentDetail.request_body) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.response_body" name="responseBody" title="响应体">
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
import { onMounted } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useRequestLogPage } from '@/modules/log/useRequestLogPage'
import type { TableColumn } from '@/types/common'
import type { RequestLog } from '@/types/log'
import { Logger } from '@/utils/logger'

const { getButtonInfoFull } = usePermission()
const detailButtonInfo = getButtonInfoFull('requestLog:detail')

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

const tableTitle: TableColumn<RequestLog>[] = [
    { prop: 'id', align: 'center', h_label: 'ID', width: 80 },
    { prop: 'operation_name', h_label: '操作名称', minWidth: 150, overflow: true },
    { prop: 'operator_account', h_label: '账号', width: 120, overflow: true },
    {
        prop: 'method',
        h_label: '方法',
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
    { prop: 'base_url', h_label: '路由', minWidth: 200, overflow: true, copy: true, customRow: true },
    {
        prop: 'operation_status',
        h_label: '状态',
        align: 'center',
        width: 100,
        customRow: true,
        tag: {
            0: { type: 'success', text: '成功' },
            1: { type: 'danger', text: '失败' },
        },
    },
    { prop: 'execution_time', h_label: '耗时(ms)', align: 'center', width: 100 },
    { prop: 'created_at', h_label: '创建时间', align: 'center', width: 160 },
]
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
