<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryWhere.status" clearable placeholder="全部">
                                <el-option label="全部" :value="STATUS.ALL" />
                                <el-option label="正常" :value="STATUS.ENABLED" />
                                <el-option label="禁用" :value="STATUS.DISABLED" />
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
                <xl-action-button v-permission="'menu:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(OPERATION_TYPE.ADD)" />
            </div>
            <div v-loading="loading" element-loading-text="数据全力加载中..." element-loading-custom-class="xl-loading">
                <xl-table-list ref="tableListRef" :data="menuList" :tableTitle="tableTitle" row-key="id" :default-expand-all="false">
                    <!-- 渲染表格列的内容 -->
                    <template #td="{ item, val, row }">
                        <el-tag v-if="item.tag" :type="item.tag[val]?.type || item.tag['other']?.type">
                            {{ item.tag[val]?.text || val }}
                        </el-tag>
                        <el-tooltip v-else-if="item.copy" trigger="click" effect="customized" content="复制成功" placement="left">
                            <span @click="handleCopyClick(val)" class="xl-cursor-pointer">
                                {{ val }}
                            </span>
                        </el-tooltip>
                        <span v-else-if="item.prop == 'title'" class="xl-label-with-icon-right">
                            <el-icon> <xl-icon :icon="row['icon']" /> </el-icon> <span>{{ val }}</span>
                        </span>
                        <span v-else>{{ val }}</span>
                    </template>
                    <!-- 操作列 -->
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
        <el-drawer class="xl-drawer-c" direction="rtl" v-model="showDrawer" :before-close="handleDrawerClose" :title="formTitle" size="40%">
            <template #footer v-if="step === STEP.BASIC_INFO">
                <el-divider />
                <div style="display: flex; justify-content: flex-end">
                    <el-button @click="handleCancel">取消</el-button>
                    <el-button @click="handleStepChange(STEP.PERMISSION)" type="success">下一步</el-button>
                </div>
            </template>
            <template #footer v-else-if="step === STEP.PERMISSION">
                <el-divider />
                <div style="display: flex; justify-content: flex-end">
                    <el-button @click="handleStepChange(STEP.BASIC_INFO)" type="success">上一步</el-button>
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
            <el-form v-if="step === STEP.BASIC_INFO" ref="formDataRef" size="default" :model="formData" label-width="auto" label-position="top" :rules="editFormRules" :key="currentIndex">
                <el-form-item label="上级菜单" prop="pid">
                    <el-cascader
                        v-model="formData.pid"
                        :options="getSelectMenuList(formData.id)"
                        placeholder="请选择上级菜单"
                        :props="cascaderProps"
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
                        <el-form-item label="路由名称" prop="name">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    路由名称
                                    <el-tooltip effect="dark" content="路由的别名，如需和前端已定义路由关联则需保证两者一致，" placement="top">
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
                                        <xl-icon :icon="formData.icon" />
                                    </el-icon>
                                </template>
                            </el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20" justify="space-between">
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
                            <el-radio-group size="small" v-model="formData.type" placeholder="前选择类型">
                                <el-radio :value="MENU_TYPE.DIRECTORY">目录</el-radio>
                                <el-radio :value="MENU_TYPE.MENU">菜单</el-radio>
                                <el-radio :value="MENU_TYPE.BUTTON">按钮</el-radio>
                            </el-radio-group>
                        </el-form-item>
                    </el-col>
                    <el-col :span="5">
                        <el-form-item prop="is_auth">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    状态
                                    <el-tooltip effect="dark" content="是否启用该菜单？" placement="top">
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
                        <el-form-item prop="is_auth">
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
                                    <el-tooltip effect="dark" content="使用 / 开头为完整路由,外链使用http开头,不是 / 开头默认拼接上级路由" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model.trim="formData.path" placeholder="请输入路由地址" @input="handlePathChange(formData.path)" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="14">
                        <el-form-item label="路由组件路径" prop="component">
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
                            <el-switch v-model="formData.is_external_links" inline-prompt active-text="是" inactive-text="否" :active-value="1" :inactive-value="0" disabled />
                        </el-form-item>
                    </el-col>
                    <el-col :span="4"></el-col>
                        <el-form-item prop="is_new_window" label="新窗口打开" v-show="formData.is_external_links === 1">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    新窗口打开
                                    <el-tooltip effect="dark" content="选择否，外链可以通过iframe打开指定地址" placement="top">
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
                        <el-form-item prop="code">
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
                        <el-form-item prop="animate_duration" v-show="formData.type !== MENU_TYPE.BUTTON">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    动画时长
                                    <el-tooltip effect="dark" content="默认0.3秒" placement="top">
                                        <el-icon style="font-size: 16px" class="xl-cursor-help">
                                            <i-ant-design-question-circle-outlined />
                                        </el-icon>
                                    </el-tooltip>
                                </span>
                            </template>
                            <el-input v-model="formData.animate_duration" placeholder="请输入动画时长" @input="handleAnimateDurationChange(formData.animate_duration, 2)"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="9">
                        <el-form-item prop="animate_enter">
                            <template #label>
                                <span class="xl-label-with-icon">
                                    进入动画
                                    <el-tooltip
                                        effect="dark"
                                        content="对应页面加载时动画，目前仅支持 <a href='https://animate.style/' target='_blank' style='color:white'>https://animate.style/</a> 动画，复制对应动画样式填入即可，默认 fadeIn 效果"
                                        raw-content
                                        placement="top"
                                    >
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
                                    <el-tooltip
                                        effect="dark"
                                        content="上一页面离开时动画，目前仅支持 <a href='https://animate.style/' target='_blank' style='color:white'>https://animate.style/</a> 动画，复制对应动画样式填入即可，默认 fadeOut 效果"
                                        raw-content
                                        placement="top"
                                    >
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
            <div v-else-if="step === STEP.PERMISSION" class="xl-transfer">
                <!-- 骨架屏 -->
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
                <!-- 权限选择器 -->
                <el-form-item v-else label="菜单权限" prop="api_list">
                    <el-transfer
                        v-model="formData.api_list"
                        filterable
                        :filter-method="filterPermission"
                        :props="{ key: 'id', label: 'name' }"
                        :data="permissionList"
                        :titles="['全部接口', '已授权接口']"
                        target-order="push"
                        filter-placeholder="接口名称或路由"
                    />
                </el-form-item>
            </div>
        </el-drawer>
    </div>
