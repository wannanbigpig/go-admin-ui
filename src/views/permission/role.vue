<template>
    <div>
        <div class="xl-container xl-m-bottom-10">
            <el-form class="xl-search-form xl-m-top-18" ref="queryFormRef" size="default" :model="queryWhere">
                <el-row id="searchForm" :gutter="20">
                    <el-col :span="4">
                        <el-form-item label="角色名称" prop="name">
                            <el-input placeholder="请输入角色名称" v-model.trim="queryWhere.name" clearable></el-input>
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
                    <xl-collapsible-search-btn :loading="loading" :maxShow="3" :onSearch="handleSearch" :modelRef="queryFormRef" nodeName="#searchForm > .el-col" />
                </el-row>
            </el-form>
        </div>

        <div class="xl-container">
            <div style="display: flex; align-items: center; margin-bottom: 10px">
                <xl-action-button v-permission="'role:add'" :show-icon="false" type="primary" :button-info="addButtonInfo" @click="openEditDrawer(EDIT_TYPE.ADD)" />
            </div>
            <div v-loading="loading" element-loading-text="数据全力加载中..." element-loading-custom-class="xl-loading">
                <xl-table-list ref="tableListRef" :data="roleList" :tableTitle="tableTitle" :pagination="pagination" :lazy="true" :load="loadChildren" :tree-props="treeProps" row-key="id">
                    <!-- 渲染表格列的内容 -->
                    <template #td="{ item, val }">
                        <el-tag v-if="item.tag" :type="item.tag[val]?.type || item.tag['other']?.type">
                            {{ item.tag[val]?.text || val }}
                        </el-tag>
                        <span v-else>{{ val }}</span>
                    </template>
                    <!-- 操作列 -->
                    <template #operation>
                        <el-table-column width="180" label="操作" align="center" fixed="right">
                            <template #default="scope">
                                <xl-action-buttons :buttons="actionButtons(scope)" :scope="scope" :maxVisibleButtons="3" />
                            </template>
                        </el-table-column>
                    </template>
                </xl-table-list>
            </div>
        </div>

        <!-- 编辑抽屉 -->
        <xl-drawer v-model="showDrawer" :title="formTitle" :formRef="formDataRef" :onConfirm="editConfirmSubmit" :isSubmitting="isSubmitting">
            <!-- 骨架屏 -->
            <el-skeleton v-if="menuTreeLoading" animated>
                <template #template>
                    <el-form size="default" label-width="auto">
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item>
                                    <template #label>
                                        <el-skeleton-item variant="text" style="width: 80px" />
                                    </template>
                                    <el-skeleton-item variant="rect" style="width: 100%; height: 32px" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item>
                                    <template #label>
                                        <el-skeleton-item variant="text" style="width: 80px" />
                                    </template>
                                    <el-skeleton-item variant="rect" style="width: 100%; height: 32px" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-row :gutter="20">
                            <el-col :span="12">
                                <el-form-item>
                                    <template #label>
                                        <el-skeleton-item variant="text" style="width: 60px" />
                                    </template>
                                    <el-skeleton-item variant="rect" style="width: 100%; height: 32px" />
                                </el-form-item>
                            </el-col>
                            <el-col :span="12">
                                <el-form-item>
                                    <template #label>
                                        <el-skeleton-item variant="text" style="width: 60px" />
                                    </template>
                                    <el-skeleton-item variant="rect" style="width: 100%; height: 32px" />
                                </el-form-item>
                            </el-col>
                        </el-row>
                        <el-form-item>
                            <template #label>
                                <el-skeleton-item variant="text" style="width: 80px" />
                            </template>
                            <el-skeleton-item variant="rect" style="width: 100%; height: 76px" />
                        </el-form-item>
                        <el-form-item>
                            <template #label>
                                <el-skeleton-item variant="text" style="width: 80px" />
                            </template>
                            <el-skeleton-item variant="rect" style="width: 100%; height: 200px" />
                        </el-form-item>
                    </el-form>
                </template>
            </el-skeleton>
            <!-- 表单内容 -->
            <el-form v-else ref="formDataRef" size="default" :model="formData" label-width="auto" :rules="getDynamicRules()" :key="currentIndex">
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="角色名称" prop="name">
                            <el-input v-model.trim="formData.name" placeholder="请输入角色名称"></el-input>
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item label="上级角色" prop="pid">
                            <el-input :value="formData.pid === 0 || formData.pid === null ? '顶级角色' : getParentRoleName(formData.pid)" disabled />
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-row :gutter="20">
                    <el-col :span="12">
                        <el-form-item label="排序" prop="sort">
                            <el-input-number v-model.number="formData.sort" :min="0" :step="10" placeholder="请输入排序值" controls-position="right" style="width: 100%" />
                        </el-form-item>
                    </el-col>
                    <el-col :span="12">
                        <el-form-item prop="status" label="状态">
                            <el-select v-model="formData.status" placeholder="请选择状态" clearable>
                                <el-option label="正常" :value="STATUS.NORMAL" />
                                <el-option label="禁用" :value="STATUS.DISABLED" />
                            </el-select>
                        </el-form-item>
                    </el-col>
                </el-row>
                <el-form-item label="角色描述" prop="description">
                    <el-input v-model.trim="formData.description" maxlength="255" placeholder="请输入角色描述" show-word-limit type="textarea" :rows="3" />
                </el-form-item>
                <el-form-item label="菜单权限" prop="menu_list">
                    <el-tree
                        ref="menuTreeRef"
                        :data="menuTreeData"
                        :props="{ label: 'title', children: 'children', disabled: 'disabled' }"
                        show-checkbox
                        node-key="id"
                        :default-checked-keys="formData.menu_list"
                        @check="handleMenuCheck"
                        class="menu-permission-tree"
                    >
                        <template #default="{ node, data }">
                            <span class="tree-node-label">
                                <span>{{ node.label }}</span>
                                <span v-if="data.disabled" class="disabled-tag">（已拥有）</span>
                            </span>
                        </template>
                    </el-tree>
                </el-form-item>
            </el-form>
        </xl-drawer>
    </div>
