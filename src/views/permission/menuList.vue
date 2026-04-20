<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryWhere.status" clearable placeholder="全部">
                                <el-option label="全部" :value="MENU_STATUS.ALL" />
                                <el-option label="正常" :value="MENU_STATUS.ENABLED" />
                                <el-option label="禁用" :value="MENU_STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>
        <div class="xl-container">
            <div style="display: flex; margin-bottom: 10px">
                <el-button @click="handleToggleExpand">{{ isExpanded ? '全部折叠' : '全部展开' }}</el-button>
                <xl-action-button v-permission="'menu:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(1)" />
            </div>
            <div>
                <xl-table-list :loading="loading" :data="menuList" :tableTitle="tableTitle" row-key="id" :default-expand-all="false">
                    <template #td="{ item, val, row }">
                        <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                            {{ item.tag[val as string | number]?.text || val }}
                        </el-tag>
                        <span v-else-if="item.copy" trigger="click" effect="customized" content="复制成功" placement="left">
                            <span @click="handleCopyClick(String(val))" class="xl-cursor-pointer">
                                {{ val }}
                            </span>
                        </span>
                        <span v-else-if="item.prop == 'title'" class="xl-label-with-icon-right">
                            <el-icon> <xl-icon :icon="(row as Menu).icon || ''" /> </el-icon> <span>{{ val }}</span>
                        </span>
                        <span v-else>{{ val }}</span>
                    </template>
                    <template #operation>
                        <el-table-column width="200" label="操作" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>
        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="handleSubmit" :isSubmitting="isSubmitting" :withReset="false" size="40%">
            <template #footer v-if="step === 1">
                <el-divider />
                <div style="display: flex; justify-content: flex-end">
                    <el-button @click="handleCancel">取消</el-button>
                    <el-button @click="handleStepChange(2)" type="success">下一步</el-button>
                </div>
            </template>
            <template #footer v-else-if="step === 2">
                <el-divider />
                <div style="display: flex; justify-content: flex-end">
                    <el-button @click="handleStepChange(1)" type="success">上一步</el-button>
                    <el-button @click="handleCancel">取消</el-button>
                    <el-button type="primary" @click="handleSubmit" :disabled="isSubmitting" :loading="isSubmitting">
                        {{ isSubmitting ? '提交中...' : '提交' }}
                    </el-button>
                </div>
            </template>
            <el-steps :active="step" finish-status="success" simple>
                <el-step title="基础信息" />
                <el-step title="选择权限" />
            </el-steps>
            <el-divider />
            <el-form v-if="step === 1" ref="formDataRef" size="default" :model="formData" label-width="auto" label-position="top" :rules="editFormRules" :key="currentIndex ?? 0">
                <el-form-item label="上级菜单" prop="parent_id">
                    <el-cascader
                        v-model="formData.parent_id"
                        :options="menuCascaderOptions"
                        placeholder="请选择上级菜单"
                        :props="MENU_CASCADER_PROPS"
                        filterable
                        :show-all-levels="true"
                        :disabled="isParentFixed"
                        style="width: 100%"
                    />
                </el-form-item>
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item label="路由标题" prop="title">
                            <el-input v-model.trim="formData.title" placeholder="请输入路由标题"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8" v-show="formData.type !== MENU_TYPE.BUTTON">
                        <el-form-item label="路由名称" prop="name" :required="formData.type === MENU_TYPE.MENU">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    路由名称
                                    <el-tooltip effect="dark" content="路由的别名，如需和前端已定义路由关联则需保证两者一致" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.name" placeholder="请输入路由名称"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="8">
                        <el-form-item prop="icon">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    图标
                                    <el-tooltip
                                        effect="dark"
                                        content="支持的图标库：<a href='https://icon-sets.iconify.design/' target='_blank' style='color:white'>https://icon-sets.iconify.design/</a>"
                                        raw-content
                                        placement="top"
                                    >
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.icon" placeholder="请输入图标">
                                <template #suffix>
                                    <el-icon size="20" color="#409eff">
                                        <xl-icon :icon="formData.icon || ''" />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="8">
                        <el-form-item prop="type">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    菜单类型
                                    <el-tooltip effect="dark" content="类型分为目录、菜单、按钮，目录可以展开，菜单不能展开，按钮不在菜单中，按钮用于用于页面按钮控制" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-radio-group id="" aria-label="菜单类型" size="small" v-model="formData.type" placeholder="请选择类型">
                                <el-radio :value="MENU_TYPE.DIRECTORY">目录</el-radio>
                                <el-radio :value="MENU_TYPE.MENU">菜单</el-radio>
                                <el-radio :value="MENU_TYPE.BUTTON">按钮</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item prop="status" label="状态">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    状态
                                    <el-tooltip effect="dark" content="是否启用该菜单" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-switch v-model="formData.status" inline-prompt active-text="正常" inactive-text="禁用" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item prop="is_auth" label="是否鉴权">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    是否鉴权
                                    <el-tooltip effect="dark" content="勾选否，则对所有用户可见" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-switch v-model="formData.is_auth" inline-prompt active-text="是" inactive-text="否" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="6">
                        <el-form-item prop="is_show" label="是否显示">
                            <el-switch v-model="formData.is_show" inline-prompt active-text="是" inactive-text="否" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                </el-row>

                <el-row :gutter="20" v-show="formData.type !== MENU_TYPE.BUTTON">
                    <el-col :span="10">
                        <el-form-item label="路由地址" prop="path">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    路由地址
                                    <el-tooltip effect="dark" content="使用 / 开头为完整路由，外链使用 http 开头，不是 / 开头默认拼接上级路由" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.path" placeholder="请输入路由地址" @input="handlePathChange(formData.path ?? '')" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="14">
                        <el-form-item label="路由组件路径" prop="component" :required="formData.type === MENU_TYPE.MENU && formData.is_external_links !== MENU_SWITCH_VALUE.YES">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    路由组件路径
                                    <el-tooltip effect="dark" content="路由的组件路径，例：@/views/home/index.vue" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.component" placeholder="请输入组件路径">
                                <template #prepend>@/views/</template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20" v-show="formData.type !== MENU_TYPE.BUTTON">
                    <el-col :span="10">
                        <el-form-item label="重定向路由名称" prop="redirect">
                            <template #label>
                                <span class="xl-label-with-icon"> 重定向路由名称 </span>
                            </template>
                            <el-input v-model.trim="formData.redirect" placeholder="请输入重定向路由名称" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item prop="sort">
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
                            <el-input-number v-model.number="formData.sort" :step="10" placeholder="请输入权重值" controls-position="right" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item prop="is_external_links" label="是否外链">
                            <el-switch v-model="formData.is_external_links" inline-prompt active-text="是" inactive-text="否" :active-value="1" :inactive-value="0" :disabled="formData.type === MENU_TYPE.BUTTON" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item prop="is_new_window" label="新窗口打开" v-show="formData.is_external_links === 1">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    新窗口打开
                                    <el-tooltip effect="dark" content="选择否，外链可以通过 iframe 打开指定地址" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-switch v-model="formData.is_new_window" inline-prompt active-text="是" inactive-text="否" :active-value="1" :inactive-value="0" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20" justify="space-between">
                    <el-col :span="8" v-show="formData.type === MENU_TYPE.BUTTON">
                        <el-form-item prop="code" :required="formData.type === MENU_TYPE.BUTTON">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    权限标识
                                    <el-tooltip effect="dark" content="按钮权限标识，主要用来控制按钮的展示，示例（permission:Home:add）" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.code"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20" v-show="formData.type !== MENU_TYPE.BUTTON">
                    <el-col :span="6">
                        <el-form-item prop="animate_duration">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    动画时长
                                    <el-tooltip effect="dark" content="默认 0.3 秒" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model="formData.animate_duration" placeholder="请输入动画时长" @input="handleAnimateDurationChange(formData.animate_duration ?? '', 2)"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="9">
                        <el-form-item prop="animate_enter">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    进入动画
                                    <el-tooltip effect="dark" content="对应页面加载时动画，目前仅支持 https://animate.style/ 动画，复制对应动画样式填入即可，默认 fadeIn 效果" raw-content placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.animate_enter" placeholder="请输入进入动画"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="9">
                        <el-form-item prop="animate_leave">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    离开动画
                                    <el-tooltip effect="dark" content="上一页面离开时动画，目前仅支持 https://animate.style/ 动画，复制对应动画样式填入即可，默认 fadeOut 效果" raw-content placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.animate_leave" placeholder="请输入离开动画"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="菜单描述" prop="description">
                    <el-input v-model.trim="formData.description" maxlength="255" placeholder="描述" show-word-limit type="textarea" />
                </el-form-item>
            </el-form>
            <div v-else-if="step === 2" class="xl-transfer">
                <el-skeleton v-if="permissionListLoading" animated>
                    <template #template>
                        <el-form-item>
                            <template #label>
                                <el-skeleton-item variant="text" style="width: 80px; margin-bottom: 8px" />
                            </template>
                            <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
                        </el-form-item>
                    </template>
                </el-skeleton>
                <el-form-item v-else label="菜单权限" prop="api_list">
                    <el-transfer
                        v-model="formData.api_list"
                        filterable
                        :filter-method="filterPermission"
                        :props="{ key: 'id', label: 'name' }"
                        :data="permissionList || []"
                        :titles="['全部接口', '已授权接口']"
                        target-order="push"
                        filter-placeholder="接口名称或路由"
                    />
                </el-form-item>
            </div>
        </xl-drawer>
    </div>
