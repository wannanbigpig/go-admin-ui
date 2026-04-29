<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere" @submit.prevent="handleSearch" @keydown.enter.prevent="handleSearch">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item :label="t('permission.department.name')" prop="name">
                            <el-input :placeholder="t('permission.department.namePlaceholder')" v-model.trim="queryWhere.name" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <div class="xl-table-actions">
                <xl-action-button v-permission="'department:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(1, null, null)" />
            </div>
            <div>
                <xl-table-list :loading="loading" ref="tableListRef" :data="departmentList" :tableTitle="tableTitle" :pagination="{ total: 0 }" row-key="id" :default-expand-all="true">
                    <template #td="{ item, val }">
                        <el-tag v-if="item.tag" :type="item.tag[val as string | number]?.type || 'info'">
                            {{ item.tag[val as string | number]?.text || val }}
                        </el-tag>
                        <span v-else>{{ val }}</span>
                    </template>
                    <template #operation>
                        <el-table-column width="200" :label="t('common.labels.operation')" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" :maxVisibleButtons="3" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>

        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting" size="30%">
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" :rules="getDynamicRules()" :key="currentIndex ?? 0">
                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-form-item :label="t('permission.department.parent')" prop="pid">
                            <el-select v-model="formData.pid" :placeholder="t('permission.department.parentPlaceholder')" :disabled="isProtectedEditingDepartment" clearable filterable style="width: 100%">
                                <el-option :label="t('permission.common.topDepartment')" :value="0" />
                                <el-option v-for="dept in filteredParentOptions" :key="dept.id" :label="(dept as Department & { label?: string }).label || dept.name" :value="dept.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('permission.department.name')" prop="name">
                            <el-input v-model.trim="formData.name" :placeholder="t('permission.department.namePlaceholder')"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item :label="t('common.labels.sort')" prop="sort">
                            <el-input-number
                                v-model.number="formData.sort"
                                :min="0"
                                :step="10"
                                :placeholder="t('permission.department.sortPlaceholder')"
                                controls-position="right"
                                style="width: 100%"
                                :disabled="isProtectedEditingDepartment"
                            />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item :label="t('permission.department.description')" prop="description">
                    <el-input v-model.trim="formData.description" maxlength="255" :placeholder="t('permission.department.descriptionPlaceholder')" show-word-limit type="textarea" :rows="3" />
                </el-form-item>
            </el-form>
        </xl-drawer>

        <!-- 绑定角色抽屉 -->
        <xl-drawer v-model="showBindRoleDrawer" :title="t('permission.department.bindRoleTitle')" :formRef="bindRoleFormRef" :onConfirm="bindRoleConfirmSubmit" :isSubmitting="isBindingRole" size="40%">
            <el-skeleton v-if="roleOptionsLoading" animated />
            <el-form v-else ref="bindRoleFormRef" size="default" :model="bindRoleData" label-width="auto">
                <el-form-item :label="t('permission.department.name')">
                    <el-input :value="currentDeptName" disabled></el-input>
                </el-form-item>
                <el-form-item :label="t('common.labels.role')" prop="role_ids">
                    <el-transfer
                        v-model="bindRoleData.role_ids"
                        filterable
                        :filter-method="filterRole"
                        :props="{ key: 'id', label: 'name' }"
                        :data="roleOptions"
                        :titles="[t('permission.common.allRoles'), t('permission.common.boundRoles')]"
                        target-order="push"
                        :filter-placeholder="t('permission.department.roleFilterPlaceholder')"
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
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { onMounted, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
import { CONFIRM_DIALOG_TITLE, CONFIRM_MESSAGES, RESULT_MESSAGES } from '@/constants/messages'
import { isProtectedDepartment } from '@/modules/department/model'
import { removeDepartment } from '@/modules/department/service'
import { useDepartmentTreeList } from '@/modules/department/useDepartmentTreeList'
import { useDepartmentForm } from '@/modules/department/useDepartmentForm'
import { useDepartmentRoleBinding } from '@/modules/department/useDepartmentRoleBinding'
import type { Department } from '@/types/department'
import type { TableColumn } from '@/types/common'
import { useI18n } from 'vue-i18n'

const { getButtonInfoFull } = usePermission()
const addChildButtonInfo = getButtonInfoFull('department:addChild')
const addButtonInfo = getButtonInfoFull('department:add')
const updateButtonInfo = getButtonInfoFull('department:update')
const bindRoleButtonInfo = getButtonInfoFull('department:bindRole')
const deleteButtonInfo = getButtonInfoFull('department:delete')
const { t } = useI18n()

const tableListRef = ref(null)
const { loading, departmentList, departmentOptions, queryFormRef, queryWhere, getList, handleSearch, getChildrenIds } = useDepartmentTreeList(tableListRef)
const { showDrawer, formDataRef, formTitle, currentIndex, isSubmitting, isProtectedEditingDepartment, formData, getDynamicRules, filteredParentOptions, openEditDrawer, handleAddChild, editConfirmSubmit } =
    useDepartmentForm({ departmentOptions, getChildrenIds, refreshList: getList })
const { showBindRoleDrawer, bindRoleFormRef, isBindingRole, currentDeptName, roleOptions, roleOptionsLoading, bindRoleData, filterRole, handleBindRole, bindRoleConfirmSubmit } = useDepartmentRoleBinding({
    refreshList: getList,
})

const actionButtons = computed(() => {
    return [
        {
            permission: 'department:addChild',
            buttonInfo: addChildButtonInfo || undefined,
            showIcon: false,
            click: (row: Department) => handleAddChild(row),
        },
        {
            permission: 'department:update',
            buttonInfo: updateButtonInfo || undefined,
            showIcon: false,
            click: (row: Department, index: number) => openEditDrawer(2, row, index),
        },
        {
            permission: 'department:bindRole',
            buttonInfo: bindRoleButtonInfo || undefined,
            showIcon: false,
            click: (row: Department) => handleBindRole(row),
        },
        {
            permission: 'department:delete',
            buttonInfo: deleteButtonInfo || undefined,
            showIcon: false,
            click: (row: Department) => handleDelete(row),
            disabled: (row: Department) => isProtectedDepartment(row),
            tooltip: (row: Department) => (isProtectedDepartment(row) ? t('permission.department.systemReservedDeleteForbidden') : ''),
            divided: true,
        },
    ]
})

const handleDelete = async (row: Department) => {
    if (isProtectedDepartment(row)) {
        ElMessage.warning(t('permission.department.defaultDeleteForbidden'))
        return
    }

    try {
        await ElMessageBox.confirm(t(CONFIRM_MESSAGES.DELETE_DEPARTMENT), t(CONFIRM_DIALOG_TITLE), {
            type: 'warning',
        })
        await removeDepartment(row.id)
        ElMessage.success(t(RESULT_MESSAGES.DELETE_SUCCESS))
        getList()
    } catch {
        // 取消
    }
}

onMounted(() => {
    getList()
})

const tableTitle = computed(
    () =>
        [
            { prop: 'name', h_label: t('permission.department.name'), width: 200, overflow: true },
            { prop: 'description', h_label: t('common.labels.description'), minWidth: 200, overflow: true },
            { prop: 'sort', h_label: t('common.labels.sort'), align: 'center', width: 100 },
            { prop: 'created_at', align: 'center', h_label: t('common.labels.createdAt'), width: 160 },
        ] as TableColumn<Department>[]
)
</script>

<style lang="scss" scoped>
.el-form-item {
    width: 100% !important;
}
</style>