</template>

<style lang="scss">
.xl-drawer-c .el-drawer__header {
    margin-bottom: 0 !important;
}

.xl-transfer {
    display: flex;
    justify-content: space-around;
}
</style>

<script setup>
import { Icon as XlIcon } from '@iconify/vue'
import xlTableList from '@/components/tableList/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { deleteMenu, createMenu, updateMenu, getMenuList, getMenuDetail, getPermissionList } from '@/api/permission'
import { filterNullUndefined, checkNumber, pick } from '@/utils/helper'
import { onMounted, reactive, ref, computed } from 'vue'
import Clipboard from 'clipboard'
import { ElLoading, ElMessage, ElMessageBox } from 'element-plus'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import { usePermission } from '@/composables/usePermission'
const { getButtonInfoFull } = usePermission()
const addChildButtonInfo = getButtonInfoFull('menu:addChild')
const addButtonInfo = getButtonInfoFull('menu:add')
const updateButtonInfo = getButtonInfoFull('menu:update')
const deleteButtonInfo = getButtonInfoFull('menu:delete')

/**
 * 操作按钮配置
 */
const actionButtons = computed(() => {
    return [
        {
            permission: 'menu:addChild',
            buttonInfo: addChildButtonInfo,
            showIcon: false,
            click: (row) => handleAddChild(row),
        },
        {
            permission: 'menu:update',
            buttonInfo: updateButtonInfo,
            showIcon: false,
            click: (row, index) => openEditDrawer(OPERATION_TYPE.EDIT, row, index),
        },
        {
            permission: 'menu:delete',
            buttonInfo: deleteButtonInfo,
            showIcon: false,
            click: (row) => handleDelete(row),
            divided: true,
        },
    ]
})

