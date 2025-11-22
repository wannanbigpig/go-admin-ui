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
                        <el-avatar v-if="item.avatar" :size="50" :src="val">
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
                                <xl-action-buttons :buttons="actionButtons" :scope="scope" />
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
                                <img w-full v-if="formData.avatar" :src="formData.avatar" class="avatar" />
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
                            <el-select v-model="formData.status" placeholder="请选择状态" clearable>
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
import { getAdminUserList, getFullEmail, getFullPhone, uploadAvatar, createAdminUser, updateAdminUser, deleteAdminUser, bindAdminUserRole, getAdminUserDetail } from '@/api/adminUser'
import { getDepartmentList } from '@/api/department'
import { getRoleList } from '@/api/permission'
import { filterNullUndefined, flattenTree } from '@/utils/helper'
import { onMounted, reactive, ref, computed } from 'vue'
import Clipboard from 'clipboard'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePermission } from '@/composables/usePermission'
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
        },
    ]
})

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

// ==================== 工具函数 ====================
/**
 * 复制文本到剪贴板
 */
const handleCopyClick = (text) => {
    Clipboard.copy(text)
}

// ==================== 头像上传相关 ====================
/** 头像上传配置 */
const AVATAR_CONFIG = {
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    MAX_SIZE: 2 * 1024 * 1024, // 2MB
    UPLOAD_PATH: 'avatar',
}

/**
 * 头像上传成功回调
 */
const handleAvatarSuccess = (response) => {
    // 仅在需要时获取环境变量
    const { VITE_BASE_URL, VITE_BASE_STATIC } = import.meta.env
    formData.avatar = `${VITE_BASE_URL}${VITE_BASE_STATIC}/${response.path}`
}

/**
 * 头像上传前验证
 */
const beforeAvatarUpload = (rawFile) => {
    if (!AVATAR_CONFIG.ALLOWED_TYPES.includes(rawFile.type)) {
        ElMessage.error('头像图片必须是 JPG、PNG 或 GIF 格式！')
        return false
    }
    if (rawFile.size > AVATAR_CONFIG.MAX_SIZE) {
        ElMessage.error('头像图片大小不能超过 2MB！')
        return false
    }
    return true
}

/**
 * 自定义上传方法
 */
const customUpload = async ({ file, onError }) => {
    try {
        const res = await uploadAvatar(file, { path: AVATAR_CONFIG.UPLOAD_PATH })
        const result = res.data[0]
        if (result.status === 'SUCCESS') {
            ElMessage.success('上传成功')
            return result
        }
        ElMessage.error(result.failure_reason)
        return null
    } catch (err) {
        onError?.(err)
        return null
    }
}

// ==================== 表单相关 ====================
const showDrawer = ref(false)
const formDataRef = ref()
const formTitle = ref('')
const currentIndex = ref(null)
const isSubmitting = ref(false)

// 表单初始数据
const initialFormData = {
    id: 0,
    nickname: '',
    username: '',
    status: STATUS.NORMAL,
    phone_number: '',
    email: '',
    avatar: '',
    dept_ids: [],
    password: '',
    confirm_password: '',
}

const formData = reactive({ ...initialFormData })
const originalFormData = ref(null)

// 判断是否为编辑模式
const isEditMode = computed(() => !!originalFormData.value)

// 表单验证规则
const getDynamicRules = (id) => {
    const isEdit = !!id && id !== 0
    const trigger = ['blur', 'change']

    return {
        nickname: [{ required: true, message: '昵称不能为空', trigger }],
        username: [
            { required: true, message: '用户名不能为空', trigger },
            {
                pattern: /^[a-zA-Z0-9_]+$/,
                message: '由字母、数字和下划线组成',
                trigger,
            },
        ],
        password: [!isEdit && { required: true, message: '密码不能为空', trigger }, { min: 6, max: 20, message: '密码长度6-20个字符', trigger }].filter(Boolean),
        confirm_password: [
            (!isEdit || formData.password) && { required: true, message: '请确认密码', trigger },
            {
                validator: (_, value, callback) => {
                    if (formData.password && value !== formData.password) {
                        callback(new Error('两次输入密码不一致'))
                    } else {
                        callback()
                    }
                },
                trigger,
            },
        ].filter(Boolean),
    }
}

// ==================== 数据比较工具函数 ====================
/**
 * 比较两个数组是否相等（忽略顺序）
 */
