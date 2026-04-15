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
                        <el-form-item label="手机号" prop="phone_number">
                            <el-input placeholder="请输入手机号" v-model.trim="queryWhere.phone_number" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="邮箱" prop="email">
                            <el-input placeholder="请输入邮箱" v-model.trim="queryWhere.email" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item label="状态" prop="status">
                            <el-select v-model="queryWhere.status" clearable placeholder="请选择状态">
                                <el-option label="正常" :value="STATUS.NORMAL" />
                                <el-option label="禁用" :value="STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item label="部门" prop="dept_id">
                            <el-select v-model="queryWhere.dept_id" clearable placeholder="请选择部门" filterable>
                                <el-option v-for="dept in departmentOptions" :key="dept.value" :label="dept.label" :value="dept.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="5" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <div style="display: flex; align-items: center; margin-bottom: 10px">
                <xl-action-button v-permission="'adminUser:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(EDIT_TYPE.ADD)" />
            </div>
            <div v-loading="loading" element-loading-text="数据全力加载中..." element-loading-custom-class="xl-loading">
                <xl-table-list :data="adminUserList" :tableTitle="tableTitle" :pagination="pagination">
                    <!-- 渲染表格列的内容 -->
                    <template #td="{ item, val, row }">
                        <el-avatar v-if="item.avatar" :size="50" :src="getImageUrl(val)">
                            <el-icon size="32">
                                <i-ep-avatar />
                            </el-icon>
                        </el-avatar>
                        <el-tag v-else-if="item.tag" :type="item.tag[val]?.type || item.tag['other']?.type">
                            {{ item.tag[val]?.text || val }}
                        </el-tag>
                        <el-tooltip v-else-if="item.copy" trigger="click" effect="customized" content="复制成功" placement="left">
                            <span @click="handleCopyClick(val)" class="xl-cursor-pointer"> {{ val }}</span>
                        </el-tooltip>
                        <div v-else-if="item.eye" style="display: flex; align-items: center; gap: 3px">
                            <span>{{ val || '-' }}</span>
                            <!-- 新增图标状态管理 -->
                            <el-icon v-show="val !== ''" size="small" class="xl-cursor-hover" @click="item.getFullInfo(row, item)">
                                <i-ant-design-eye-invisible-outlined v-if="row.showFullPhoneNumber" />
                                <i-ant-design-eye-outlined v-else />
                            </el-icon>
                        </div>
                        <span v-else>
                            {{ val }}
                        </span>
                    </template>
                    <!-- 操作列 -->
                    <template #operation>
                        <el-table-column width="200" label="操作" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" :maxVisibleButtons="2" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>
        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting">
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" :rules="getDynamicRules(formData.id)" :key="currentIndex">
                <el-row>
                    <el-col :span="12">
                        <el-form-item label="头像" prop="avatar">
                            <el-upload class="avatar-uploader" :show-file-list="false" :on-success="handleAvatarSuccess" :before-upload="beforeAvatarUpload" :http-request="customUpload">
                                <img w-full v-if="formData.avatar" :src="getImageUrl(formData.avatar)" class="avatar" />
                                <el-icon v-else class="avatar-uploader-icon"><i-ep-plus /></el-icon>
                            </el-upload>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="昵称" prop="nickname">
                            <el-input v-model.trim="formData.nickname" placeholder="请输入昵称"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="用户名" prop="username">
                            <el-input v-model.trim="formData.username" placeholder="请输入用户名" :disabled="isEditMode"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="手机号" prop="phone_number">
                            <el-input v-model.trim="formData.phone_number" placeholder="请输入手机号" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="邮箱" prop="email">
                            <el-input v-model.trim="formData.email" placeholder="请输入邮箱"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item prop="dept_ids" label="部门">
                            <el-select v-model="formData.dept_ids" placeholder="请选择部门" clearable multiple collapse-tags collapse-tags-tooltip>
                                <el-option v-for="dept in departmentOptions" :key="dept.value" :label="dept.label" :value="dept.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item prop="status" label="状态">
                            <el-select v-model="formData.status" placeholder="请选择状态" clearable :disabled="isRootAdminEditing">
                                <el-option label="正常" :value="STATUS.NORMAL" />
                                <el-option label="禁用" :value="STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="密码" prop="password">
                            <el-input v-model.trim="formData.password" placeholder="请输入密码" type="password" show-password></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="确认密码" prop="confirm_password">
                            <el-input v-model.trim="formData.confirm_password" placeholder="请输入确认密码" type="password" show-password></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </xl-drawer>

        <!-- 绑定角色抽屉 -->
        <xl-drawer v-model="showBindRoleDrawer" title="绑定角色" :formRef="bindRoleFormRef" :onConfirm="bindRoleConfirmSubmit" :isSubmitting="isBindingRole">
            <!-- 骨架屏 -->
            <el-skeleton v-if="roleOptionsLoading" animated>
                <template #template>
                    <el-form size="default" label-width="auto">
                        <el-form-item>
                            <template #label>
                                <el-skeleton-item variant="text" style="width: 80px" />
                            </template>
                            <el-skeleton-item variant="rect" style="width: 100%; height: 32px" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <el-skeleton-item variant="text" style="width: 60px" />
                            </template>
                            <el-skeleton-item variant="rect" style="width: 100%; height: 300px" />
                        </el-form-item>
                    </el-form>
                </template>
            </el-skeleton>
            <!-- 表单内容 -->
            <el-form v-else ref="bindRoleFormRef" size="default" :model="bindRoleData" label-width="auto">
                <el-form-item label="管理员">
                    <el-input :value="currentAdminUserName" disabled></el-input>
                </el-form-item>
                <el-form-item label="角色" prop="role_ids">
                    <el-transfer
                        v-model="bindRoleData.role_ids"
                        filterable
                        :filter-method="filterRole"
                        :props="transferProps"
                        :data="roleTransferOptions"
                        :titles="['全部角色', '已绑定角色']"
                        target-order="push"
                        filter-placeholder="角色名称"
                        class="xl-transfer"
                    />
                </el-form-item>
            </el-form>
        </xl-drawer>
    </div>