</template>

<style lang="scss" scoped>
.menu-permission-tree {
    width: 100%;
    padding: 12px;
    border: 1px solid var(--el-border-color-light);
    border-radius: 4px;

    .tree-node-label {
        display: inline-flex;
        align-items: center;
        gap: 4px;
    }

    .disabled-tag {
        color: #f56c6c;
        font-size: 12px;
        font-weight: normal;
    }
}
</style>

<script setup>
import xlCollapsibleSearchBtn from '@/components/collapsibleSearchBtn/index.vue'
import xlTableList from '@/components/tableList/index.vue'
import xlDrawer from '@/components/drawer/index.vue'
import xlActionButtons from '@/components/actionButtons/index.vue'
import xlActionButton from '@/components/actionButton/index.vue'
import { getRoleList, createRole, updateRole, deleteRole, getRoleDetail, getMenuList } from '@/api/permission'
import { filterNullUndefined } from '@/utils/helper'
import { onMounted, reactive, ref, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
const { getButtonInfoFull } = usePermission()
const addChildButtonInfo = getButtonInfoFull('role:addChild')
const addButtonInfo = getButtonInfoFull('role:add')
const updateButtonInfo = getButtonInfoFull('role:update')
const deleteButtonInfo = getButtonInfoFull('role:delete')

// ==================== 常量定义 ====================
const STATUS = {
    NORMAL: 1,
    DISABLED: 0,
}

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
const menuTreeRef = ref()

// 表单初始数据
const initialFormData = {
    id: 0,
    name: '',
    sort: 100,
    pid: 0,
    description: '',
    menu_list: [],
    status: STATUS.NORMAL,
}

const formData = reactive({ ...initialFormData })
const originalFormData = ref(null)

// 判断是否为编辑模式
const isEditMode = computed(() => !!originalFormData.value)

// 表单验证规则
const getDynamicRules = () => {
    const trigger = ['blur', 'change']

    return {
        name: [{ required: true, message: '角色名称不能为空', trigger }],
        sort: [{ required: true, message: '排序不能为空', trigger, type: 'number' }],
        status: [{ required: true, message: '状态不能为空', trigger }],
    }
}

// ==================== 表格引用 ====================
const tableListRef = ref(null)

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
        menu_list: Array.isArray(formData.menu_list) ? formData.menu_list : [],
        status: formData.status ?? STATUS.NORMAL,
    }
}