const isArrayEqual = (arr1, arr2) => {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) return false
    if (arr1.length !== arr2.length) return false
    const sorted1 = [...arr1].sort()
    const sorted2 = [...arr2].sort()
    return sorted1.every((val, index) => val === sorted2[index])
}

/**
 * 判断值是否为空（用于判断是否提交字段）
 */
const isEmptyValue = (value) => {
    if (value == null) return true
    if (typeof value === 'string' && !value.trim()) return true
    if (Array.isArray(value) && !value.length) return true
    return false
}

// ==================== 数据提交相关 ====================
/**
 * 获取新增模式的提交数据
 */
const getAddSubmitData = () => {
    const submitData = {
        nickname: formData.nickname,
        username: formData.username,
        status: formData.status ?? STATUS.NORMAL,
    }

    // 非必填字段：有值才提交
    const optionalFields = ['phone_number', 'email', 'avatar', 'dept_ids', 'password']
    optionalFields.forEach((field) => {
        if (!isEmptyValue(formData[field])) {
            submitData[field] = formData[field]
        }
    })

    return submitData
}

/**
 * 获取编辑模式的提交数据
 */
const getEditSubmitData = () => {
    const submitData = { id: formData.id }
    const original = originalFormData.value

    // 字段映射表
    const fieldMap = ['nickname', 'username', 'status', 'phone_number', 'email', 'avatar']

    // 检查普通字段是否被修改
    fieldMap.forEach((field) => {
        if (formData[field] !== original[field]) {
            submitData[field] = formData[field]
        }
    })

    // 部门ID数组比较
    if (!isArrayEqual(formData.dept_ids || [], original.dept_ids || [])) {
        submitData.dept_ids = formData.dept_ids || []
    }

    // 密码：如果填写了才提交
    if (!isEmptyValue(formData.password)) {
        submitData.password = formData.password
    }

    return submitData
}

/**
 * 获取提交的字段数据
 */