</template>

<style lang="scss" scoped>
.el-form-item {
    width: 100% !important;
}

.avatar-uploader .avatar {
    width: 98px;
    height: 98px;
    display: block;
}

:deep(.xl-transfer) {
    display: flex;
    justify-content: space-between;
    width: 100%;

    .el-transfer-panel {
        flex: 1;
        max-width: 45%;
        min-width: 0;
    }

    .el-transfer__buttons {
        flex-shrink: 0;
        padding: 0 10px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 10px;

        .el-button {
            margin: 0;
        }
    }
}
</style>

<style>
.avatar-uploader .el-upload {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
    border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 98px;
    height: 98px;
    text-align: center;
}
</style>

<script setup>
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import { getImageUrl } from '@/utils/helper'
import { onMounted, computed } from 'vue'
import Clipboard from 'clipboard'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
import { ADMIN_USER_EDIT_TYPE, ADMIN_USER_STATUS, isRootAdminUser } from '@/modules/adminUser/model'
import { deleteAdminUserItem } from '@/modules/adminUser/service'
import { useAdminUserList } from '@/modules/adminUser/useAdminUserList'
import { useAdminUserForm } from '@/modules/adminUser/useAdminUserForm'
import { useAdminUserRoleBinding } from '@/modules/adminUser/useAdminUserRoleBinding'
const { getButtonInfoFull } = usePermission()
const updateButtonInfo = getButtonInfoFull('adminUser:update')
const bindRoleButtonInfo = getButtonInfoFull('adminUser:bindRole')
const deleteButtonInfo = getButtonInfoFull('adminUser:delete')
const addButtonInfo = getButtonInfoFull('adminUser:add')

/**
 * 操作按钮配置
 */
const actionButtons = computed(() => {
    return [
        {
            permission: 'adminUser:update',
            buttonInfo: updateButtonInfo,
            showIcon: true,
            showText: true,
            click: (row, index) => openEditDrawer(EDIT_TYPE.EDIT, row, index),
        },
        {
            permission: 'adminUser:bindRole',
            buttonInfo: bindRoleButtonInfo,
            showIcon: true,
            showText: true,
            click: (row) => handleBindRole(row),
        },
        {
            permission: 'adminUser:delete',
            buttonInfo: deleteButtonInfo,
            showIcon: true,
            showText: true,
            click: (row) => handleDelete(row),
            divided: true,
            disabled: (row) => isRootAdminUser(row),
            tooltip: (row) => (isRootAdminUser(row) ? '该系统保留对象不允许删除' : ''),
        },
    ]
})

// ==================== 常量定义 ====================
const STATUS = ADMIN_USER_STATUS
const EDIT_TYPE = ADMIN_USER_EDIT_TYPE

// ==================== 工具函数 ====================
/**
 * 复制文本到剪贴板
 */