// ==================== 常量定义 ====================
/** 菜单类型 */
const MENU_TYPE = {
    DIRECTORY: 1, // 目录
    MENU: 2, // 菜单
    BUTTON: 3, // 按钮
}

/** 操作类型 */
const OPERATION_TYPE = {
    ADD: 1, // 新增
    EDIT: 2, // 编辑
}

/** 步骤 */
const STEP = {
    BASIC_INFO: 1, // 基础信息
    PERMISSION: 2, // 选择权限
}

/** 状态值 */
const STATUS = {
    DISABLED: 0, // 禁用
    ENABLED: 1, // 正常
    ALL: 2, // 全部
}

/** 开关值 */
const SWITCH_VALUE = {
    NO: 0,
    YES: 1,
}

/** 提交防抖时间（毫秒） */
const SUBMIT_DEBOUNCE_TIME = 3000

/** 权限列表查询参数 */
const PERMISSION_QUERY_PARAMS = {
    page: 1,
    per_page: 9999,
    is_auth: 1,
}

// ==================== 级联选择器配置 ====================
const cascaderProps = {
    checkStrictly: true,
    expandTrigger: 'hover',
    label: 'title',
    value: 'id',
    emitPath: false,
    disabled: 'disabled',
}

// ==================== 响应式数据 ====================
// 列表相关
const loading = ref(true)
const menuList = ref([])
const selectMenuList = ref([])
const tableListRef = ref(null)
const isExpanded = ref(false) // 默认展开，因为设置了 default-expand-all
const queryWhere = reactive({
    keyword: null,
    is_auth: null,
    status: STATUS.ALL,
})

// 抽屉相关
const showDrawer = ref(false)
const step = ref(STEP.BASIC_INFO)
const formTitle = ref('新增菜单')
const formDataRef = ref(null)
const isParentFixed = ref(false) // 上级菜单是否固定（新增子菜单时固定）
const currentIndex = ref(null)
const isSubmitting = ref(false)

// 权限相关
const permissionList = ref(null)
const permissionListLoading = ref(false) // 权限列表加载状态

// 表单引用
const queryFormRef = ref(null)

// ==================== 初始表单数据 ====================
const initialFormData = {
    id: 0,
    title: '',
    pid: 0,
    path: '',
    redirect: '',
    name: '',
    component: '',
    code: '',
    is_external_links: 0,
    icon: '',
    sort: 100,
    type: MENU_TYPE.MENU,
    is_auth: 1,
    status: 1,
    is_show: 1,
    is_new_window: 0,
    animate_duration: 0,
    animate_enter: '',
    animate_leave: '',
    description: '',
    api_list: [],
}

const formData = reactive({ ...initialFormData })

// ==================== 工具函数 ====================
/**
 * 复制文本到剪贴板
 */
const handleCopyClick = (text) => {
    Clipboard.copy(text)
}

/**
 * 重置表单数据
 */
const resetFormData = () => {
    Object.assign(formData, initialFormData)
    if (formDataRef.value) {
        formDataRef.value.clearValidate()
    }
}

/**
 * 处理动画时长输入
 */
let numericValue
const handleAnimateDurationChange = (value, decimal = 2) => {
    // 去掉开头的 0（除非后面跟着小数点）
    const val = value.replace(/^(0+)(?=\d)/, '')
    formData.animate_duration = val

    if (value === '') {
        formData.animate_duration = 0
        return
    }

    if (checkNumber(value, decimal)) {
        numericValue = val
        return true
    }

    formData.animate_duration = numericValue
}

/**
 * 处理路由地址变化，自动判断是否为外链
 */
const handlePathChange = (val) => {
    const isExternalLink = val.startsWith('http://') || val.startsWith('https://')
    formData.is_external_links = isExternalLink ? SWITCH_VALUE.YES : SWITCH_VALUE.NO
}

