<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="关键字" prop="keyword" for="api-query-keyword">
                            <el-input id="api-query-keyword" placeholder="支持CODE、接口名称、接口地址搜索" v-model.trim="queryWhere.keyword" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="请求方法" prop="method" for="api-query-method">
                            <el-select id="api-query-method" v-model="queryWhere.method" clearable placeholder="请选择请求方法">
                                <el-option v-for="item in METHOD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="是否鉴权" prop="is_auth" for="api-query-is-auth">
                            <el-select id="api-query-is-auth" v-model="queryWhere.is_auth" clearable placeholder="请选择是否鉴权">
                                <el-option label="是" :value="SWITCH_VALUE.YES" />
                                <el-option label="否" :value="SWITCH_VALUE.NO" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="是否有效" prop="is_effective" for="api-query-is-effective">
                            <el-select id="api-query-is-effective" v-model="queryWhere.is_effective" clearable placeholder="请选择是否有效">
                                <el-option label="是" :value="SWITCH_VALUE.YES" />
                                <el-option label="否" :value="SWITCH_VALUE.NO" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <xl-table-list :loading="loading" :data="permissionList" :tableTitle="tableTitle" :pagination="pagination">
                <!-- 渲染表格列的内容 -->
                <template #td="{ item, val }">
                    <el-icon v-if="item.icon" :color="item.icon[val as string | number]?.color">
                        <xl-icon :icon="item.icon[val as string | number]?.text" />
                    </el-icon>
                    <el-tag v-else-if="item.tag" :type="item.tag[val as string | number]?.type || item.tag['other']?.type">
                        {{ item.tag[val as string | number]?.text || val }}
                    </el-tag>
                    <span v-else-if="item.copy" trigger="click" effect="customized" content="复制成功" placement="left">
                        <span @click="handleCopyClick(String(val))" class="xl-cursor-pointer"> {{ val }}</span>
                    </span>
                    <span v-else>{{ val }}</span>
                </template>
                <!-- 操作列 -->
                <template #operation>
                    <el-table-column width="120" label="操作" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-buttons :buttons="actionButtons" :scope="scope" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>
        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" title="编辑接口" :formRef="currentRowRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting">
            <el-form ref="currentRowRef" size="default" :model="currentRow" label-width="auto" :rules="editFormRules" :key="currentIndex">
                <el-form-item label="CODE" for="api-edit-code">
                    <el-input id="api-edit-code" v-model.trim="currentRow.code" disabled></el-input>
                </el-form-item>
                <el-form-item label="接口名称" prop="name" for="api-edit-name">
                    <el-input id="api-edit-name" v-model.trim="currentRow.name" placeholder="请输入接口名称"></el-input>
                </el-form-item>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="是否鉴权" prop="is_auth" required for="api-edit-is-auth">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    是否鉴权
                                    <el-tooltip effect="dark" content="勾选否，则请求该接口跳过鉴权步骤" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-select id="api-edit-is-auth" v-model="currentRow.is_auth" placeholder="请选择是否鉴权" clearable>
                                <el-option label="是" :value="SWITCH_VALUE.YES" />
                                <el-option label="否" :value="SWITCH_VALUE.NO" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="是否有效" required for="api-edit-is-effective">
                            <el-select id="api-edit-is-effective" v-model="currentRow.is_effective" disabled>
                                <el-option label="是" :value="SWITCH_VALUE.YES" />
                                <el-option label="否" :value="SWITCH_VALUE.NO" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item prop="sort" for="api-edit-sort">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    权重
                                    <el-tooltip effect="dark" content="权重值越大，排序越靠前" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input id="api-edit-sort" v-model.number="currentRow.sort" clearable placeholder="请输入权重值" @input="handleSortNumberChange" @focus="setSortNumericValue(currentRow.sort)"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="请求方法" for="api-edit-method">
                            <el-select id="api-edit-method" v-model="currentRow.method" disabled>
                                <el-option v-for="item in METHOD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="接口描述" prop="description" for="api-edit-description">
                    <el-input id="api-edit-description" v-model.trim="currentRow.description" maxlength="255" placeholder="描述" show-word-limit type="textarea" />
                </el-form-item>
                <el-form-item label="接口地址" for="api-edit-route">
                    <el-input id="api-edit-route" v-model.trim="currentRow.route" disabled></el-input>
                </el-form-item>
                <el-form-item label="接口功能" for="api-edit-func-path">
                    <el-input id="api-edit-func-path" v-model.trim="currentRow.func_path" disabled></el-input>
                </el-form-item>
            </el-form>
        </xl-drawer>
    </div>