const handleCopyClick = (text) => {
    Clipboard.copy(text)
}

const { loading, adminUserList, departmentOptions, queryFormRef, queryWhere, pagination, getList, getDepartmentOptions, handleSearch, createToggleFullInfo, fetchAdminUserFullPhone, fetchAdminUserFullEmail } =
    useAdminUserList()
const {
    showDrawer,
    formDataRef,
    formTitle,
    currentIndex,
    isSubmitting,
    formData,
    isEditMode,
    isRootAdminEditing,
    getDynamicRules,
    beforeAvatarUpload,
    handleAvatarSuccess,
    customUpload,
    openEditDrawer,
    editConfirmSubmit,
} = useAdminUserForm({ refreshList: getList })
const {
    showBindRoleDrawer,
    bindRoleFormRef,
    isBindingRole,
    currentAdminUserName,
    currentUserIsRootAdmin,
    superAdminRoleId,
    roleOptions,
    roleOptionsLoading,
    bindRoleData,
    filterRole,
    handleBindRole,
    bindRoleConfirmSubmit,
} = useAdminUserRoleBinding({ refreshList: getList })

// ==================== 操作处理 ====================
/**
 * 删除管理员
 */
const handleDelete = async (row) => {
    if (isRootAdminUser(row)) {
        ElMessage.warning('ID 为 1 的用户不允许删除')
        return
    }

    try {
        await ElMessageBox.confirm('确认删除该管理员吗?', '温馨提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            beforeClose: async (action, instance, done) => {
                if (action === 'confirm') {
                    instance.confirmButtonLoading = true
                    instance.confirmButtonText = '删除中...'
                    try {
                        await deleteAdminUserItem(row.id)
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

const transferProps = {
    key: 'id',
    label: 'name',
    disabled: 'disabled',
}

const roleTransferOptions = computed(() => {
    return (roleOptions.value || []).map((role) => ({
        ...role,
        disabled: currentUserIsRootAdmin.value && role.id === superAdminRoleId.value,
    }))
})

onMounted(() => {
    getList()
    getDepartmentOptions()
})

const tableTitle = [
    {
        prop: 'id',
        align: 'center',
        h_label: 'ID',
    },
    {
        prop: 'avatar',
        align: 'center',
        h_label: '头像',
        width: 100,
        customRow: true,
        avatar: true,
    },
    {
        prop: 'nickname',
        h_label: '昵称',
        width: 160,
        overflow: true,
    },
    {
        prop: 'username',
        h_label: '用户名',
        width: 120,
        overflow: true,
        h_tip: '用户名是唯一的，不能重复',
        copy: true,
        customRow: true,
    },
    {
        prop: 'phone_number',
        h_label: '手机号',
        minWidth: 160,
        customRow: true,
        eye: true,
        getFullInfo: createToggleFullInfo('phone_number', 'old_phone_number', fetchAdminUserFullPhone),
        formatter: (row) => {
            if (!row.phone_number) return ''
            return row.country_code ? `+${row.country_code} ${row.phone_number}` : row.phone_number
        },
    },
    {
        prop: 'email',
        h_label: '邮箱',
        minWidth: 180,
        customRow: true,
        eye: true,
        getFullInfo: createToggleFullInfo('email', 'old_email', fetchAdminUserFullEmail),
    },
    {
        prop: 'departments',
        h_label: '部门',
        minWidth: 200,
        customRow: true,
        formatter: (row) => {
            // 格式化部门数组，将部门名称用英文逗号连接
            if (!row.departments || !Array.isArray(row.departments) || row.departments.length === 0) {
                return '-'
            }
            return row.departments.map((dept) => dept.name).join(', ')
        },
    },
    {
        prop: 'status',
        h_label: '状态',
        align: 'center',
        width: 120,
        customRow: true,
        tag: {
            [STATUS.NORMAL]: { type: 'success', text: '正常' },
            [STATUS.DISABLED]: { type: 'danger', text: '禁用' },
        },
        h_tip: '判断用户是否被禁止登录',
    },
    {
        prop: 'updated_at',
        align: 'center',
        h_label: '创建时间',
        width: 160,
    },
    {
        prop: 'updated_at',
        align: 'center',
        h_label: '更新时间',
        width: 160,
    },
    {
        prop: 'last_login',
        align: 'center',
        h_label: '最后登录时间',
        width: 160,
    },
    {
        prop: 'last_ip',
        align: 'center',
        h_label: '最后登录IP',
        width: 150,
    },
]
</script>