// ==================== 表单验证规则 ====================
const editFormRules = {
    title: [
        { required: true, message: '名称不能为空', trigger: 'blur' },
        { min: 1, max: 12, message: '名称不超过12个字符', trigger: 'blur' },
    ],
    pid: [
        {
            required: true,
            message: '上级菜单不能为空',
            trigger: 'blur',
            validator: (rule, value, callback) => {
                // pid 可以是 0（顶级菜单）或大于 0 的数字
                if (value === null || value === undefined || value === '') {
                    callback(new Error('上级菜单不能为空'))
                } else {
                    callback()
                }
            },
        },
    ],
    type: [{ required: true, message: '菜单类型不能为空', trigger: 'blur' }],
    is_auth: [{ required: true, message: '是否鉴权不能为空', trigger: 'blur' }],
    is_show: [{ required: true, message: '是否显示不能为空', trigger: 'blur' }],
    sort: [{ trigger: 'blur', type: 'integer', message: '请输入整数类型' }],
    path: [
        {
            trigger: 'blur',
            validator: (rule, value, callback) => {
                callback()
            },
        },
    ],
    name: [
        {
            trigger: 'blur',
            validator: (rule, value, callback) => {
                // 菜单类型必须填写路由名称
                if (formData.type === MENU_TYPE.MENU && !value) {
                    callback(new Error('请输入路由名称'))
                }
                callback()
            },
        },
    ],
    component: [
        {
            trigger: 'blur',
            validator: (rule, value, callback) => {
                // 菜单类型且非外链时必须填写组件路径
                if (formData.type === MENU_TYPE.MENU && formData.is_external_links !== SWITCH_VALUE.YES) {
                    if (!value) {
                        callback(new Error('请输入组件路径'))
                    }
                }
                // 组件路径验证
                if (value) {
                    if (value.startsWith('/')) {
                        callback(new Error('组件路径不能以 / 开头'))
                    }
                    if (!/^[a-zA-Z0-9/._-]+$/.test(value)) {
                        callback(new Error('组件路径只能包含字母、数字、/、.、_、-'))
                    }
                }
                callback()
            },
        },
    ],
    code: [
        {
            trigger: 'blur',
            validator: (rule, value, callback) => {
                // 按钮类型必须填写权限标识
                if (formData.type === MENU_TYPE.BUTTON && !value) {
                    callback(new Error('请输入权限标识'))
                }
                callback()
            },
        },
    ],
}

// ==================== 表单操作 ====================
/**
 * 处理步骤切换
 */
const handleStepChange = async (targetStep) => {
    if (targetStep === STEP.PERMISSION) {
        // 切换到权限选择步骤，先验证表单
        try {
            await formDataRef.value.validate()
            // 验证通过，先切换到权限选择步骤，不阻塞
            step.value = targetStep
            // 按需获取权限列表（异步加载，不阻塞步骤切换）
            if (!permissionList.value) {
                permissionListLoading.value = true
                fetchPermissionList()
                    .then(() => {
                        // 权限列表加载完成
                    })
                    .catch((error) => {
                        console.error('获取权限列表失败:', error)
                    })
                    .finally(() => {
                        permissionListLoading.value = false
                    })
            }
        } catch (fields) {
            // 验证失败，自动滚动到第一个错误字段
            if (fields && typeof fields === 'object') {
                const firstErrorField = Object.keys(fields)[0]
                if (firstErrorField && formDataRef.value) {
                    formDataRef.value.scrollToField(firstErrorField)
                }
            }
            ElMessage.warning('请先完善基础信息')
        }
    } else {
        step.value = targetStep
    }
}

/**
 * 提交表单
 */
const handleSubmit = async () => {
    if (isSubmitting.value) return

    isSubmitting.value = true

    // 根据菜单类型清理不需要的字段
    if (formData.type === MENU_TYPE.BUTTON) {
        // 按钮类型：清空菜单相关字段
        formData.name = ''
        formData.path = ''
        formData.redirect = ''
        formData.component = ''
    } else {
        // 非按钮类型：清空权限标识
        formData.code = ''
    }

    try {
        // 根据是否有 id 判断是新增还是编辑
        if (formData.id > 0) {
            await updateMenu(formData)
        } else {
            await createMenu(formData)
        }
        ElMessage.success('操作成功')
        getList()
        showDrawer.value = false
    } catch (error) {
        console.error('提交失败:', error)
    } finally {
        setTimeout(() => {
            isSubmitting.value = false
        }, SUBMIT_DEBOUNCE_TIME)
    }
}

