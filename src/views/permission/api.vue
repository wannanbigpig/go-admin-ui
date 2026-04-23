<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="6">
                        <el-form-item :label="t('permission.api.keyword')" prop="keyword" for="api-query-keyword">
                            <el-input id="api-query-keyword" :placeholder="t('permission.api.keywordPlaceholder')" v-model.trim="queryWhere.keyword" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('permission.api.method')" prop="method" for="api-query-method">
                            <el-select id="api-query-method" v-model="queryWhere.method" clearable :placeholder="t('common.placeholders.selectMethod')">
                                <el-option v-for="item in METHOD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('permission.api.authMode')" prop="is_auth" for="api-query-is-auth">
                            <el-select id="api-query-is-auth" v-model="queryWhere.is_auth" clearable :placeholder="t('permission.api.authModePlaceholder')">
                                <el-option v-for="item in AUTH_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('permission.api.effective')" prop="is_effective" for="api-query-is-effective">
                            <el-select id="api-query-is-effective" v-model="queryWhere.is_effective" clearable :placeholder="t('permission.api.effectivePlaceholder')">
                                <el-option :label="t('common.yes')" :value="SWITCH_VALUE.YES" />
                                <el-option :label="t('common.no')" :value="SWITCH_VALUE.NO" />
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
                    <span v-else-if="item.copy" trigger="click" effect="customized" :content="t('common.actions.copySuccess')" placement="left">
                        <span @click="copyText(String(val))" class="xl-cursor-pointer"> {{ val }}</span>
                    </span>
                    <span v-else>{{ val }}</span>
                </template>
                <!-- 操作列 -->
                <template #operation>
                    <el-table-column width="120" :label="t('common.labels.operation')" align="center" fixed="right">
                        <template #default="scope">
                            <xl-action-buttons :buttons="actionButtons" :scope="scope" />
                        </template>
                    </el-table-column>
                </template>
            </xl-table-list>
        </div>
        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="t('permission.api.editTitle')" :formRef="currentRowRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting">
            <el-form ref="currentRowRef" size="default" :model="currentRow" label-width="auto" :rules="editFormRules" :key="currentIndex">
                <el-form-item label="CODE" for="api-edit-code">
                    <el-input id="api-edit-code" v-model.trim="currentRow.code" disabled></el-input>
                </el-form-item>
                <el-form-item :label="t('permission.api.name')" prop="name" for="api-edit-name">
                    <el-input id="api-edit-name" v-model.trim="currentRow.name" :placeholder="t('permission.api.namePlaceholder')"></el-input>
                </el-form-item>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('permission.api.authMode')" prop="is_auth" required for="api-edit-is-auth">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.api.authMode') }}
                                    <el-tooltip effect="dark" :content="t('permission.api.authModeTip')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-select id="api-edit-is-auth" v-model="currentRow.is_auth" :placeholder="t('permission.api.authModePlaceholder')" clearable>
                                <el-option v-for="item in AUTH_MODE_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('permission.api.effective')" required for="api-edit-is-effective">
                            <el-select id="api-edit-is-effective" v-model="currentRow.is_effective" disabled>
                                <el-option :label="t('common.yes')" :value="SWITCH_VALUE.YES" />
                                <el-option :label="t('common.no')" :value="SWITCH_VALUE.NO" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item prop="sort" for="api-edit-sort">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    {{ t('permission.api.weight') }}
                                    <el-tooltip effect="dark" :content="t('permission.api.weightTip')" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input
                                id="api-edit-sort"
                                v-model.number="currentRow.sort"
                                clearable
                                :placeholder="t('permission.api.weightPlaceholder')"
                                @input="handleSortNumberChange"
                                @focus="setSortNumericValue(currentRow.sort)"
                            ></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('permission.api.method')" for="api-edit-method">
                            <el-select id="api-edit-method" v-model="currentRow.method" disabled>
                                <el-option v-for="item in METHOD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('common.labels.description')" prop="description" for="api-edit-description">
                    <el-input id="api-edit-description" v-model.trim="currentRow.description" maxlength="255" :placeholder="t('permission.api.descriptionPlaceholder')" show-word-limit type="textarea" />
                </el-form-item>
                <el-form-item :label="t('permission.api.route')" for="api-edit-route">
                    <el-input id="api-edit-route" v-model.trim="currentRow.route" disabled></el-input>
                </el-form-item>
                <el-form-item :label="t('permission.api.funcPath')" for="api-edit-func-path">
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
import { useClipboard } from '@/composables/useClipboard'
import {
    useApiPermissionList,
    useApiPermissionForm,
    API_PERMISSION_AUTH_MODE,
    API_PERMISSION_AUTH_MODE_OPTIONS,
    API_PERMISSION_METHOD_OPTIONS,
    API_PERMISSION_SWITCH_VALUE,
    type ApiPermission,
} from '@/modules/apiPermission'
import type { TableColumn } from '@/types/common'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const { copyText } = useClipboard()
const buttonInfo = getButtonInfoFull('api:update')
const { t } = useI18n()

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
const AUTH_MODE_OPTIONS = computed(() => {
    return API_PERMISSION_AUTH_MODE_OPTIONS.map((item) => {
        if (item.value === API_PERMISSION_AUTH_MODE.NONE) {
            return { ...item, label: t('permission.api.authNone') }
        }
        if (item.value === API_PERMISSION_AUTH_MODE.LOGIN) {
            return { ...item, label: t('permission.api.authLogin') }
        }
        return { ...item, label: t('permission.api.authAuthz') }
    })
})
const SWITCH_VALUE = API_PERMISSION_SWITCH_VALUE

