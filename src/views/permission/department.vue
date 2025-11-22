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
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" />
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
                            <el-select v-model="formData.pid" placeholder="请选择上级部门" :disabled="isParentFixed" clearable filterable style="width: 100%">
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
                            <el-input-number v-model.number="formData.sort" :min="0" :step="10" placeholder="请输入排序值" controls-position="right" style="width: 100%" />
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
import { getDepartmentList, createDepartment, updateDepartment, deleteDepartment, getDepartmentDetail, bindDepartmentRole } from '@/api/department'
import { getRoleList } from '@/api/permission'
import { filterNullUndefined } from '@/utils/helper'
import { onMounted, reactive, ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
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
        },
    ]
})

// ==================== 常量定义 ====================
const EDIT_TYPE = {
    ADD: 1,
    EDIT: 2,
}

const SUBMIT_DELAY = 3000

// ==================== 表单相关 ====================
const showDrawer = ref(false)
const formDataRef = ref()
const formTitle = ref('')
const currentIndex = ref(null)
const isSubmitting = ref(false)

// 表单初始数据
const initialFormData = {
    id: 0,
    name: '',
    sort: 100,
    pid: 0,
    description: '',
}

const formData = reactive({ ...initialFormData })
const originalFormData = ref(null)

// 判断是否为编辑模式
const isEditMode = computed(() => !!originalFormData.value)

// 判断上级部门是否固定（新增子部门时固定）
const isParentFixed = ref(false)

// 表单验证规则
const getDynamicRules = () => {
    const trigger = ['blur', 'change']

    return {
        name: [{ required: true, message: '部门名称不能为空', trigger }],
        sort: [{ required: true, message: '排序不能为空', trigger, type: 'number' }],
    }
}

// ==================== 数据提交相关 ====================
/**
 * 获取提交的字段数据（新增和编辑都提交所有字段）
 */
const getSubmitData = () => {
    return {
        id: formData.id || 0,
        name: formData.name,
        sort: formData.sort,
        pid: formData.pid ?? 0,
        description: formData.description || '',
    }
}

// ==================== 表单提交 ====================
/**
 * 提交表单
 */
const editConfirmSubmit = async () => {
    if (isSubmitting.value) return

    isSubmitting.value = true

    try {
        const valid = await formDataRef.value.validate().catch(() => false)
        if (!valid) {
            isSubmitting.value = false
            return
        }

        const submitData = getSubmitData()

        // 根据编辑模式调用不同的接口
        if (isEditMode.value) {
            await updateDepartment(submitData)
        } else {
            await createDepartment(submitData)
        }

        getList()
        showDrawer.value = false
        ElMessage.success(isEditMode.value ? '编辑成功' : '新增成功')
    } catch (error) {
        console.error('提交失败:', error)
    } finally {
        // 延迟重置提交状态，防止重复提交
        setTimeout(() => {
            isSubmitting.value = false
        }, SUBMIT_DELAY)
    }
}

// ==================== 操作处理 ====================
/**
 * 删除部门
 */
