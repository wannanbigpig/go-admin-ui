<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere">
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
                        <el-form-item label="请求方法" prop="method">
                            <el-select v-model="queryWhere.method" clearable placeholder="请选择请求方法">
                                <el-option v-for="item in METHOD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="操作状态" prop="operation_status">
                            <el-select v-model="queryWhere.operation_status" clearable placeholder="请选择操作状态">
                                <el-option label="成功" :value="0" />
                                <el-option label="失败" :value="1" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="操作账号" prop="operator_account">
                            <el-input placeholder="请输入操作账号" v-model.trim="queryWhere.operator_account" clearable></el-input>
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

        <div class="xl-container" v-loading="loading" element-loading-text="数据全力加载中..." element-loading-custom-class="xl-loading">
            <xl-table-list :data="logList" :tableTitle="tableTitle" :pagination="pagination">
                <!-- 渲染表格列的内容 -->
                <template #td="{ item, val }">
                    <el-icon v-if="item.icon" :color="item.icon[val]?.color">
                        <xl-icon :icon="item.icon[val]?.text" />
                    </el-icon>
                    <el-tag v-else-if="item.tag" :type="item.tag[val]?.type || item.tag['other']?.type">
                        {{ item.tag[val]?.text || val }}
                    </el-tag>
                    <el-tooltip v-else-if="item.copy" trigger="click" effect="customized" content="复制成功" placement="left">
                        <span @click="handleCopyClick(val)" class="xl-cursor-pointer"> {{ val }}</span>
                    </el-tooltip>
                    <span v-else>
                        {{ val }}
                    </span>
                </template>
                <!-- 操作列 -->
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
            <template #header="{ titleId, titleClass }">
                <h4 :id="titleId" :class="titleClass">操作日志详细信息</h4>
            </template>
            <div v-loading="detailLoading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.8)" class="detail-content">
                <template v-if="currentDetail">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="操作名称" :span="2">
                            {{ currentDetail.operation_name || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="操作接口" :span="2">
                            <el-tag :type="getMethodTagType(currentDetail.method)" class="xl-m-right-10">
                                {{ currentDetail.method || '-' }}
                            </el-tag>
                            {{ currentDetail.base_url || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="操作状态">
                            <el-tag :type="currentDetail.operation_status === 0 ? 'success' : 'danger'">
                                {{ currentDetail.operation_status_name || (currentDetail.operation_status === 0 ? '成功' : '失败') }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="耗时ms">
                            {{ currentDetail.execution_time || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="响应代码">
                            <el-tag :type="getResponseStatusTagType(currentDetail.response_status)">
                                {{ currentDetail.response_status || '-' }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="IP地址" :span="2">
                            {{ formatIpAddress(currentDetail.ip, currentDetail.ip_location) }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.browser" label="浏览器信息" :span="2">
                            {{ currentDetail.browser || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.os" label="操作系统" :span="2">
                            {{ currentDetail.os || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="操作账号">
                            {{ currentDetail.operator_account || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="操作人员">
                            {{ currentDetail.operator_name || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="JWT ID">
                            {{ currentDetail.jwt_id || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="创建时间">
                            {{ currentDetail.created_at || '-' }}
                        </el-descriptions-item>
                    </el-descriptions>

                    <el-divider />

                    <el-collapse v-model="activeCollapse">
                        <el-collapse-item v-if="currentDetail.request_query" name="requestQuery" title="请求查询参数">
                            <pre class="json-content">{{ formatJson(currentDetail.request_query) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.request_headers" name="requestHeaders" title="请求头">
                            <pre class="json-content">{{ formatJson(currentDetail.request_headers) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.request_body" name="requestBody" title="请求体">
                            <pre class="json-content">{{ formatJson(currentDetail.request_body) }}</pre>
                        </el-collapse-item>
                        <el-collapse-item v-if="currentDetail.response_header" name="responseHeader" title="响应头">
                            <pre class="json-content">{{ formatJson(currentDetail.response_header) }}</pre>
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

<style lang="scss" scoped>
.el-form-item {
    width: 100% !important;
}

.detail-content {
    padding: 20px 0;

    .json-content {
        background-color: var(--el-fill-color-light);
        padding: 15px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.6;
        overflow-x: auto;
        margin: 0;
        white-space: pre-wrap;
        word-wrap: break-word;
    }
}
</style>

<script setup>
import { Icon as XlIcon } from '@iconify/vue'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { getRequestLogList, getRequestLogDetail } from '@/api/log'
import { filterNullUndefined } from '@/utils/helper'
import { onMounted, reactive, ref } from 'vue'
import Clipboard from 'clipboard'
import { ElMessage } from 'element-plus'
import { usePermission } from '@/composables/usePermission'

// ==================== 权限相关 ====================
const { getButtonInfoFull } = usePermission()
const detailButtonInfo = getButtonInfoFull('requestLog:detail')

// ==================== 常量定义 ====================
/** HTTP 请求方法选项 */
const METHOD_OPTIONS = [
    { value: 'POST', label: 'POST' },
    { value: 'GET', label: 'GET' },
    { value: 'PUT', label: 'PUT' },
    { value: 'DELETE', label: 'DELETE' },
    { value: 'OPTIONS', label: 'OPTIONS' },
    { value: 'HEAD', label: 'HEAD' },
    { value: 'PATCH', label: 'PATCH' },
]

// ==================== 工具函数 ====================
/**
 * 复制文本到剪贴板
 */
const handleCopyClick = (text) => {
    Clipboard.copy(text)
}

/**
 * 打开详情抽屉
 */
const openDetailDrawer = async (row) => {
    showDetailDrawer.value = true
    detailLoading.value = true
    activeCollapse.value = []
    currentDetail.value = null

    try {
        const res = await getRequestLogDetail(row.id)
        currentDetail.value = res.data
    } catch (error) {
        console.error('获取请求日志详情失败:', error)
        ElMessage.error('获取请求日志详情失败')
        showDetailDrawer.value = false
    } finally {
        detailLoading.value = false
    }
}

/**
 * 获取请求方法的标签类型
 */
const getMethodTagType = (method) => {
    const typeMap = {
        GET: 'success',
        POST: 'primary',
        PUT: 'warning',
        DELETE: 'danger',
        PATCH: 'info',
    }
    return typeMap[method] || ''
}

/**
 * 获取响应状态的标签类型
 */
const getResponseStatusTagType = (status) => {
    if (!status) return ''
    if (status === 200) return 'success'
    if ([400, 404].includes(status)) return 'warning'
    if ([401, 403, 500].includes(status)) return 'danger'
    return ''
}

/**
 * 格式化JSON字符串
 */
const formatJson = (jsonStr) => {
    if (!jsonStr) return '{}'
    try {
        const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
        return JSON.stringify(obj, null, 2)
    } catch {
        return jsonStr
    }
}

/**
 * 格式化IP地址显示（包含IP所在地）
 */
const formatIpAddress = (ip, ipLocation) => {
    if (!ip) return '-'
    if (ipLocation) {
        return `${ip} ${ipLocation}`
    }
    return ip
}

// ==================== 响应式数据 ====================
// 列表相关
const loading = ref(false)
const logList = ref([])
const queryFormRef = ref(null)
const dateRange = ref(null)

// 详情抽屉相关
const showDetailDrawer = ref(false)
const currentDetail = ref(null)
const activeCollapse = ref([])
const detailLoading = ref(false)

// ==================== 查询相关 ====================
const queryWhere = reactive({
    page: 1,
    per_page: 10,
    operation_name: null,
    method: null,
    base_url: null,
    operation_status: null,
    operator_account: null,
    start_time: null,
    end_time: null,
})

const pagination = reactive({
    total: 0,
    page: 1,
    page_size: 10,
    pageSizeChange: (val) => {
        queryWhere.per_page = val
        getList()
    },
    pageChange: (val) => {
        queryWhere.page = val
        getList()
    },
})

/**
 * 搜索
 */
const handleSearch = () => {
    queryWhere.page = 1 // 搜索时重置到第一页
    // 处理日期范围
    if (dateRange.value && Array.isArray(dateRange.value) && dateRange.value.length === 2) {
        queryWhere.start_time = dateRange.value[0]
        queryWhere.end_time = dateRange.value[1]
    } else {
        queryWhere.start_time = null
        queryWhere.end_time = null
    }
    getList()
}

// ==================== 列表相关 ====================
/**
 * 获取请求日志列表
 */
const getList = async () => {
    loading.value = true

    try {
        const res = await getRequestLogList(filterNullUndefined(queryWhere))
        pagination.total = res.data.total
        pagination.page = res.data.current_page
        pagination.page_size = res.data.per_page
        logList.value = res.data.data
    } catch (error) {
        console.error('获取请求日志列表失败:', error)
        ElMessage.error('获取请求日志列表失败')
    } finally {
        loading.value = false
    }
}

// ==================== 生命周期 ====================
onMounted(() => {
    getList()
})

// ==================== 表格配置 ====================
const tableTitle = [
    {
        prop: 'id',
        align: 'center',
        h_label: 'ID',
        width: 80,
    },
    {
        prop: 'request_id',
        h_label: '请求ID',
        minWidth: 250,
        copy: true,
        customRow: true,
        overflow: true,
    },
    {
        prop: 'operation_name',
        h_label: '操作名称',
        minWidth: 150,
        overflow: true,
    },
    {
        prop: 'operator_name',
        h_label: '操作人',
        minWidth: 120,
        overflow: true,
    },
    {
        prop: 'operator_account',
        h_label: '操作账号',
        minWidth: 120,
        overflow: true,
    },
    {
        prop: 'ip',
        h_label: 'IP地址',
        minWidth: 130,
        copy: true,
        customRow: true,
    },
    {
        prop: 'method',
        h_label: '请求方法',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            GET: { type: 'success', text: 'GET' },
            POST: { type: 'primary', text: 'POST' },
            PUT: { type: 'warning', text: 'PUT' },
            DELETE: { type: 'danger', text: 'DELETE' },
            PATCH: { type: 'info', text: 'PATCH' },
            OPTIONS: { type: '', text: 'OPTIONS' },
            HEAD: { type: '', text: 'HEAD' },
        },
    },
    {
        prop: 'base_url',
        h_label: '接口路由',
        minWidth: 200,
        copy: true,
        customRow: true,
        overflow: true,
    },
    {
        prop: 'operation_status',
        h_label: '操作状态',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            成功: { type: 'success', text: '成功' },
            失败: { type: 'danger', text: '失败' },
        },
        formatter: (row) => {
            return row.operation_status === 0 ? '成功' : '失败'
        },
    },
    {
        prop: 'response_status',
        h_label: '响应状态',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            200: { type: 'success', text: '200' },
            400: { type: 'warning', text: '400' },
            401: { type: 'danger', text: '401' },
            403: { type: 'danger', text: '403' },
            404: { type: 'warning', text: '404' },
            500: { type: 'danger', text: '500' },
        },
        formatter: (row) => {
            return row.response_status || '-'
        },
    },
    {
        prop: 'execution_time',
        h_label: '执行时间(ms)',
        align: 'center',
        width: 130,
    },
    {
        prop: 'created_at',
        h_label: '创建时间',
        align: 'center',
        width: 160,
    },
]
</script>