const { loading, permissionList, pagination, queryFormRef, queryWhere, handleSearch, getList } = useApiPermissionList()
const { showDrawer, currentRowRef, currentRow, currentIndex, isSubmitting, editFormRules, handleSortNumberChange, setSortNumericValue, openEditDrawer, editConfirmSubmit } = useApiPermissionForm({ refreshList: getList })

onMounted(() => {
    getList()
})

const tableTitle = computed(
    () =>
        [
            {
                prop: 'code',
                h_label: 'CODE',
                width: 120,
                overflow: true,
                h_tip: t('permission.api.codeTip'),
                copy: true,
                customRow: true,
            },
            {
                prop: 'name',
                h_label: t('permission.api.name'),
                width: 200,
                overflow: true,
            },
            {
                prop: 'route',
                h_label: t('permission.api.route'),
                minWidth: 260,
            },
            {
                prop: 'method',
                h_label: t('permission.api.method'),
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
                h_label: t('permission.api.authMode'),
                align: 'center',
                width: 120,
                customRow: true,
                tag: {
                    [API_PERMISSION_AUTH_MODE.AUTHZ]: {
                        type: 'success',
                        text: t('permission.api.authAuthz'),
                    },
                    [API_PERMISSION_AUTH_MODE.LOGIN]: {
                        type: 'warning',
                        text: t('permission.api.authLogin'),
                    },
                    [API_PERMISSION_AUTH_MODE.NONE]: {
                        type: 'info',
                        text: t('permission.api.authNone'),
                    },
                },
                h_tip: t('permission.api.authModeTip'),
            },
            {
                prop: 'is_effective',
                h_label: t('permission.api.effective'),
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
                h_tip: t('permission.api.effectiveTip'),
            },
            {
                prop: 'sort',
                h_label: t('permission.api.weight'),
                align: 'center',
                width: 120,
                h_tip: t('permission.api.weightTip'),
            },
            {
                prop: 'func_path',
                h_label: t('permission.api.methodPath'),
                width: 220,
                h_tip: t('permission.api.methodPathTip'),
                overflow: true,
            },
            {
                prop: 'description',
                h_label: t('common.labels.description'),
                overflow: true,
            },
        ] as TableColumn<ApiPermission>[]
)
</script>
