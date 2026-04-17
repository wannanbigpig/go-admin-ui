<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="部门名称" prop="name">
                            <el-input placeholder="请输入部门名称" v-model.trim="queryWhere.name" clearable></el-input>
                        </el-form-item>
                    </el-col>
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <div style="display: flex; align-items: center; margin-bottom: 10px">
                <xl-action-button v-permission="'department:add'" :show-icon="false" type="primary" :button-info="addButtonInfo || {}" @click="openEditDrawer(1, null, null)" />
            </div>
            <div>
                <xl-table-list :loading="loading" ref="tableListRef" :data="departmentList" :tableTitle="tableTitle" :pagination="{ total: 0 }" row-key="id" :default-expand-all="true">
                    <template #td="{ item, val }">
                        <el-tag v-if="item.tag" :type="item.tag[val]?.type || 'info'">
                            {{ item.tag[val]?.text || val }}
                        </el-tag>
                        <span v-else>{{ val }}</span>
                    </template>
                    <template #operation>
                        <el-table-column width="200" label="操作" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" :maxVisibleButtons="3" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>

        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting">
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" :rules="getDynamicRules()" :key="currentIndex ?? 0">
                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-form-item label="上级部门" prop="pid">
                            <el-select v-model="formData.pid" placeholder="请选择上级部门" :disabled="isProtectedEditingDepartment" clearable filterable style="width: 100%">
                                <el-option label="顶级部门" :value="0" />
                                <el-option v-for="dept in filteredParentOptions" :key="dept.id" :label="dept.label || dept.name" :value="dept.id" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="部门名称" prop="name">
                            <el-input v-model.trim="formData.name" placeholder="请输入部门名称"></el-input>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="排序" prop="sort">
                            <el-input-number v-model.number="formData.sort" :min="0" :step="10" placeholder="请输入排序值" controls-position="right" style="width: 100%" :disabled="isProtectedEditingDepartment" />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="部门描述" prop="description">
                    <el-input v-model.trim="formData.description" maxlength="255" placeholder="请输入部门描述" show-word-limit type="textarea" :rows="3" />
                </el-form-item>
            </el-form>
        </xl-drawer>

        <!-- 绑定角色抽屉 -->
        <xl-drawer v-model="showBindRoleDrawer" title="绑定角色" :formRef="bindRoleFormRef" :onConfirm="bindRoleConfirmSubmit" :isSubmitting="isBindingRole">
            <el-skeleton v-if="roleOptionsLoading" animated />
            <el-form v-else ref="bindRoleFormRef" size="default" :model="bindRoleData" label-width="auto">
                <el-form-item label="部门名称">
                    <el-input :value="currentDeptName" disabled></el-input>
                </el-form-item>
                <el-form-item label="角色" prop="role_ids">
                    <el-transfer
                        v-model="bindRoleData.role_ids"
                        filterable
                        :filter-method="filterRole"
                        :props="{ key: 'id', label: 'name' }"
                        :data="roleOptions"
                        :titles="['全部角色', '已绑定角色']"
                        target-order="push"
                        filter-placeholder="角色名称"
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
import { isProtectedDepartment } from '@/modules/department/model'
import { removeDepartment } from '@/modules/department/service'
import { useDepartmentTreeList } from '@/modules/department/useDepartmentTreeList'
import { useDepartmentForm } from '@/modules/department/useDepartmentForm'
import { useDepartmentRoleBinding } from '@/modules/department/useDepartmentRoleBinding'
import type { Department } from '@/types/department'

const { getButtonInfoFull } = usePermission()
const addChildButtonInfo = getButtonInfoFull('department:addChild')
const addButtonInfo = getButtonInfoFull('department:add')
const updateButtonInfo = getButtonInfoFull('department:update')
const bindRoleButtonInfo = getButtonInfoFull('department:bindRole')
const deleteButtonInfo = getButtonInfoFull('department:delete')

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
            buttonInfo: addChildButtonInfo,
            showIcon: false,
            click: (row: Department) => handleAddChild(row),
        },
        {
            permission: 'department:update',
            buttonInfo: updateButtonInfo,
            showIcon: false,
            click: (row: Department, index: number) => openEditDrawer(2, row, index),
        },
        {
            permission: 'department:bindRole',
            buttonInfo: bindRoleButtonInfo,
            showIcon: false,
            click: (row: Department) => handleBindRole(row),
        },
        {
            permission: 'department:delete',
            buttonInfo: deleteButtonInfo,
            showIcon: false,
            click: (row: Department) => handleDelete(row),
            disabled: (row: Department) => isProtectedDepartment(row),
        },
    ]
})

const handleDelete = async (row: Department) => {
    if (isProtectedDepartment(row)) {
        ElMessage.warning('默认部门不允许删除')
        return
    }

    try {
        await ElMessageBox.confirm('确认删除该部门吗?', '温馨提示', {
            type: 'warning',
        })
        await removeDepartment(row.id)
        ElMessage.success('删除成功')
        getList()
    } catch {
        // 取消
    }
}

onMounted(() => {
    getList()
})

const tableTitle: any[] = [
    { prop: 'name', h_label: '部门名称', width: 200, overflow: true },
    { prop: 'description', h_label: '描述', minWidth: 200, overflow: true },
    { prop: 'sort', h_label: '排序', align: 'center', width: 100 },
    { prop: 'created_at', align: 'center', h_label: '创建时间', width: 160 },
]
</script>

<style lang="scss" scoped>
.el-form-item {
    width: 100% !important;
}
</style>