</template>

<script setup lang="ts">
import { Icon as XlIcon } from '@iconify/vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import { onMounted, ref, reactive, computed } from 'vue'
import { usePermission } from '@/composables/usePermission'
import { MENU_STATUS, MENU_TYPE, MENU_SWITCH_VALUE, MENU_CASCADER_PROPS } from '@/modules/menu/model'
import { useMenuList } from '@/modules/menu/useMenuList'
import { useMenuForm } from '@/modules/menu/useMenuForm'
import type { Menu } from '@/types/menu'
import type { TableColumn } from '@/types/common'
import { Logger } from '@/utils/logger'

const { getButtonInfoFull } = usePermission()
const addChildButtonInfo = getButtonInfoFull('menu:addChild')
const addButtonInfo = getButtonInfoFull('menu:add')
const updateButtonInfo = getButtonInfoFull('menu:update')
const deleteButtonInfo = getButtonInfoFull('menu:delete')

const { loading, menuList, getList } = useMenuList()
const {
    showDrawer,
    formTitle,
    formDataRef,
    currentIndex,
    isSubmitting,
    formData,
    step,
    editFormRules,
    isParentFixed,
    menuCascaderOptions,
    permissionListLoading,
    permissionList,
    openEditDrawer,
    handleAddChild,
    handleSubmit,
    handleDelete,
    handleCancel,
    handleStepChange,
    handlePathChange,
    handleAnimateDurationChange,
    filterPermission,
} = useMenuForm({
    getList,
})