/**
 * 更新表格树节点的子节点数据（参考 test.vue 的实现）
 * @param {number} parentId - 父节点ID
 * @param {Array} nodes - 子节点数组
 */
const updateTableTree = (parentId, nodes) => {
    if (!tableListRef.value?.tableRef) return

    const tableRef = tableListRef.value.tableRef
    const store = tableRef.store

    if (store?.states?.lazyTreeNodeMap?.value) {
        // 直接更新 lazyTreeNodeMap，Vue 3 会自动处理响应式
        // 参考 test.vue: this.$set(this.$refs.cimsDictTable.store.states.lazyTreeNodeMap, parentId, nodes)
        store.states.lazyTreeNodeMap.value[parentId] = nodes
    }
}

/**
 * 刷新指定父节点的子节点数据
 * @param {number} parentId - 父节点ID，如果为0或null则刷新顶级节点
 */
const refreshParentNodeChildren = async (parentId) => {
    // 如果父节点ID为0或null，刷新整个列表
    if (!parentId || parentId === 0) {
        getList()
        return
    }

    try {
        // 重新获取该父节点的子节点数据
        const res = await getRoleList({
            pid: parentId,
            page: 1,
            per_page: 9999, // 获取所有子节点
        })

        const { data } = res.data
        const children = Array.isArray(data) ? data : []

        // 处理数据，添加 hasChildren 属性
        const processedChildren = processRoleData(children)

        // 更新表格树节点的子节点数据
        updateTableTree(parentId, processedChildren)

        // 同时更新父节点的 hasChildren 状态
        const findParentNode = (nodes, targetId) => {
            for (const node of nodes) {
                if (node.id === targetId) {
                    return node
                }
                if (node.children && node.children.length > 0) {
                    const found = findParentNode(node.children, targetId)
                    if (found) return found
                }
            }
            return null
        }

        const parentNode = findParentNode(roleList.value, parentId)
        if (parentNode) {
            parentNode.children_num = processedChildren.length
            parentNode.hasChildren = processedChildren.length > 0
        }
    } catch (error) {
        console.error('刷新父节点子节点失败:', error)
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
        const parentId = submitData.pid || 0

        // 根据编辑模式调用不同的接口
        if (isEditMode.value) {
            await updateRole(submitData)
        } else {
            await createRole(submitData)
        }

        // 如果是新增，刷新父节点的子节点；如果是编辑，刷新父节点和当前节点的父节点
        if (isEditMode.value) {
            // 编辑模式：刷新当前节点的父节点和原父节点（如果pid改变了）
            const originalParentId = originalFormData.value?.pid || 0

            if (originalParentId !== parentId) {
                // 如果父节点改变了，需要刷新两个父节点
                await refreshParentNodeChildren(originalParentId)
                await refreshParentNodeChildren(parentId)
            } else {
                // 父节点未改变，只刷新当前父节点
                await refreshParentNodeChildren(parentId)
            }

            // 如果编辑的是顶级节点，也需要刷新列表
            if (parentId === 0) {
                getList()
            }
        } else {
            // 新增模式：刷新父节点的子节点
            await refreshParentNodeChildren(parentId)
            // 如果新增的是顶级节点，也需要刷新列表
            if (parentId === 0) {
                getList()
            }
        }

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
 * 添加子级角色
 */
const handleAddChild = (row) => {
    openEditDrawer(EDIT_TYPE.ADD, null, null, row.id)
}

/**
 * 操作按钮配置
 */
const actionButtons = (scope) => {
    const buttons = []
    const row = scope.row || scope

    // 只有顶级角色（pid === 0）才显示"新增子角色"按钮
    if (row.pid === 0 || row.pid === null) {
        buttons.push({
            permission: 'role:addChild',
            buttonInfo: addChildButtonInfo,
            showIcon: false,
            click: (row) => handleAddChild(row),
        })
    }

    buttons.push(
        {
            permission: 'role:update',
            buttonInfo: updateButtonInfo,
            showIcon: false,
            click: (row, index) => openEditDrawer(EDIT_TYPE.EDIT, row, index),
        },
        {
            permission: 'role:delete',
            buttonInfo: deleteButtonInfo,
            showIcon: false,
            click: (row) => handleDelete(row),
            divided: true,
        }
    )

    return buttons
}

/**
 * 删除角色
 */
const handleDelete = async (row) => {
    try {
        await ElMessageBox.confirm('确认删除该角色吗?', '温馨提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            beforeClose: async (action, instance, done) => {
                if (action === 'confirm') {
                    instance.confirmButtonLoading = true
                    instance.confirmButtonText = '删除中...'
                    try {
                        const parentId = row.pid || 0
                        await deleteRole({ id: row.id })
                        ElMessage.success('删除成功')

                        // 刷新父节点的子节点数据
                        await refreshParentNodeChildren(parentId)
                        // 如果删除的是顶级节点，也需要刷新列表
                        if (parentId === 0) {
                            getList()
                        }

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

/**
 * 重置表单数据
 */
const resetFormData = () => {
    Object.assign(formData, { ...initialFormData })
    parentRoleMenuList.value = [] // 重置父角色权限列表
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
            menu_list: [...formData.menu_list],
            status: formData.status,
        })
    )
}

/**
 * 更新菜单树的禁用状态（下级角色不能选择上级角色已有的权限）
 * @param {Array} menuData - 菜单数据
 */
const updateMenuTreeDisabled = (menuData) => {
    if (!Array.isArray(menuData)) return

    // 如果是顶级角色（pid === 0），不禁用任何节点
    if (formData.pid === 0 || formData.pid === null) {
        // 清除所有禁用状态
        const clearDisabled = (items) => {
            items.forEach((item) => {
                item.disabled = false
                if (item.children && item.children.length > 0) {
                    clearDisabled(item.children)
                }
            })
        }
        clearDisabled(menuData)
        return
    }

    // 如果是子角色，检查该权限是否在父角色的权限列表中
    // 如果父角色已有该权限，则禁用（置灰不可选）
    const setDisabled = (items) => {
        items.forEach((item) => {
            // 如果该菜单ID在父角色的权限列表中，则禁用
            item.disabled = parentRoleMenuList.value.includes(item.id)

            if (item.children && item.children.length > 0) {
                setDisabled(item.children)
            }
        })
    }
    setDisabled(menuData)
}

/**
 * 菜单树选择处理
 */
const handleMenuCheck = (data, checked) => {
    // checked 对象包含 checkedKeys（已选中的节点）和 halfCheckedKeys（半选中的节点）
    const checkedKeys = checked.checkedKeys || []
    formData.menu_list = checkedKeys
}

/**
 * 设置菜单树选中状态
 */
const setMenuTreeChecked = async () => {
    await nextTick()
    if (menuTreeRef.value && menuTreeData.value.length > 0) {
        if (isEditMode.value && formData.menu_list.length > 0) {
            // 编辑模式：设置已选中的菜单
            menuTreeRef.value.setCheckedKeys([], false)
            menuTreeRef.value.setCheckedKeys(formData.menu_list, false)
        } else if (!isEditMode.value) {
            // 新增模式：清空选中状态
            menuTreeRef.value.setCheckedKeys([])
        }
    }
}

/**
 * 获取父级角色名称
 */
const getParentRoleName = (pid) => {
    if (pid === 0 || pid === null) {
        return '顶级角色'
    }
    // 从当前列表查找父级角色
    const parentRole = roleList.value.find((role) => role.id === pid)
    return parentRole ? parentRole.name : '未知角色'
}

/**
 * 获取父角色的权限列表
 * @param {number} parentId - 父角色ID
 */
const getParentRoleMenuList = async (parentId) => {
    if (!parentId || parentId === 0) {
        parentRoleMenuList.value = []
        // 如果菜单数据已加载，更新禁用状态
        if (menuTreeDataLoaded.value && menuTreeData.value.length > 0) {
            updateMenuTreeDisabled(menuTreeData.value)
        }
        return
    }

    try {
        const res = await getRoleDetail({ id: parentId })
        const roleData = res.data?.data || res.data
        parentRoleMenuList.value = Array.isArray(roleData.menu_list) ? roleData.menu_list : []

        // 如果菜单数据已加载，更新禁用状态
        if (menuTreeDataLoaded.value && menuTreeData.value.length > 0) {
            updateMenuTreeDisabled(menuTreeData.value)
        }
    } catch (error) {
        console.error('获取父角色权限失败:', error)
        parentRoleMenuList.value = []
        // 如果菜单数据已加载，更新禁用状态
        if (menuTreeDataLoaded.value && menuTreeData.value.length > 0) {
            updateMenuTreeDisabled(menuTreeData.value)
        }
    }
}

/**
 * 打开编辑/新增抽屉
 */
const openEditDrawer = async (type, row, index, parentId = null) => {
    // 参数校验
    if (typeof type !== 'number' || ![EDIT_TYPE.ADD, EDIT_TYPE.EDIT].includes(type)) {
        return
    }

    // 先打开抽屉，不阻塞
    if (type === EDIT_TYPE.EDIT) {
        if (!row || typeof row.id !== 'number') {
            ElMessage.error('无效的行数据')
            return
        }

        formTitle.value = '编辑角色'
        currentIndex.value = index
        resetFormData()

        try {
            // 获取角色详情（列表数据中没有 menu_list，需要调用详情接口）
            const res = await getRoleDetail({ id: row.id })
            // 处理返回结构：res.data 可能是对象或包含 data 字段
            const roleData = res.data?.data || res.data

            // 设置表单数据
            Object.assign(formData, {
                id: roleData.id,
                name: roleData.name || '',
                sort: roleData.sort ?? 100,
                pid: roleData.pid ?? 0,
                description: roleData.description || '',
                menu_list: Array.isArray(roleData.menu_list) ? roleData.menu_list : [],
                status: roleData.status ?? STATUS.NORMAL,
            })

            saveOriginalData()

            // 如果是子角色，获取父角色的权限列表
            if (formData.pid && formData.pid !== 0) {
                await getParentRoleMenuList(formData.pid)
            } else {
                parentRoleMenuList.value = []
            }

            // 如果菜单数据已加载，设置树形控件的选中状态
            if (menuTreeDataLoaded.value) {
                await setMenuTreeChecked()
            }
        } catch (error) {
            console.error('获取角色详情失败:', error)
            return
        }
    } else {
        // 新增模式
        formTitle.value = parentId ? '创建下级角色' : '新增角色'
        resetFormData()
        originalFormData.value = null

        // 如果传入了父级ID，设置为父级角色，否则设置为顶级角色
        formData.pid = parentId !== null ? parentId : 0

        // 如果是新增子角色，自动在名称输入框中填入父级角色名称+'-'
        if (parentId !== null && parentId !== 0) {
            const parentRoleName = getParentRoleName(parentId)
            if (parentRoleName && parentRoleName !== '未知角色') {
                formData.name = `${parentRoleName}-`
            }

            // 获取父角色的权限列表
            await getParentRoleMenuList(parentId)
        } else {
            parentRoleMenuList.value = []
        }

        // 如果菜单数据已加载，重置树形控件
        if (menuTreeDataLoaded.value) {
            await setMenuTreeChecked()
        }
    }

    currentIndex.value = index
    showDrawer.value = true

    // 如果菜单数据未加载，则异步加载（不阻塞抽屉打开）
    if (!menuTreeDataLoaded.value) {
        menuTreeLoading.value = true
        getMenuTreeData()
            .then(() => {
                menuTreeDataLoaded.value = true
                // 菜单数据加载完成后，设置树形控件的选中状态
                setMenuTreeChecked()
            })
            .catch((error) => {
                console.error('获取菜单列表失败:', error)
                ElMessage.error('获取菜单列表失败')
            })
            .finally(() => {
                menuTreeLoading.value = false
            })
    } else {
        // 如果菜单数据已加载，更新禁用状态
        updateMenuTreeDisabled(menuTreeData.value)
    }
}

// ==================== 搜索相关 ====================
const queryFormRef = ref(null)
const queryWhere = reactive({
    page: 1,
    per_page: 10,
    name: null,
    status: null,
    pid: 0, // 默认查询顶级角色
})

/**
 * 搜索
 */
const handleSearch = () => {
    queryWhere.page = 1 // 搜索时重置到第一页
    getList()
}

// ==================== 列表相关 ====================
const loading = ref(false)
const roleList = ref([])
const menuTreeData = ref([])
const menuTreeDataLoaded = ref(false) // 标记菜单数据是否已加载
const menuTreeLoading = ref(false) // 菜单树加载状态
const parentRoleMenuList = ref([]) // 父角色的权限列表（用于禁用下级角色不能选择的权限）

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

// 树形表格配置
const treeProps = {
    children: 'children',
    hasChildren: 'hasChildren', // 使用 hasChildren 来判断是否有子节点
}

/**
 * 获取菜单树数据
 */
const getMenuTreeData = async () => {
    const res = await getMenuList({ status: STATUS.NORMAL })
    // 处理返回结构：res.data.data 或 res.data
    const menuData = res.data?.data || res.data
    if (Array.isArray(menuData)) {
        // 深拷贝数据，避免修改原始数据
        const clonedData = JSON.parse(JSON.stringify(menuData))
        // 更新菜单树的禁用状态
        updateMenuTreeDisabled(clonedData)
        menuTreeData.value = clonedData
    }
    return menuData
}

/**
 * 处理角色数据，添加 hasChildren 属性
 */
const processRoleData = (data) => {
    if (!Array.isArray(data)) return []
    return data.map((item) => ({
        ...item,
        hasChildren: (item.children_num || 0) > 0, // 根据 children_num 判断是否有子节点
    }))
}

/**
 * 加载子节点数据（懒加载）
 */
const loadChildren = async (tree, treeNode, resolve) => {
    try {
        const parentId = tree.id
        if (!parentId) {
            resolve([])
            return
        }

        // 获取子节点列表
        const res = await getRoleList({
            pid: parentId,
            page: 1,
            per_page: 9999, // 获取所有子节点
        })

        // 处理返回结构：res.data.data 或 res.data
        const { data } = res.data
        const children = Array.isArray(data) ? data : []

        // 处理数据，添加 hasChildren 属性
        const processedChildren = processRoleData(children)

        // 返回子节点数据
        resolve(processedChildren)
    } catch (error) {
        console.error('加载子节点失败:', error)
        ElMessage.error('加载子节点失败')
        resolve([])
    }
}

/**
 * 获取角色列表
 */
const getList = async () => {
    loading.value = true

    try {
        // 过滤空字符串
        const filteredParams = {
            ...queryWhere,
            name: queryWhere.name?.trim() || undefined,
            pid: queryWhere.pid ?? 0, // 确保 pid 有默认值
        }

        const res = await getRoleList(filterNullUndefined(filteredParams))
        // 处理返回结构：res.data.data 或 res.data
        const { total, current_page, per_page, data } = res.data

        pagination.total = total
        pagination.page = current_page
        pagination.page_size = per_page

        // 处理数据，添加 hasChildren 属性
        roleList.value = processRoleData(data || [])
    } catch (error) {
        console.error('获取角色列表失败:', error)
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
        prop: 'name',
        h_label: '角色名称',
        width: 200,
        overflow: true,
    },
    {
        prop: 'description',
        h_label: '角色描述',
        minWidth: 200,
        overflow: true,
    },
    {
        prop: 'sort',
        h_label: '排序',
        align: 'center',
        width: 100,
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