/**
 * 取消操作
 */
const handleCancel = () => {
    // 编辑模式下退出需要确认
    if (formData.id > 0) {
        ElMessageBox.confirm(`已填写数据将会重置，确认退出${formTitle.value}吗?`, '温馨提示')
            .then(() => {
                closeDrawer()
            })
            .catch(() => {
                // 用户取消，不做任何操作
            })
    } else {
        closeDrawer()
    }
}

/**
 * 关闭抽屉
 */
const closeDrawer = () => {
    showDrawer.value = false
    isParentFixed.value = false
}

/**
 * 抽屉关闭前的回调
 */
const handleDrawerClose = (done) => {
    if (formData.id > 0) {
        ElMessageBox.confirm(`已填写数据将会重置，确认退出${formTitle.value}吗?`, '温馨提示')
            .then(() => {
                isParentFixed.value = false
                done()
            })
            .catch(() => {
                // 用户取消，不做任何操作
            })
    } else {
        isParentFixed.value = false
        done()
    }
}

// ==================== 菜单操作 ====================
/**
 * 新增子菜单
 */
const handleAddChild = (parentRow) => {
    if (!parentRow || typeof parentRow.id !== 'number') {
        ElMessage.error('无效的行数据')
        return
    }
    openEditDrawer(OPERATION_TYPE.ADD, null, 0, parentRow.id)
}

/**
 * 打开编辑抽屉
 */
const openEditDrawer = (type, row, index, fixedParentId = null) => {
    // 参数校验
    if (typeof type !== 'number' || ![OPERATION_TYPE.ADD, OPERATION_TYPE.EDIT].includes(type)) {
        return
    }

    if (type === OPERATION_TYPE.EDIT && (!row || typeof row.id !== 'number')) {
        ElMessage.error('无效的行数据')
        return
    }

    // 重置表单和步骤
    resetFormData()
    step.value = STEP.BASIC_INFO

    if (type === OPERATION_TYPE.EDIT) {
        // 编辑模式
        formTitle.value = '编辑菜单'
        isParentFixed.value = false
        loadMenuDetail(row.id, index)
    } else {
        // 新增模式
        formTitle.value = '新增菜单'
        if (fixedParentId !== null) {
            formData.pid = fixedParentId
            isParentFixed.value = true
        } else {
            isParentFixed.value = false
        }
        showDrawer.value = true
    }
}

/**
 * 加载菜单详情
 */
const loadMenuDetail = async (menuId, index) => {
    const loadingInstance = ElLoading.service({
        lock: true,
        text: '加载中...',
        background: 'rgba(0, 0, 0, 0.7)',
        zIndex: 3000,
    })

    try {
        const res = await getMenuDetail({ id: menuId })
        if (res?.data) {
            Object.assign(formData, pick(res.data, Object.keys(initialFormData)))
            currentIndex.value = index
            showDrawer.value = true
        } else {
            throw new Error('获取的数据无效')
        }
    } catch (error) {
        ElMessage.error('获取菜单详情失败')
        console.error(error)
    } finally {
        loadingInstance.close()
    }

    // 按需获取权限列表（异步加载，不阻塞）
    if (!permissionList.value) {
        permissionListLoading.value = true
        fetchPermissionList()
            .then(() => {
                // 权限列表加载完成
            })
            .catch((error) => {
                console.error('获取权限列表失败:', error)
            })
            .finally(() => {
                permissionListLoading.value = false
            })
    }
}

/**
 * 删除菜单
 */
const handleDelete = async (row) => {
    try {
        await ElMessageBox.confirm('确认删除该菜单吗?', '温馨提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            beforeClose: async (action, instance, done) => {
                if (action === 'confirm') {
                    instance.confirmButtonLoading = true
                    instance.confirmButtonText = '删除中...'
                    try {
                        await deleteMenu({ id: row.id })
                        ElMessage.success('删除成功')
                        getList()
                        done()
                    } catch (error) {
                        console.error('删除失败:', error)
                        instance.confirmButtonLoading = false
                        instance.confirmButtonText = '确认'
                    }
                } else {
                    done()
                }
            },
        })
    } catch {
        // 用户取消删除时不处理
    }
}