const getSubmitData = () => {
    return isEditMode.value ? getEditSubmitData() : getAddSubmitData()
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
            await updateAdminUser(submitData)
        } else {
            await createAdminUser(submitData)
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
 * 删除管理员
 */
const handleDelete = async (row) => {
    try {
        await ElMessageBox.confirm('确认删除该管理员吗?', '温馨提示', {
            confirmButtonText: '确认',
            cancelButtonText: '取消',
            beforeClose: async (action, instance, done) => {
                if (action === 'confirm') {
                    instance.confirmButtonLoading = true
                    instance.confirmButtonText = '删除中...'
                    try {
                        await deleteAdminUser(row.id)
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
const currentAdminUserName = ref('')
const roleOptions = ref([])
const roleOptionsLoading = ref(false) // 角色列表加载状态
const roleOptionsLoaded = ref(false) // 标记角色数据是否已加载
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
 * 获取角色列表
 */
const getRoleOptions = async () => {
    const res = await getRoleList({ per_page: 999 })
    const roleData = res.data?.data || res.data
    if (roleData && Array.isArray(roleData.data)) {
        roleOptions.value = roleData.data
    } else if (Array.isArray(roleData)) {
        roleOptions.value = roleData
    }
    return roleData
}

/**
 * 打开绑定角色抽屉
 */
const handleBindRole = async (row) => {
    if (!row || typeof row.id !== 'number') {
        ElMessage.error('无效的行数据')
        return
    }

    currentAdminUserName.value = row.nickname || row.username || ''
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
            })
            .finally(() => {
                roleOptionsLoading.value = false
            })
    }

    // 获取管理员详情，查看已绑定的角色
    try {
        const res = await getAdminUserDetail({ id: row.id })
        const userData = res.data?.data || res.data
        if (userData && Array.isArray(userData.role_list)) {
            // 使用 role_list 字段回显
            bindRoleData.role_ids = userData.role_list
        } else if (userData && Array.isArray(userData.role_ids)) {
            // 兼容 role_ids 字段
            bindRoleData.role_ids = userData.role_ids
        } else if (userData && Array.isArray(userData.roles)) {
            // 如果返回的是角色对象数组，提取ID
            bindRoleData.role_ids = userData.roles.map((role) => (typeof role === 'object' ? role.id : role))
        }
    } catch (error) {
        console.error('获取管理员详情失败:', error)
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

        await bindAdminUserRole(submitData)
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
    if (formDataRef.value) {
        formDataRef.value.clearValidate()
    }
}

/**
 * 从行数据中提取部门ID
 */
const extractDeptIds = (row) => {
    if (row.departments?.length) {
        return row.departments.map((dept) => dept.id).filter((id) => id != null)
    }
    if (row.dept_ids) {
        return Array.isArray(row.dept_ids) ? row.dept_ids : []
    }
    if (row.department_ids) {
        return Array.isArray(row.department_ids) ? row.department_ids : []
    }
    if (row.department_id != null) {
        return Array.isArray(row.department_id) ? row.department_id : [row.department_id]
    }
    return []
}

/**
 * 保存原始数据（深拷贝）
 */
const saveOriginalData = () => {
    originalFormData.value = JSON.parse(
        JSON.stringify({
            id: formData.id,
            nickname: formData.nickname,
            username: formData.username,
            status: formData.status,
            phone_number: formData.phone_number,
            email: formData.email,
            avatar: formData.avatar,
            dept_ids: [...formData.dept_ids],
        })
    )
}

/**
 * 打开编辑/新增抽屉
 */
const openEditDrawer = (type, row, index) => {
    // 参数校验
    if (typeof type !== 'number' || ![EDIT_TYPE.ADD, EDIT_TYPE.EDIT].includes(type)) {
        return
    }

    // 重置表单
    resetFormData()
    currentIndex.value = index

    if (type === EDIT_TYPE.EDIT) {
        if (!row || typeof row.id !== 'number') {
            ElMessage.error('无效的行数据')
            return
        }

        formTitle.value = '编辑管理员'

        // 设置表单数据
        Object.assign(formData, {
            id: row.id,
            nickname: row.nickname || '',
            username: row.username || '',
            status: row.status ?? STATUS.NORMAL,
            phone_number: row.phone_number || '',
            email: row.email || '',
            avatar: row.avatar || '',
            dept_ids: extractDeptIds(row),
        })

        saveOriginalData()
    } else {
        // 新增模式
        formTitle.value = '新增管理员'
        originalFormData.value = null
    }

    showDrawer.value = true
}
// ==================== 搜索相关 ====================
const queryFormRef = ref(null)
const queryWhere = reactive({
    page: 1,
    per_page: 10,
    username: null,
    phone_number: null,
    status: null,
    email: null,
    dept_id: null,
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
const adminUserList = ref([])
const departmentOptions = ref([])

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
 * 获取部门列表
 */
const getDepartmentOptions = async () => {
    try {
        const res = await getDepartmentList()
        const departmentData = res.data?.data || res.data
        if (Array.isArray(departmentData)) {
            departmentOptions.value = flattenTree(departmentData)
        }
    } catch (error) {
        console.error('获取部门列表失败:', error)
    }
}

/**
 * 获取管理员列表
 */
const getList = async () => {
    loading.value = true

    try {
        // 过滤空字符串
        const filteredParams = {
            ...queryWhere,
            phone_number: queryWhere.phone_number?.trim() || undefined,
            username: queryWhere.username?.trim() || undefined,
            email: queryWhere.email?.trim() || undefined,
        }

        const res = await getAdminUserList(filterNullUndefined(filteredParams))
        const { total, current_page, per_page, data } = res.data

        pagination.total = total
        pagination.page = current_page
        pagination.page_size = per_page
        adminUserList.value = data
    } catch (error) {
        console.error('获取管理员列表失败:', error)
    } finally {
        loading.value = false
    }
}

// ==================== 表格配置相关 ====================
/**
 * 切换脱敏字段显示/隐藏的通用函数
 */
const createToggleFullInfo = (field, oldField, fetchFn) => {
    return (row) => {
        const showField = `showFull${field.charAt(0).toUpperCase() + field.slice(1)}`
        row[showField] = !row[showField]

        // 切换显示时交换当前值和旧值
        const swapValues = () => {
            const oldValue = row[oldField]
            row[oldField] = row[field]
            row[field] = oldValue
        }

        if (row[showField]) {
            // 显示完整信息
            if (row[oldField] === undefined) {
                row[oldField] = row[field]
                fetchFn({ id: row.id }).then((res) => {
                    row[field] = res.data[field]
                })
            } else {
                swapValues()
            }
        } else {
            // 隐藏完整信息，恢复脱敏值
            swapValues()
        }
    }
}

// ==================== 生命周期 ====================
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
        getFullInfo: createToggleFullInfo('phone_number', 'old_phone_number', getFullPhone),
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
        getFullInfo: createToggleFullInfo('email', 'old_email', getFullEmail),
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
