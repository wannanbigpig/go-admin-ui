<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item :label="t('common.labels.username')" prop="username">
                            <el-input :placeholder="t('common.placeholders.inputUsername')" v-model.trim="queryWhere.username" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="3">
                        <el-form-item :label="t('common.labels.status')" prop="status">
                            <el-select v-model="queryWhere.status" clearable :placeholder="t('common.placeholders.selectStatus')">
                                <el-option :label="t('common.status.enabled')" :value="STATUS.ENABLED" />
                                <el-option :label="t('common.status.disabled')" :value="STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="4">
                        <el-form-item :label="t('common.labels.department')" prop="dept_id">
                            <el-select v-model="queryWhere.dept_id" clearable :placeholder="t('common.placeholders.selectDepartment')" filterable>
                                <el-option v-for="dept in departmentOptions" :key="dept.value" :label="dept.label" :value="dept.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <div class="xl-table-actions">
                <xl-action-button v-permission="'adminUser:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(1)" />
            </div>
            <div>
                <xl-table-list :loading="loading" :data="adminUserList" :tableTitle="tableTitle" :pagination="pagination">
                    <!-- 渲染表格列的内容 -->
                    <template #td="{ item, val, row }">
                        <el-avatar v-if="item.avatar" :size="50" :src="getImageUrl(String(val))">
                            <el-icon size="32">
                                <i-ep-avatar />
                            </el-icon>
                        </el-avatar>
                        <el-tag v-else-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                            {{ item.tag[val as string | number]?.text || val }}
                        </el-tag>
                        <div v-else-if="item.eye" style="display: flex; align-items: center; gap: 3px">
                            <span>{{ val || '-' }}</span>
                            <el-icon v-show="hasSensitiveValue(row, String(item.prop))" size="small" class="xl-cursor-hover" @click="item.getFullInfo?.(row, item)">
                                <Loading v-if="isFullInfoLoading(row, String(item.prop))" />
                                <i-ant-design-eye-invisible-outlined v-else-if="isFieldRevealed(row, String(item.prop))" />
                                <i-ant-design-eye-outlined v-else />
                            </el-icon>
                        </div>
                        <span v-else>{{ val }}</span>
                    </template>
                    <!-- 操作列 -->
                    <template #operation>
                        <el-table-column width="200" :label="t('common.labels.operation')" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" :maxVisibleButtons="2" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>
        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting" size="40%">
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" :rules="getDynamicRules(formData.id)" :key="currentIndex ?? 0">
                <el-row>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.avatar')" prop="avatar">
                            <FilePicker v-model="formData.avatar" accept="image/*" :max-size="ADMIN_USER_AVATAR_CONFIG.MAX_SIZE" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.nickname')" prop="nickname">
                            <el-input v-model.trim="formData.nickname" :placeholder="t('common.placeholders.inputNickname')"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.username')" prop="username">
                            <el-input v-model.trim="formData.username" :placeholder="t('common.placeholders.inputUsername')" :disabled="isEditMode"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.phone')" prop="phone_number">
                            <el-input v-model.trim="formData.phone_number" :placeholder="t('common.placeholders.inputPhone')" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.email')" prop="email">
                            <el-input v-model.trim="formData.email" :placeholder="t('common.placeholders.inputEmail')"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item prop="dept_ids" :label="t('common.labels.department')">
                            <el-select v-model="formData.dept_ids" :placeholder="t('common.placeholders.selectDepartment')" clearable filterable multiple>
                                <el-option v-for="dept in departmentOptions" :key="dept.value" :label="dept.label" :value="dept.value" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item prop="status" :label="t('common.labels.status')">
                            <el-select v-model="formData.status" :placeholder="t('common.placeholders.selectStatus')" clearable :disabled="isRootAdminEditing">
                                <el-option :label="t('common.status.enabled')" :value="STATUS.ENABLED" />
                                <el-option :label="t('common.status.disabled')" :value="STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.password')" prop="password">
                            <el-input v-model.trim="formData.password" :placeholder="t('common.placeholders.inputPassword')" type="password" show-password></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.confirmPassword')" prop="confirm_password">
                            <el-input v-model.trim="formData.confirm_password" :placeholder="t('common.placeholders.inputConfirmPassword')" type="password" show-password></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
            </el-form>
        </xl-drawer>

        <!-- 绑定角色抽屉 -->
        <xl-drawer v-model="showBindRoleDrawer" :title="t('permission.adminUser.bindRoleTitle')" :formRef="bindRoleFormRef" :onConfirm="bindRoleConfirmSubmit" :isSubmitting="isBindingRole" size="40%">
            <el-skeleton v-if="roleOptionsLoading" animated />
            <el-form v-else ref="bindRoleFormRef" size="default" :model="bindRoleData" label-width="auto">
                <el-form-item :label="t('permission.adminUser.title')">
                    <el-input :value="currentAdminUserName" disabled></el-input>
                </el-form-item>
                <el-form-item :label="t('common.labels.role')" prop="role_ids">
                    <el-transfer
                        v-model="bindRoleData.role_ids"
                        filterable
                        :filter-method="filterRole"
                        :props="{ key: 'id', label: 'name' }"
                        :data="roleOptions"
                        :titles="[t('permission.common.allRoles'), t('permission.common.boundRoles')]"
                    />
                </el-form-item>
            </el-form>
        </xl-drawer>
    </div>
