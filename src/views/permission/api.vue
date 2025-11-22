<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="6">
                        <el-form-item label="关键字" prop="keyword">
                            <el-input placeholder="支持CODE、接口名称、接口地址搜索" v-model.trim="queryWhere.keyword" clearable></el-input>
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
                        <el-form-item label="是否鉴权" prop="is_auth">
                            <el-select v-model="queryWhere.is_auth" clearable placeholder="请选择是否鉴权">
                                <el-option label="是" :value="SWITCH_VALUE.YES" />
                                <el-option label="否" :value="SWITCH_VALUE.NO" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="是否有效" prop="is_effective">
                            <el-select v-model="queryWhere.is_effective" clearable placeholder="请选择是否有效">
                                <el-option label="是" :value="SWITCH_VALUE.YES" />
                                <el-option label="否" :value="SWITCH_VALUE.NO" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container" v-loading="loading" element-loading-text="数据全力加载中..." element-loading-custom-class="xl-loading">
            <xl-table-list :data="permissionList" :tableTitle="tableTitle" :pagination="pagination">
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
                <el-form-item label="CODE">
                    <el-input v-model.trim="currentRow.code" disabled></el-input>
                </el-form-item>
                <el-form-item label="接口名称" prop="name">
                    <el-input v-model.trim="currentRow.name" placeholder="请输入接口名称"></el-input>
                </el-form-item>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item prop="is_auth">
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
                            <el-select v-model="currentRow.is_auth" placeholder="请选择是否鉴权" clearable>
                                <el-option label="是" :value="SWITCH_VALUE.YES" />
                                <el-option label="否" :value="SWITCH_VALUE.NO" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="是否有效">
                            <el-select v-model="currentRow.is_effective" disabled>
                                <el-option label="是" :value="SWITCH_VALUE.YES" />
                                <el-option label="否" :value="SWITCH_VALUE.NO" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
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
                            <el-input v-model.number="currentRow.sort" clearable placeholder="请输入权重值" @input="handleSortNumberChange" @focus="sortNumericValue = currentRow.sort"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="请求方法">
                            <el-select v-model="currentRow.method" disabled>
                                <el-option v-for="item in METHOD_OPTIONS" :key="item.value" :label="item.label" :value="item.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="接口描述" prop="desc">
                    <el-input v-model.trim="currentRow.desc" maxlength="255" placeholder="描述" show-word-limit type="textarea" />
                </el-form-item>
                <el-form-item label="接口地址">
                    <el-input v-model.trim="currentRow.route" disabled></el-input>
                </el-form-item>
                <el-form-item label="接口功能">
                    <el-input v-model.trim="currentRow.func_path" disabled></el-input>
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

<script setup>
import { Icon as XlIcon } from '@iconify/vue'
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import { editPermission, getPermissionList } from '@/api/permission'
import { checkNumber, filterNullUndefined } from '@/utils/helper'
import { onMounted, reactive, ref, computed } from 'vue'
import Clipboard from 'clipboard'
import { ElMessage } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
const { getButtonInfoFull } = usePermission()
const buttonInfo = getButtonInfoFull('api:update')
/**
 * 操作按钮配置
 */
const actionButtons = computed(() => {
    return [
        {
            permission: 'api:update',
            buttonInfo: buttonInfo,
            showIcon: false,
            click: (row, index) => handleEditClick(row, index),
        },
    ]
})

// ==================== 常量定义 ====================
/** 提交防抖时间（毫秒） */
const SUBMIT_DEBOUNCE_TIME = 3000

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

/** 开关值 */
const SWITCH_VALUE = {
    NO: 0,
    YES: 1,
}

// ==================== 工具函数 ====================
/**
 * 复制文本到剪贴板
 */
const handleCopyClick = (text) => {
    Clipboard.copy(text)
}

/**
 * 处理排序数字输入
 */
let sortNumericValue
const handleSortNumberChange = (value) => {
    if (value === '') {
        currentRow.value.sort = 0
        return
    }
    if (checkNumber(value, 0)) {
        sortNumericValue = value
        return true
    }
    currentRow.value.sort = sortNumericValue
}

// ==================== 响应式数据 ====================
// 抽屉相关
const showDrawer = ref(false)
const currentRowRef = ref(null)
const currentRow = ref(null)
const currentIndex = ref(null)
const isSubmitting = ref(false)

// 列表相关
const loading = ref(false)
const permissionList = ref([])
const queryFormRef = ref(null)

// ==================== 表单验证规则 ====================
const editFormRules = {
    name: [
        { required: true, message: '接口名称不能为空', trigger: 'blur' },
        { min: 1, max: 60, message: '名称不超过60个字符', trigger: 'blur' },
    ],
    is_auth: [
        { required: true, message: '是否鉴权必填', trigger: 'change' },
        { type: 'enum', enum: [SWITCH_VALUE.NO, SWITCH_VALUE.YES], message: '选择的值只能是或否', trigger: 'change' },
    ],
    sort: [{ trigger: 'blur', type: 'integer', message: '请输入整数类型' }],
}

// ==================== 查询相关 ====================
const queryWhere = reactive({
    page: 1,
    per_page: 10,
    method: null,
    keyword: null,
    is_auth: null,
    is_effective: null,
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
    getList()
}

// ==================== 表单操作 ====================
/**
 * 提交表单
 */
const editConfirmSubmit = async () => {
    if (isSubmitting.value) return

    isSubmitting.value = true

    try {
        const valid = await currentRowRef.value.validate().catch(() => false)
        if (!valid) {
            isSubmitting.value = false
            return
        }

        const submitData = {
            id: currentRow.value.id,
            name: currentRow.value.name,
            sort: currentRow.value.sort,
            is_auth: currentRow.value.is_auth,
            desc: currentRow.value.desc,
        }

        await editPermission(submitData)
        permissionList.value[currentIndex.value] = { ...currentRow.value }
        showDrawer.value = false
        ElMessage.success('编辑成功')
    } catch (error) {
        console.error('提交失败:', error)
    } finally {
        setTimeout(() => {
            isSubmitting.value = false
        }, SUBMIT_DEBOUNCE_TIME)
    }
}

/**
 * 打开编辑抽屉
 */
const handleEditClick = (row, index) => {
    currentRow.value = { ...row }
    currentIndex.value = index
    showDrawer.value = true
}

// ==================== 列表相关 ====================
/**
 * 获取权限列表
 */
const getList = async () => {
    loading.value = true

    try {
        const res = await getPermissionList(filterNullUndefined(queryWhere))
        pagination.total = res.data.total
        pagination.page = res.data.current_page
        pagination.page_size = res.data.per_page
        permissionList.value = res.data.data
    } catch (error) {
        console.error('获取权限列表失败:', error)
        ElMessage.error('获取权限列表失败')
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
                color: '#67C23A',
                text: 'ant-design:check-outlined',
            },
            0: {
                color: '#F56C6C',
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
