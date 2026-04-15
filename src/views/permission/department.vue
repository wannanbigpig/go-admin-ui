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
                <el-button @click="handleToggleExpand">{{ isExpanded ? '全部折叠' : '全部展开' }}</el-button>
                <xl-action-button v-permission="'department:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(EDIT_TYPE.ADD)" />
            </div>
            <div v-loading="loading" element-loading-text="数据全力加载中..." element-loading-custom-class="xl-loading">
                <xl-table-list ref="tableListRef" :data="departmentList" :tableTitle="tableTitle" :pagination="{}" row-key="id" :default-expand-all="true">
                    <!-- 渲染表格列的内容 -->
                    <template #td="{ item, val }">
                        <el-tag v-if="item.tag" :type="item.tag[val]?.type || item.tag['other']?.type">
                            {{ item.tag[val]?.text || val }}
                        </el-tag>
                        <span v-else>{{ val }}</span>
                    </template>
                    <!-- 操作列 -->
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
            <el-form ref="formDataRef" size="default" :model="formData" label-width="auto" :rules="getDynamicRules()" :key="currentIndex">
                <el-row :gutter="20">
                    <el-col :span="24">
                        <el-form-item label="上级部门" prop="pid">
                            <el-select v-model="formData.pid" placeholder="请选择上级部门" :disabled="isParentFixed || isProtectedEditingDepartment" clearable filterable style="width: 100%">
                                <el-option label="顶级部门" :value="0" />
                                <el-option v-for="dept in filteredDepartmentOptions" :key="dept.id" :label="dept.label || dept.name" :value="dept.id" :disabled="dept.level > 4" />
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
                <el-form-item label="部门名称">
                    <el-input :value="currentDepartmentName" disabled></el-input>
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

:deep(.el-select) {
    width: 100%;

    .el-input__inner {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
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

<script setup>
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { onMounted, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
import { DEPARTMENT_EDIT_TYPE, isProtectedDepartment } from '@/modules/department/model'
import { deleteDepartmentItem } from '@/modules/department/service'
import { useDepartmentTreeList } from '@/modules/department/useDepartmentTreeList'
import { useDepartmentForm } from '@/modules/department/useDepartmentForm'
import { useDepartmentRoleBinding } from '@/modules/department/useDepartmentRoleBinding'
const { getButtonInfoFull } = usePermission()
const addChildButtonInfo = getButtonInfoFull('department:addChild')
const addButtonInfo = getButtonInfoFull('department:add')
const updateButtonInfo = getButtonInfoFull('department:update')
const bindRoleButtonInfo = getButtonInfoFull('department:bindRole')
const deleteButtonInfo = getButtonInfoFull('department:delete')

/**
 * 操作按钮配置
 */
const actionButtons = computed(() => {
    return [
        {
            permission: 'department:addChild',
            buttonInfo: addChildButtonInfo,
            showIcon: false,
            click: (row) => handleAddChild(row),
        },
        {
            permission: 'department:update',
            buttonInfo: updateButtonInfo,
            showIcon: false,
            click: (row, index) => openEditDrawer(EDIT_TYPE.EDIT, row, index),
        },
        {
            permission: 'department:bindRole',
            buttonInfo: bindRoleButtonInfo,
            showIcon: false,
            click: (row) => handleBindRole(row),
        },
        {
            permission: 'department:delete',
            buttonInfo: deleteButtonInfo,
            showIcon: false,
            click: (row) => handleDelete(row),
            divided: true,
            disabled: (row) => isProtectedDepartment(row),
            tooltip: (row) => (isProtectedDepartment(row) ? '该系统保留对象不允许删除' : ''),
        },
    ]
})

// ==================== 常量定义 ====================
const EDIT_TYPE = DEPARTMENT_EDIT_TYPE
const tableListRef = ref(null)
const { loading, departmentList, departmentOptions, queryFormRef, queryWhere, isExpanded, getList, handleSearch, handleToggleExpand, getChildrenIds } = useDepartmentTreeList(tableListRef)
const {
    showDrawer,
    formDataRef,
    formTitle,
    currentIndex,
    isSubmitting,
    isParentFixed,
    isProtectedEditingDepartment,
    formData,
    getDynamicRules,
    filteredDepartmentOptions,
    openEditDrawer,
    handleAddChild,
    editConfirmSubmit,
} = useDepartmentForm({ departmentOptions, getChildrenIds, refreshList: getList })
const { showBindRoleDrawer, bindRoleFormRef, isBindingRole, currentDepartmentName, roleOptions, roleOptionsLoading, bindRoleData, filterRole, handleBindRole, bindRoleConfirmSubmit } = useDepartmentRoleBinding({
    refreshList: getList,
})

// ==================== 操作处理 ====================
/**
 * 删除部门
 */
const handleDelete = async (row) => {
    if (isProtectedDepartment(row)) {
        ElMessage.warning('默认部门不允许删除')
        return
    }

    try {
        await ElMessageBox.confirm('确认删除该部门吗?', '温馨提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            beforeClose: async (action, instance, done) => {
                if (action === 'confirm') {
                    instance.confirmButtonLoading = true
                    instance.confirmButtonText = '删除中...'
                    try {
                        await deleteDepartmentItem(row.id)
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

onMounted(() => {
    getList()
})

const tableTitle = [
    {
        prop: 'name',
        h_label: '部门名称',
        width: 200,
        overflow: true,
    },
    {
        prop: 'description',
        h_label: '描述',
        minWidth: 200,
        overflow: true,
    },
    {
        prop: 'level',
        h_label: '层级',
        align: 'center',
        width: 100,
    },
    {
        prop: 'sort',
        h_label: '排序',
        align: 'center',
        width: 100,
    },
    {
        prop: 'user_number',
        h_label: '用户数量',
        align: 'center',
        width: 120,
    },
    {
        prop: 'created_at',
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
]
</script>