// ==================== 权限相关 ====================
/**
 * 过滤权限选项
 */
const filterPermission = (query, item) => {
    const lowerQuery = query.toLowerCase()
    return item.name.toLowerCase().includes(lowerQuery) || item.route.includes(lowerQuery)
}

/**
 * 获取权限列表
 */
const fetchPermissionList = async () => {
    try {
        const res = await getPermissionList(PERMISSION_QUERY_PARAMS)
        permissionList.value = res.data?.data || res.data || []
    } catch (error) {
        console.error('获取权限列表失败:', error)
        ElMessage.error('获取权限列表失败')
        throw error
    }
}

// ==================== 菜单列表相关 ====================
/**
 * 递归处理菜单项，禁用按钮类型和当前编辑的菜单
 */
const processMenuItem = (item, currentId) => {
    const menuItem = { ...item }

    // 当前编辑的菜单或按钮类型需要禁用
    if (item.id === currentId || item.type === MENU_TYPE.BUTTON) {
        menuItem.disabled = true
    }

    // 递归处理子菜单
    if (item.children?.length > 0) {
        menuItem.children = item.children.map((child) => processMenuItem(child, currentId))
    }

    return menuItem
}

/**
 * 获取级联选择器的菜单列表
 */
const getSelectMenuList = (currentMenuId) => {
    const processedList = menuList.value.slice().map((item) => processMenuItem(item, currentMenuId))

    // 添加顶级菜单选项
    selectMenuList.value = [{ title: '顶级菜单', id: 0 }, ...processedList]
    return selectMenuList.value
}

// ==================== 列表查询 ====================
/**
 * 搜索
 */
const handleSearch = () => {
    getList()
}

/**
 * 切换展开/折叠所有行
 */
const handleToggleExpand = () => {
    if (!tableListRef.value) return
    isExpanded.value = !isExpanded.value
    tableListRef.value.toggleAllRows(isExpanded.value)
}

/**
 * 获取菜单列表
 */
const getList = async () => {
    loading.value = true
    try {
        const res = await getMenuList(filterNullUndefined(queryWhere))
        menuList.value = res.data
    } catch (error) {
        console.error('获取菜单列表失败:', error)
        ElMessage.error('获取菜单列表失败')
    } finally {
        loading.value = false
    }
}

// ==================== 生命周期 ====================
onMounted(() => {
    getList()
})

const tableTitle = [
    {
        prop: 'title',
        h_label: '接口名称',
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
        formatter: (row) => {
            return row.type === MENU_TYPE.BUTTON ? row.code || '-' : row.full_path || '-'
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
            1: {
                type: 'primary',
                text: '目录',
            },
            2: {
                type: 'success',
                text: '菜单',
            },
            3: {
                type: 'danger',
                text: '按钮',
            },
        },
    },
    {
        prop: 'status',
        h_label: '状态',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            0: {
                type: 'danger',
                text: '禁用',
            },
            1: {
                type: 'success',
                text: '正常',
            },
        },
    },
    {
        prop: 'is_show',
        h_label: '是否显示',
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
        h_tip: '表示该目录或菜单是否显示在左侧菜单栏中，按钮不受该字段控制',
    },
    {
        prop: 'is_auth',
        h_label: '是否鉴权',
        align: 'center',
        width: 130,
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
        h_tip: '如无需鉴权则有登录权限用户都可以看到',
    },
    {
        prop: 'is_external_links',
        h_label: '是否外链',
        align: 'center',
        width: 130,
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
    },
    {
        prop: 'is_new_window',
        h_label: '新窗口打开',
        align: 'center',
        width: 150,
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
    },
    {
        prop: 'sort',
        h_label: '权重',
        align: 'center',
        width: 100,
        h_tip: '权重值越大，排序越靠前',
    },
    {
        prop: 'created_at',
        width: 160,
        align: 'center',
        h_label: '创建时间',
    },
    {
        prop: 'updated_at',
        h_label: '更新时间',
        align: 'center',
        width: 160,
        h_tip: '显示最后更新时间',
    },
]
</script>