const handleDelete = async (row) => {
    try {
        await ElMessageBox.confirm('确认删除该部门吗?', '温馨提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            beforeClose: async (action, instance, done) => {
                if (action === 'confirm') {
                    instance.confirmButtonLoading = true
                    instance.confirmButtonText = '删除中...'
                    try {
                        await deleteDepartment({ id: row.id })
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

// ==================== 绑定角色相关 ====================
const showBindRoleDrawer = ref(false)
const bindRoleFormRef = ref()
const isBindingRole = ref(false)
const currentDepartmentName = ref('')
const bindRoleData = reactive({
    id: 0,
    role_ids: [],
})

/**
 * 角色过滤方法
 */
const filterRole = (query, item) => {
    return item.name.toLowerCase().includes(query.toLowerCase())
}

/**
 * 打开绑定角色抽屉
 */
const handleBindRole = async (row) => {
    if (!row || typeof row.id !== 'number') {
        ElMessage.error('无效的行数据')
        return
    }

    currentDepartmentName.value = row.name || ''
    bindRoleData.id = row.id
    bindRoleData.role_ids = []

    // 先打开抽屉，不阻塞
    showBindRoleDrawer.value = true

    // 如果角色列表未加载，则异步加载（不阻塞抽屉打开）
    if (!roleOptionsLoaded.value) {
        roleOptionsLoading.value = true
        getRoleOptions()
            .then(() => {
                roleOptionsLoaded.value = true
            })
            .catch((error) => {
                console.error('获取角色列表失败:', error)
                ElMessage.error('获取角色列表失败')
            })
            .finally(() => {
                roleOptionsLoading.value = false
            })
    }

    // 获取部门详情，查看已绑定的角色
    try {
        const res = await getDepartmentDetail({ id: row.id })
        const deptData = res.data?.data || res.data
        if (deptData && Array.isArray(deptData.role_list)) {
            // 使用 role_list 字段回显
            bindRoleData.role_ids = deptData.role_list
        } else if (deptData && Array.isArray(deptData.role_ids)) {
            // 兼容 role_ids 字段
            bindRoleData.role_ids = deptData.role_ids
        } else if (deptData && Array.isArray(deptData.roles)) {
            // 如果返回的是角色对象数组，提取ID
            bindRoleData.role_ids = deptData.roles.map((role) => role.id)
        }
    } catch (error) {
        console.error('获取部门详情失败:', error)
        // 即使获取失败也继续显示绑定角色抽屉
    }
}

/**
 * 提交绑定角色
 */
const bindRoleConfirmSubmit = async () => {
    if (isBindingRole.value) return

    isBindingRole.value = true

    try {
        const submitData = {
            id: bindRoleData.id,
            role_ids: Array.isArray(bindRoleData.role_ids) ? bindRoleData.role_ids : [],
        }

        await bindDepartmentRole(submitData)
        ElMessage.success('绑定角色成功')
        showBindRoleDrawer.value = false
        getList() // 刷新列表
    } catch (error) {
        console.error('绑定角色失败:', error)
    } finally {
        setTimeout(() => {
            isBindingRole.value = false
        }, SUBMIT_DELAY)
    }
}

/**
 * 重置表单数据
 */
const resetFormData = () => {
    Object.assign(formData, { ...initialFormData })
    isParentFixed.value = false
    if (formDataRef.value) {
        formDataRef.value.clearValidate()
    }
}

/**
 * 保存原始数据（深拷贝）
 */
const saveOriginalData = () => {
    originalFormData.value = JSON.parse(
        JSON.stringify({
            id: formData.id,
            name: formData.name,
            sort: formData.sort,
            pid: formData.pid,
            description: formData.description,
        })
    )
}

/**
 * 获取部门的所有子部门ID（包括自己）
 */
const getChildrenIds = (deptId) => {
    // 使用已扁平化的部门选项列表
    const flatList = departmentOptions.value

    const result = [deptId]
    const findChildren = (pid) => {
        flatList.forEach((dept) => {
            if (dept.pid === pid) {
                result.push(dept.id)
                findChildren(dept.id)
            }
        })
    }
    findChildren(deptId)
    return result
}

/**
 * 过滤部门选项（编辑时排除自己和自己的子部门）
 */
const filteredDepartmentOptions = computed(() => {
    if (!isEditMode.value || !formData.id) {
        return departmentOptions.value
    }

    // 获取当前部门及其所有子部门的ID
    const excludeIds = getChildrenIds(formData.id)
    return departmentOptions.value.filter((dept) => !excludeIds.includes(dept.id))
})

/**
 * 新增子部门
 */
const handleAddChild = (parentRow) => {
    if (!parentRow || typeof parentRow.id !== 'number') {
        ElMessage.error('无效的行数据')
        return
    }
    openEditDrawer(EDIT_TYPE.ADD, null, 0, parentRow.id)
}

/**
 * 打开编辑/新增抽屉
 */
const openEditDrawer = async (type, row, index, fixedParentId = null) => {
    // 参数校验
    if (typeof type !== 'number' || ![EDIT_TYPE.ADD, EDIT_TYPE.EDIT].includes(type)) {
        return
    }

    if (type === EDIT_TYPE.EDIT) {
        if (!row || typeof row.id !== 'number') {
            ElMessage.error('无效的行数据')
            return
        }

        formTitle.value = '编辑部门'
        currentIndex.value = index
        resetFormData()

        // 直接使用列表数据，不需要调用详情接口
        Object.assign(formData, {
            id: row.id,
            name: row.name || '',
            sort: row.sort ?? 100,
            pid: row.pid ?? 0,
            description: row.description || '',
        })

        saveOriginalData()
    } else {
        // 新增模式
        formTitle.value = '新增部门'
        resetFormData()
        originalFormData.value = null

        // 如果指定了父部门ID，固定上级部门字段
        if (fixedParentId !== null) {
            formData.pid = fixedParentId
            isParentFixed.value = true
        } else {
            isParentFixed.value = false
        }
    }

    currentIndex.value = index
    showDrawer.value = true
}

// ==================== 搜索相关 ====================
const queryFormRef = ref(null)
const queryWhere = reactive({
    name: null,
})

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

// ==================== 列表相关 ====================
const loading = ref(false)
const departmentList = ref([])
const departmentOptions = ref([])
const roleOptions = ref([])
const roleOptionsLoading = ref(false) // 角色列表加载状态
const roleOptionsLoaded = ref(false) // 标记角色数据是否已加载
const tableListRef = ref(null)
const isExpanded = ref(true) // 默认展开

/**
 * 扁平化部门树（用于上级部门选择）
 */
const flattenDepartmentTree = (tree, prefix = '') => {
    const flatList = []
    tree.forEach((dept) => {
        const label = prefix ? `${prefix} / ${dept.name}` : dept.name
        flatList.push({
            ...dept,
            label,
        })
        if (dept.children && dept.children.length > 0) {
            flatList.push(...flattenDepartmentTree(dept.children, label))
        }
    })
    return flatList
}

/**
 * 获取部门列表
 */
const getList = async () => {
    loading.value = true

    try {
        // 过滤空字符串，接口自动返回全部数据，不需要传 page 和 per_page
        const filteredParams = {
            ...queryWhere,
            name: queryWhere.name?.trim() || undefined,
        }

        const res = await getDepartmentList(filterNullUndefined(filteredParams))
        // 部门列表接口返回的是树形结构，直接是数组，没有分页信息
        const deptData = res.data?.data || res.data

        if (Array.isArray(deptData)) {
            departmentList.value = deptData
            // 同时更新部门选项（用于上级部门选择）
            departmentOptions.value = flattenDepartmentTree(deptData)
        } else {
            departmentList.value = []
            departmentOptions.value = []
        }
    } catch (error) {
        console.error('获取部门列表失败:', error)
        departmentList.value = []
        departmentOptions.value = []
    } finally {
        loading.value = false
    }
}

/**
 * 获取角色列表（用于绑定角色选择）
 */
const getRoleOptions = async () => {
    const res = await getRoleList({ page: 1, per_page: 9999 })
    // 处理返回结构：res.data.data 或 res.data
    const roleData = res.data?.data || res.data
    if (Array.isArray(roleData)) {
        roleOptions.value = roleData
    }
    return roleData
}

// ==================== 生命周期 ====================
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