const queryFormRef = ref()
const queryWhere = reactive({
    status: MENU_STATUS.ALL,
})

const isExpanded = ref(false)

const handleToggleExpand = () => {
    isExpanded.value = !isExpanded.value
}

const handleCopyClick = async (text: string) => {
    try {
        await navigator.clipboard.writeText(text)
    } catch (error) {
        Logger.error('复制失败:', error)
    }
}

const handleSearch = () => {
    getList()
}

const actionButtons = computed(() => {
    return [
        {
            permission: 'menu:addChild',
            buttonInfo: addChildButtonInfo || undefined,
            showIcon: false,
            click: (row: Menu) => handleAddChild(row),
        },
        {
            permission: 'menu:update',
            buttonInfo: updateButtonInfo || undefined,
            showIcon: false,
            click: (row: Menu, index: number) => openEditDrawer(2, row, index),
        },
        {
            permission: 'menu:delete',
            buttonInfo: deleteButtonInfo || undefined,
            showIcon: false,
            click: (row: Menu) => handleDelete(row),
            divided: true,
        },
    ]
})

onMounted(() => {
    getList()
})

const tableTitle: TableColumn<Menu>[] = [
    {
        prop: 'title',
        h_label: '名称',
        minWidth: 200,
        customRow: true,
    },
    {
        prop: 'full_path',
        h_label: '路由地址/权限标识',
        minWidth: 200,
        hidden: true,
        customRow: true,
        overflow: true,
        copy: true,
        h_tip: '按钮类型显示权限标识，其他类型显示完整的路由地址，点击即可复制',
        formatter: (row: Menu) => {
            return row.type === 3 ? row.code || '-' : row.full_path || '-'
        },
    },
    {
        prop: 'type',
        h_label: '类型',
        align: 'center',
        h_tip: '类型分为目录、菜单、按钮，目录可以展开，菜单不能展开，按钮不在菜单中，按钮用于用于页面按钮控制',
        width: 120,
        customRow: true,
        tag: {
            1: { type: 'primary', text: '目录' },
            2: { type: 'success', text: '菜单' },
            3: { type: 'danger', text: '按钮' },
        },
    },
    {
        prop: 'status',
        h_label: '状态',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            0: { type: 'danger', text: '禁用' },
            1: { type: 'success', text: '正常' },
        },
    },
    {
        prop: 'is_show',
        h_label: '是否显示',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            1: { type: 'success', text: '是' },
            0: { type: 'danger', text: '否' },
        },
        h_tip: '表示该目录或菜单是否显示在左侧菜单栏中，按钮不受该字段控制',
    },
    {
        prop: 'is_auth',
        h_label: '是否鉴权',
        align: 'center',
        width: 130,
        customRow: true,
        tag: {
            1: { type: 'success', text: '是' },
            0: { type: 'danger', text: '否' },
        },
        h_tip: '如无需鉴权则有登录权限用户都可以看到',
    },
    {
        prop: 'is_external_links',
        h_label: '是否外链',
        align: 'center',
        width: 130,
        customRow: true,
        tag: {
            1: { type: 'success', text: '是' },
            0: { type: 'danger', text: '否' },
        },
    },
    {
        prop: 'is_new_window',
        h_label: '新窗口打开',
        align: 'center',
        width: 150,
        customRow: true,
        tag: {
            1: { type: 'success', text: '是' },
            0: { type: 'danger', text: '否' },
        },
    },
    {
        prop: 'sort',
        h_label: '权重',
        align: 'center',
        width: 100,
        h_tip: '权重值越大，排序越靠前',
    },
    { prop: 'created_at', width: 160, align: 'center', h_label: '创建时间' },
    {
        prop: 'updated_at',
        h_label: '更新时间',
        align: 'center',
        width: 160,
        h_tip: '显示最后更新时间',
    },
]
</script>
