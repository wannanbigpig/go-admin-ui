<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="用户名" prop="username">
                            <el-input placeholder="请输入用户名" v-model.trim="queryWhere.username" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="IP地址" prop="ip">
                            <el-input placeholder="请输入IP地址" v-model.trim="queryWhere.ip" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="登录状态" prop="login_status">
                            <el-select v-model="queryWhere.login_status" clearable placeholder="请选择登录状态">
                                <el-option label="成功" :value="1" />
                                <el-option label="失败" :value="0" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item label="登录时间" prop="dateRange">
                            <xl-date-range-picker v-model="dateRange" />
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="4" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container" v-loading="loading" element-loading-text="数据全力加载中..." element-loading-custom-class="xl-loading">
            <xl-table-list :data="logList" :tableTitle="tableTitle" :pagination="pagination">
                <!-- 渲染表格列的内容 -->
                <template #td="{ item, val, row }">
                    <el-tag v-if="item.tag" :type="item.tag[row[item.prop]]?.type || item.tag[val]?.type || item.tag['other']?.type">
                        {{ val }}
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
                            <xl-action-button v-permission="'adminLoginLog:detail'" :button-info="detailButtonInfo" type="primary" link :show-icon="false" @click="openDetailDrawer(scope.row)" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>

        <!-- 详情抽屉 -->
        <el-drawer v-model="showDetailDrawer" title="登录日志详细信息" direction="rtl" size="50%">
            <template #header="{ titleId, titleClass }">
                <h4 :id="titleId" :class="titleClass">登录日志详细信息</h4>
            </template>
            <div v-loading="detailLoading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.8)" class="detail-content">
                <template v-if="currentDetail">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="用户名" :span="2">
                            {{ currentDetail.username || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="IP地址" :span="2">
                            {{ formatIpAddress(currentDetail.ip, currentDetail.ip_location) }}
                        </el-descriptions-item>
                        <el-descriptions-item label="操作类型">
                            <el-tag :type="currentDetail.type === 1 ? 'primary' : 'info'">
                                {{ currentDetail.type_name || (currentDetail.type === 1 ? '登录操作' : currentDetail.type === 2 ? '刷新token' : '-') }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="登录状态">
                            <el-tag :type="currentDetail.login_status === 1 ? 'success' : 'danger'">
                                {{ currentDetail.login_status_name || (currentDetail.login_status === 1 ? '成功' : '失败') }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item label="执行时间(ms)">
                            {{ currentDetail.execution_time || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.device_name" label="设备名称" :span="2">
                            {{ currentDetail.device_name || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.os" label="操作系统" :span="2">
                            {{ currentDetail.os || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.browser" label="浏览器" :span="2">
                            {{ currentDetail.browser || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.user_agent" label="User Agent" :span="2">
                            {{ currentDetail.user_agent || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item label="登录时间" :span="2">
                            {{ currentDetail.created_at || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.login_status === 0 && currentDetail.login_fail_reason" label="失败原因" :span="2">
                            {{ currentDetail.login_fail_reason || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.jwt_id" label="JWT ID" :span="2">
                            {{ currentDetail.jwt_id || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.token_expires" label="Token过期时间" :span="2">
                            {{ currentDetail.token_expires || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.refresh_expires" label="Refresh Token过期时间" :span="2">
                            {{ currentDetail.refresh_expires || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.is_revoked === 1" label="是否撤销">
                            <el-tag :type="currentDetail.is_revoked === 1 ? 'danger' : 'success'">
                                {{ currentDetail.is_revoked_name || (currentDetail.is_revoked === 1 ? '是' : '否') }}
                            </el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.is_revoked === 1 && currentDetail.revoked_reason" label="撤销说明" :span="2">
                            {{ currentDetail.revoked_reason || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.is_revoked === 1 && currentDetail.revoked_at" label="撤销时间" :span="2">
                            {{ currentDetail.revoked_at || '-' }}
                        </el-descriptions-item>
                    </el-descriptions>
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
}
</style>

<script setup>
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDateRangePicker from '@/components/dateRangePicker/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { getLoginLogList, getLoginLogDetail } from '@/api/log'
import { filterNullUndefined } from '@/utils/helper'
import { onMounted, reactive, ref } from 'vue'
import Clipboard from 'clipboard'
import { ElMessage } from 'element-plus'
import { usePermission } from '@/composables/usePermission'

// ==================== 权限相关 ====================
const { getButtonInfoFull } = usePermission()
const detailButtonInfo = getButtonInfoFull('adminLoginLog:detail')

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
    currentDetail.value = null

    try {
        const res = await getLoginLogDetail(row.id)
        currentDetail.value = res.data
    } catch (error) {
        console.error('获取登录日志详情失败:', error)
        ElMessage.error('获取登录日志详情失败')
        showDetailDrawer.value = false
    } finally {
        detailLoading.value = false
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
const detailLoading = ref(false)

// ==================== 查询相关 ====================
const queryWhere = reactive({
    page: 1,
    per_page: 10,
    username: null,
    ip: null,
    login_status: null,
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
 * 获取登录日志列表
 */
const getList = async () => {
    loading.value = true

    try {
        const res = await getLoginLogList(filterNullUndefined(queryWhere))
        pagination.total = res.data.total
        pagination.page = res.data.current_page
        pagination.page_size = res.data.per_page
        logList.value = res.data.data
    } catch (error) {
        console.error('获取登录日志列表失败:', error)
        ElMessage.error('获取登录日志列表失败')
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
        prop: 'username',
        h_label: '用户名',
        minWidth: 120,
        overflow: true,
    },
    {
        prop: 'type',
        h_label: '操作类型',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            1: { type: 'primary', text: '登录操作' },
            2: { type: 'info', text: '刷新token' },
        },
        formatter: (row) => {
            return row.type_name || (row.type === 1 ? '登录操作' : row.type === 2 ? '刷新token' : '')
        },
    },
    {
        prop: 'login_status',
        h_label: '登录状态',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            1: { type: 'success', text: '成功' },
            0: { type: 'danger', text: '失败' },
        },
        formatter: (row) => {
            return row.login_status_name || ''
        },
    },
    {
        prop: 'ip',
        h_label: 'IP地址',
        minWidth: 130,
        copy: true,
        customRow: true,
    },
    {
        prop: 'os',
        h_label: '操作系统',
        minWidth: 150,
        overflow: true,
    },
    {
        prop: 'browser',
        h_label: '浏览器',
        minWidth: 120,
        overflow: true,
    },

    {
        prop: 'created_at',
        h_label: '登录时间',
        align: 'center',
        width: 160,
    },
    {
        prop: 'login_fail_reason',
        h_label: '失败原因',
        minWidth: 150,
        overflow: true,
        formatter: (row) => {
            return row.login_status === 0 ? row.login_fail_reason || '' : ''
        },
    },
    {
        prop: 'execution_time',
        h_label: '执行时间(ms)',
        align: 'center',
        width: 130,
    },
    {
        prop: 'is_revoked',
        h_label: '是否撤销',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            0: { type: 'success', text: '否' },
            1: { type: 'danger', text: '是' },
        },
        formatter: (row) => {
            return row.is_revoked_name || ''
        },
    },
    {
        prop: 'revoked_reason',
        h_label: '撤销说明',
        minWidth: 150,
        overflow: true,
        formatter: (row) => {
            return row.is_revoked === 1 ? row.revoked_reason || '' : ''
        },
    },
    {
        prop: 'revoked_at',
        h_label: '撤销时间',
        align: 'center',
        width: 160,
        formatter: (row) => {
            return row.is_revoked === 1 ? row.revoked_at || '' : ''
        },
    },
]
</script>