</template>

<script setup lang="ts">
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import FilePicker from '@/components/filePicker/index.vue'
import { getImageUrl } from '@/utils/helper'
import { onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { usePermission } from '@/composables/usePermission'
import { CONFIRM_DIALOG_TITLE, CONFIRM_MESSAGES, RESULT_MESSAGES } from '@/constants/messages'
import { ADMIN_USER_AVATAR_CONFIG, ADMIN_USER_STATUS, isRootAdminUser } from '@/modules/adminUser/model'
import { removeAdminUser } from '@/modules/adminUser/service'
import { useAdminUserList } from '@/modules/adminUser/useAdminUserList'
import { useAdminUserForm } from '@/modules/adminUser/useAdminUserForm'
import { useAdminUserRoleBinding } from '@/modules/adminUser/useAdminUserRoleBinding'
import type { AdminUser } from '@/types/adminUser'
import type { TableColumn } from '@/types/common'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const updateButtonInfo = getButtonInfoFull('adminUser:update')
const bindRoleButtonInfo = getButtonInfoFull('adminUser:bindRole')
const deleteButtonInfo = getButtonInfoFull('adminUser:delete')
const addButtonInfo = getButtonInfoFull('adminUser:add')
const { t } = useI18n()

const STATUS = ADMIN_USER_STATUS

const {
    loading,
    adminUserList,
    departmentOptions,
    queryFormRef,
    queryWhere,
    pagination,
    getList,
    getDepartmentOptions,
    handleSearch,
    createToggleFullInfo,
    isFullInfoLoading,
    fetchAdminUserFullPhone,
    fetchAdminUserFullEmail,
} = useAdminUserList()

const { showDrawer, formDataRef, formTitle, currentIndex, isSubmitting, formData, isEditMode, isRootAdminEditing, getDynamicRules, openEditDrawer, editConfirmSubmit } = useAdminUserForm({ refreshList: getList })

const { showBindRoleDrawer, bindRoleFormRef, isBindingRole, currentAdminUserName, roleOptions, roleOptionsLoading, bindRoleData, filterRole, handleBindRole, bindRoleConfirmSubmit } = useAdminUserRoleBinding({
    refreshList: getList,
})

const actionButtons = computed(() => {
    return [
        {
            permission: 'adminUser:update',
            buttonInfo: updateButtonInfo || undefined,
            showIcon: false,
            showText: true,
            click: (row: AdminUser, index: number) => openEditDrawer(2, row, index),
        },
        {
            permission: 'adminUser:bindRole',
            buttonInfo: bindRoleButtonInfo || undefined,
            showIcon: false,
            showText: true,
            click: (row: AdminUser) => handleBindRole(row),
        },
        {
            permission: 'adminUser:delete',
            buttonInfo: deleteButtonInfo || undefined,
            showIcon: false,
            showText: true,
            click: (row: AdminUser) => handleDelete(row),
            disabled: (row: AdminUser) => isRootAdminUser(row),
            tooltip: (row: AdminUser) => (isRootAdminUser(row) ? t('permission.adminUser.superAdminDeleteForbidden') : ''),
            divided: true,
        },
    ]
})

const handleDelete = async (row: AdminUser) => {
    if (row.id === 1) {
        ElMessage.warning(t('permission.adminUser.rootDeleteForbidden'))
        return
    }

    try {
        await ElMessageBox.confirm(t(CONFIRM_MESSAGES.DELETE_ADMIN_USER), t(CONFIRM_DIALOG_TITLE), {
            type: 'warning',
        })
        await removeAdminUser(row.id)
        ElMessage.success(t(RESULT_MESSAGES.DELETE_SUCCESS))
        getList()
    } catch {
        // 取消或失败
    }
}

const isFieldRevealed = (row: AdminUser, field: string) => {
    const showField = `showFull${field.charAt(0).toUpperCase()}${field.slice(1)}`
    return Boolean((row as Record<string, unknown>)[showField])
}

const hasSensitiveValue = (row: AdminUser, field: string) => {
    const value = (row as Record<string, unknown>)[field]
    return value !== null && value !== undefined && String(value).trim() !== ''
}

onMounted(() => {
    getList()
    getDepartmentOptions()
})

const tableTitle = computed(
    () =>
        [
            { prop: 'id', align: 'center', h_label: t('common.labels.id') },
            { prop: 'avatar', align: 'center', h_label: t('common.labels.avatar'), width: 100, customRow: true, avatar: true },
            { prop: 'nickname', h_label: t('common.labels.nickname'), width: 160, overflow: true },
            {
                prop: 'username',
                h_label: t('common.labels.username'),
                width: 120,
                overflow: true,
                h_tip: t('permission.adminUser.usernameTip'),
                copy: true,
                customRow: true,
            },
            {
                prop: 'phone_number',
                h_label: t('common.labels.phone'),
                minWidth: 160,
                customRow: true,
                eye: true,
                getFullInfo: createToggleFullInfo('phone_number', 'old_phone_number', fetchAdminUserFullPhone),
                formatter: (row: AdminUser) => {
                    if (!row.phone_number) return ''
                    return row.country_code ? `+${row.country_code} ${row.phone_number}` : row.phone_number
                },
            },
            {
                prop: 'email',
                h_label: t('common.labels.email'),
                minWidth: 180,
                customRow: true,
                eye: true,
                getFullInfo: createToggleFullInfo('email', 'old_email', fetchAdminUserFullEmail),
            },
            {
                prop: 'departments',
                h_label: t('common.labels.department'),
                minWidth: 200,
                customRow: true,
                formatter: (row: AdminUser) => {
                    // 格式化部门数组，将部门名称用英文逗号连接
                    if (!row.departments || !Array.isArray(row.departments) || row.departments.length === 0) {
                        return '-'
                    }
                    return row.departments.map((dept) => dept.name).join(', ')
                },
            },
            {
                prop: 'status',
                h_label: t('common.labels.status'),
                align: 'center',
                width: 120,
                customRow: true,
                tag: {
                    [STATUS.ENABLED]: { type: 'success', text: t('common.status.enabled') },
                    [STATUS.DISABLED]: { type: 'danger', text: t('common.status.disabled') },
                },
                h_tip: t('permission.adminUser.statusTip'),
            },
            { prop: 'created_at', align: 'center', h_label: t('common.labels.createdAt'), width: 160 },
            { prop: 'updated_at', align: 'center', h_label: t('common.labels.updatedAt'), width: 160 },
            { prop: 'last_login_at', align: 'center', h_label: t('permission.adminUser.lastLoginAt'), width: 160 },
            { prop: 'last_login_ip', align: 'center', h_label: t('permission.adminUser.lastLoginIp'), width: 150 },
        ] as TableColumn<AdminUser>[]
)
</script>

<style lang="scss" scoped>
.avatar-uploader .avatar {
    width: 98px;
    height: 98px;
    display: block;
}
.avatar-uploader :deep(.el-upload) {
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    &:hover {
        border-color: var(--el-color-primary);
    }
}
.avatar-uploader-icon {
    font-size: 28px;
    color: var(--el-text-color-secondary);
    width: 98px;
    height: 98px;
    text-align: center;
    line-height: 98px;
}
</style>