</template>

<style lang="scss" scoped>
.el-form-item {
    width: 100% !important;
}
</style>

<script setup lang="ts">
import { Icon as XlIcon } from '@iconify/vue'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import { onMounted, computed } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { useApiPermissionList, useApiPermissionForm, API_PERMISSION_METHOD_OPTIONS, API_PERMISSION_SWITCH_VALUE, type ApiPermission } from '@/modules/apiPermission'
import type { TableColumn } from '@/types/common'
import { Logger } from '@/utils/logger'

const { getButtonInfoFull } = usePermission()
const buttonInfo = getButtonInfoFull('api:update')

const actionButtons = computed(() => {
    return [
        {
            permission: 'api:update',
            buttonInfo: buttonInfo || undefined,
            showIcon: false,
            click: (row: ApiPermission, index: number) => openEditDrawer(2, row, index),
        },
    ]
})

const METHOD_OPTIONS = API_PERMISSION_METHOD_OPTIONS
const SWITCH_VALUE = API_PERMISSION_SWITCH_VALUE

const { loading, permissionList, pagination, queryFormRef, queryWhere, handleSearch, getList } = useApiPermissionList()
const { showDrawer, currentRowRef, currentRow, currentIndex, isSubmitting, editFormRules, handleSortNumberChange, setSortNumericValue, openEditDrawer, editConfirmSubmit } = useApiPermissionForm({ refreshList: getList })

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

const tableTitle: TableColumn<ApiPermission>[] = [
    {
        prop: 'code',
        h_label: 'CODE',
        width: 120,
        overflow: true,
        h_tip: 'CODE生成方式（md5({$接口方法}_{$接口地址})）',
        copy: true,
        customRow: true,
    },
    {
        prop: 'name',
        h_label: '接口名称',
        width: 200,
        overflow: true,
    },
    {
        prop: 'route',
        h_label: '接口地址',
        minWidth: 260,
    },
    {
        prop: 'method',
        h_label: '请求方法',
        width: 120,
        customRow: true,
        tag: {
            POST: {
                type: 'primary',
            },
            GET: {
                type: 'success',
            },
            PUT: {
                type: 'warning',
            },
            DELETE: {
                type: 'danger',
            },
            other: {
                type: 'info',
            },
        },
    },
    {
        prop: 'is_auth',
        h_label: '是否鉴权',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            1: {
                type: 'success',
                text: '是',
            },
            0: {
                type: 'danger',
                text: '否',
            },
        },
        h_tip: '表示该接口是否需要授权访问（此处鉴权指的没有授予该接口访问权限能否请求的意思，与登录授权无关，需要鉴权的接口必定需要先登录）',
    },
    {
        prop: 'is_effective',
        h_label: '是否有效',
        align: 'center',
        width: 120,
        customRow: true,
        icon: {
            1: {
                color: 'var(--el-color-success)',
                text: 'ant-design:check-outlined',
            },
            0: {
                color: 'var(--el-color-danger)',
                text: 'ant-design:close-outlined',
            },
        },
        h_tip: '表示该接口在当前版本是否有效',
    },
    {
        prop: 'sort',
        h_label: '权重',
        align: 'center',
        width: 120,
        h_tip: '权重值越大，排序越靠前',
    },
    {
        prop: 'func_path',
        h_label: '方法路径',
        width: 220,
        h_tip: '接口对应的结构体方法路径',
        overflow: true,
    },
    {
        prop: 'description',
        h_label: '描述',
        overflow: true,
    },
]
</script>
