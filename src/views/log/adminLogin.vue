<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch">
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
                            <xl-action-button v-permission="'adminLoginLog:detail'" :button-info="detailButtonInfo" type="primary" link :show-icon="false" @click="openDetailDrawer(scope.row)" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>

        <!-- 详情抽屉 -->
        <el-drawer v-model="showDetailDrawer" title="登录日志详细信息" direction="rtl" size="50%">
            <div v-loading="detailLoading" element-loading-text="加载中..." class="detail-content">
                <template v-if="currentDetail">
                    <el-descriptions :column="2" border>
                        <el-descriptions-item label="用户名" :span="2">{{ currentDetail.username || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="IP地址" :span="2">{{ formatIpAddress(currentDetail.ip, currentDetail.ip_location) }}</el-descriptions-item>
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
                        <el-descriptions-item label="执行时间(ms)">{{ currentDetail.execution_time || '-' }}</el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.os" label="操作系统">{{ currentDetail.os || '-' }}</el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.browser" label="浏览器">{{ currentDetail.browser || '-' }}</el-descriptions-item>
                        <el-descriptions-item label="登录时间" :span="2">{{ currentDetail.created_at || '-' }}</el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.login_status === 0 && currentDetail.login_fail_reason" label="失败原因" :span="2">
                            {{ currentDetail.login_fail_reason || '-' }}
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.is_revoked === 1" label="是否撤销">
                            <el-tag type="danger">是</el-tag>
                        </el-descriptions-item>
                        <el-descriptions-item v-if="currentDetail.is_revoked === 1 && currentDetail.revoked_reason" label="撤销说明" :span="2">
                            {{ currentDetail.revoked_reason || '-' }}
                        </el-descriptions-item>
                    </el-descriptions>

                    <template v-if="currentDetail.access_token || currentDetail.refresh_token">
                        <el-divider />

                        <el-collapse v-model="activeCollapse">
                            <el-collapse-item v-if="currentDetail.access_token" name="accessToken">
                                <template #title>
                                    <span>Access Token</span>
                                    <el-button link type="primary" size="small" class="format-btn" @click.stop="toggleTokenFormat('accessToken')">
                                        {{ accessTokenFormatted ? '还原' : '格式化' }}
                                    </el-button>
                                </template>
                                <pre class="json-content">{{ accessTokenFormatted ? formatJwtToken(currentDetail.access_token) : currentDetail.access_token }}</pre>
                            </el-collapse-item>
                            <el-collapse-item v-if="currentDetail.refresh_token" name="refreshToken">
                                <template #title>
                                    <span>Refresh Token</span>
                                    <el-button link type="primary" size="small" class="format-btn" @click.stop="toggleTokenFormat('refreshToken')">
                                        {{ refreshTokenFormatted ? '还原' : '格式化' }}
                                    </el-button>
                                </template>
                                <pre class="json-content">{{ refreshTokenFormatted ? formatJwtToken(currentDetail.refresh_token) : currentDetail.refresh_token }}</pre>
                            </el-collapse-item>
                        </el-collapse>
                    </template>
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
import { useAdminLoginLogPage } from '@/modules/log/useAdminLoginLogPage'
import type { TableColumn } from '@/types/common'
import type { LoginLog } from '@/types/log'

const { getButtonInfoFull } = usePermission()
const detailButtonInfo = getButtonInfoFull('adminLoginLog:detail')

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
    accessTokenFormatted,
    refreshTokenFormatted,
    formatIpAddress,
    toggleTokenFormat,
    formatJwtToken,
    handleSearch,
    getList,
    openDetailDrawer,
} = useAdminLoginLogPage()

const handleCopyClick = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
    } catch (error) {
        console.error('复制失败:', error)
    }
}

onMounted(() => {
    getList()
})

const tableTitle: TableColumn<LoginLog>[] = [
    { prop: 'id', align: 'center', h_label: 'ID', width: 80 },
    { prop: 'username', h_label: '用户名', minWidth: 120, overflow: true },
    {
        prop: 'type',
        h_label: '类型',
        align: 'center',
        width: 100,
        customRow: true,
        tag: {
            1: { type: 'primary', text: '登录' },
            2: { type: 'info', text: '刷新' },
        },
    },
    {
        prop: 'login_status',
        h_label: '状态',
        align: 'center',
        width: 100,
        customRow: true,
        tag: {
            1: { type: 'success', text: '成功' },
            0: { type: 'danger', text: '失败' },
        },
    },
    { prop: 'ip', h_label: 'IP地址', minWidth: 130, customRow: true, copy: true },
    { prop: 'os', h_label: 'OS', width: 120, overflow: true },
    { prop: 'browser', h_label: '浏览器', width: 120, overflow: true },
    { prop: 'execution_time', h_label: '耗时(ms)', align: 'center', width: 100 },
    {
        prop: 'is_revoked',
        h_label: '撤销',
        align: 'center',
        width: 80,
        customRow: true,
        tag: {
            0: { type: 'success', text: '否' },
            1: { type: 'danger', text: '是' },
        },
    },
    { prop: 'created_at', h_label: '时间', align: 'center', width: 160 },
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
    .format-btn {
        margin-left: 10px;
    }
}
</style>
