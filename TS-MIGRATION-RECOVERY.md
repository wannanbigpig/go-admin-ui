# TypeScript 迁移导致的功能逻辑变更报告

> 生成时间：2026/04/17  
> 迁移提交：`ee977ac`  
> 影响：多个核心业务逻辑被改动或删除

---

## 概述

在从 JS 迁移到 TS 的过程中，**大量原有业务逻辑被简化或删除**。以下是详细的变更清单和恢复建议。

---

## 1. useAdminUserForm.ts（管理员表单）

### 1.1 严重逻辑变更

| 变更项           | 原有逻辑（JS）                           | 新逻辑（TS）             | 影响                        |
| ---------------- | ---------------------------------------- | ------------------------ | --------------------------- |
| **部门字段**     | `dept_ids` (数组)                        | `dept_id` (单个)         | 多部门支持丢失              |
| **角色字段**     | 无 `role_ids`                            | 新增 `role_ids`          | 角色关联逻辑变更            |
| **提交数据字段** | `phone_number`                           | `mobile`                 | 字段名变更可能导致 API 失败 |
| **头像上传**     | `uploadAvatarFile(file, { path })`       | `uploadUserAvatar(file)` | 上传参数丢失                |
| **头像返回**     | `response.uuid`                          | `response.url`           | 返回值变更                  |
| **错误处理**     | `ElMessage.error(result.failure_reason)` | 无，仅 console           | 用户看不到错误信息          |
| **提交延迟**     | `ADMIN_USER_SUBMIT_DELAY` + setTimeout   | 无延迟                   | 防重复提交保护丢失          |
| **数据提取**     | `extractDeptIds(row)` 方法               | 已删除                   | 部门数据解析逻辑丢失        |

### 1.2 删除的代码

```javascript
// 已删除：部门 ID 提取逻辑（支持多种后端返回格式）
const extractDeptIds = (row) => {
    if (row.departments?.length) return row.departments.map((dept) => dept.id).filter((id) => id != null)
    if (row.dept_ids) return Array.isArray(row.dept_ids) ? row.dept_ids : []
    if (row.department_ids) return Array.isArray(row.department_ids) ? row.department_ids : []
    if (row.department_id != null) return Array.isArray(row.department_id) ? row.department_id : [row.department_id]
    return []
}

// 已删除：保存原始数据方法
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

// 已删除：新增单独的数据构造方法
const getAddSubmitData = () => {
    const submitData = {
        nickname: formData.nickname,
        username: formData.username,
        status: formData.status ?? ADMIN_USER_STATUS.NORMAL,
    }
    ;['phone_number', 'email', 'avatar', 'dept_ids', 'password'].forEach((field) => {
        if (!isEmptyValue(formData[field])) {
            submitData[field] = formData[field]
        }
    })
    return submitData
}
```

### 1.3 恢复建议

**需要恢复的功能**：

1. `dept_ids` 字段改回数组（多部门支持）
2. `phone_number` 字段名恢复（确认后端 API 要求）
3. 恢复 `extractDeptIds` 和 `saveOriginalData` 方法
4. 恢复头像上传的错误提示
5. 恢复 `ADMIN_USER_SUBMIT_DELAY` 防抖保护

---

## 2. useRoleForm.ts（角色表单）

### 2.1 严重逻辑变更

| 变更项           | 原有逻辑（JS）                                         | 新逻辑（TS）            | 影响                     |
| ---------------- | ------------------------------------------------------ | ----------------------- | ------------------------ |
| **角色树形结构** | `flattenRoleTree`, `filteredRoleOptions`               | 已删除                  | 角色层级选择器失效       |
| **菜单权限**     | `menuTreeRef`, `handleMenuCheck`, `setMenuTreeChecked` | 简化                    | 菜单树勾选逻辑变更       |
| **父角色菜单**   | `parentRoleMenuList`, `updateMenuTreeDisabled`         | 已删除                  | 父角色菜单禁用逻辑丢失   |
| **超级管理员**   | `isSuperAdminRole` 基于 code                           | 假设 code='super_admin' | 超级管理员标识可能不匹配 |
| **获取详情**     | 使用 `fetchRoleDetail`                                 | 使用 `getRoleDetail`    | API 方法变更             |
| **提交数据**     | `getSubmitData()` 包含 `sort`, `pid`                   | 无 `sort`, `pid` 字段   | 角色排序和层级丢失       |
| **删除逻辑**     | 无                                                     | 无                      | 角色删除功能丢失         |

### 2.2 删除的核心代码

```javascript
// 已删除：角色树扁平化（用于父角色选择器）
const flattenRoleTree = (roles, prefix = '') => {
    if (!Array.isArray(roles)) return []
    return roles.flatMap((role) => {
        const label = prefix ? `${prefix} / ${role.name}` : role.name
        const current = [{ ...role, label }]
        if (Array.isArray(role.children) && role.children.length > 0) {
            return current.concat(flattenRoleTree(role.children, label))
        }
        return current
    })
}

// 已删除：获取角色的所有子级 ID（防止循环引用）
const getRoleChildrenIds = (targetId) => {
    const result = [targetId]
    const walk = (roles) => {
        roles.forEach((role) => {
            if (role.pid === targetId || result.includes(role.pid)) {
                if (!result.includes(role.id)) {
                    result.push(role.id)
                }
            }
            if (Array.isArray(role.children) && role.children.length > 0) {
                walk(role.children)
            }
        })
    }
    walk(roleList.value || [])
    return result
}

// 已删除：动态计算父角色选项（排除当前角色及其子级）
const filteredRoleOptions = computed(() => {
    const roleOptions = flattenRoleTree(roleList.value || [])
    if (!isEditMode.value || !formData.id) {
        return roleOptions
    }
    const excludedIds = getRoleChildrenIds(formData.id)
    return roleOptions.filter((role) => !excludedIds.includes(role.id))
})

// 已删除：根据父角色禁用菜单树
const updateMenuTreeDisabled = (menuData) => {
    if (!Array.isArray(menuData)) return
    if (isSuperAdminEditing.value) {
        const disableAll = (items) => {
            items.forEach((item) => {
                item.disabled = true
                if (item.children && item.children.length > 0) {
                    disableAll(item.children)
                }
            })
        }
        disableAll(menuData)
        return
    }
    if (formData.pid === 0 || formData.pid === null) {
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
    const setDisabled = (items) => {
        items.forEach((item) => {
            item.disabled = parentRoleMenuList.value.includes(item.id)
            if (item.children && item.children.length > 0) {
                setDisabled(item.children)
            }
        })
    }
    setDisabled(menuData)
}

// 已删除：菜单树勾选处理
const handleMenuCheck = (data, checked) => {
    if (isSuperAdminEditing.value) {
        nextTick(() => {
            menuTreeRef.value?.setCheckedKeys(formData.menu_list, false)
        })
        return
    }
    formData.menu_list = checked.checkedKeys || []
}

// 已删除：设置菜单树勾选状态
const setMenuTreeChecked = async () => {
    await nextTick()
    if (menuTreeRef.value && menuTreeData.value.length > 0) {
        if (isSuperAdminEditing.value) {
            const allMenuIds = []
            const collectMenuIds = (items) => {
                items.forEach((item) => {
                    allMenuIds.push(item.id)
                    if (Array.isArray(item.children) && item.children.length > 0) {
                        collectMenuIds(item.children)
                    }
                })
            }
            collectMenuIds(menuTreeData.value)
            formData.menu_list = allMenuIds
            menuTreeRef.value.setCheckedKeys([], false)
            menuTreeRef.value.setCheckedKeys(allMenuIds, false)
        } else if (isEditMode.value && formData.menu_list.length > 0) {
            menuTreeRef.value.setCheckedKeys([], false)
            menuTreeRef.value.setCheckedKeys(formData.menu_list, false)
        } else if (!isEditMode.value) {
            menuTreeRef.value.setCheckedKeys([])
        }
    }
}
```

### 2.3 恢复建议

**需要恢复的功能**：

1. 恢复 `flattenRoleTree` 和 `filteredRoleOptions`（父角色选择器）
2. 恢复 `menuTreeRef`, `handleMenuCheck`, `setMenuTreeChecked`（菜单树逻辑）
3. 恢复 `parentRoleMenuList` 和 `updateMenuTreeDisabled`
4. 恢复 `sort` 和 `pid` 字段到提交数据
5. 确认超级管理员的 code 值

---

## 3. useMenuForm.ts（菜单表单）

### 3.1 严重逻辑变更

| 变更项           | 原有逻辑（JS）                                    | 新逻辑（TS） | 影响             |
| ---------------- | ------------------------------------------------- | ------------ | ---------------- |
| **表单步骤**     | `step`, `handleStepChange` (两步表单)             | 已删除       | 两步表单变一步   |
| **字段验证**     | `editFormRules` 完整验证规则                      | 无           | 表单验证丢失     |
| **字段联动**     | `handleAnimateDurationChange`, `handlePathChange` | 已删除       | 字段联动逻辑丢失 |
| **菜单类型常量** | `MENU_TYPE`, `MENU_SWITCH_VALUE`                  | 未使用       | 类型判断可能失效 |
| **删除功能**     | `handleDelete`                                    | 保留但简化   | 删除确认弹窗丢失 |
| **父级固定**     | `isParentFixed`, `fixedParentId`                  | 保留         | 正常             |

### 3.2 删除的核心代码

```javascript
// 已删除：表单步骤状态
const step = ref(MENU_STEP.BASIC_INFO)

// 已删除：动画时长处理（限制小数位数）
let numericValue
const handleAnimateDurationChange = (value, decimal = 2) => {
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

// 已删除：路径变更处理（自动判断是否外链）
const handlePathChange = (val) => {
    const isExternalLink = val.startsWith('http://') || val.startsWith('https://')
    formData.is_external_links = isExternalLink ? MENU_SWITCH_VALUE.YES : MENU_SWITCH_VALUE.NO
}

// 已删除：完整的表单验证规则
const editFormRules = {
    title: [
        { required: true, message: '名称不能为空', trigger: 'blur' },
        { min: 1, max: 12, message: '名称不超过 12 个字符', trigger: 'blur' },
    ],
    pid: [{ required: true, message: '上级菜单不能为空', trigger: 'blur', ... }],
    type: [{ required: true, message: '菜单类型不能为空', trigger: 'blur' }],
    is_auth: [{ required: true, message: '是否鉴权不能为空', trigger: 'blur' }],
    is_show: [{ required: true, message: '是否显示不能为空', trigger: 'blur' }],
    sort: [{ trigger: 'blur', type: 'integer', message: '请输入整数类型' }],
    path: [{ trigger: 'blur', validator: (rule, value, callback) => callback() }],
    name: [{
        trigger: 'blur',
        validator: (rule, value, callback) => {
            if (formData.type === MENU_TYPE.MENU && !value) {
                callback(new Error('请输入路由名称'))
            }
            callback()
        },
    }],
    component: [{
        trigger: 'blur',
        validator: (rule, value, callback) => {
            if (formData.type === MENU_TYPE.MENU && formData.is_external_links !== MENU_SWITCH_VALUE.YES && !value) {
                callback(new Error('请输入组件路径'))
            }
            if (value) {
                if (value.startsWith('/')) callback(new Error('组件路径不能以 / 开头'))
                if (!/^[a-zA-Z0-9/._-]+$/.test(value)) callback(new Error('组件路径只能包含字母、数字、/、.、_、-'))
            }
            callback()
        },
    }],
    code: [{
        trigger: 'blur',
        validator: (rule, value, callback) => {
            if (formData.type === MENU_TYPE.BUTTON && !value) {
                callback(new Error('请输入权限标识'))
            }
            callback()
        },
    }],
}

// 已删除：步骤切换逻辑（先验证再进入权限选择页）
const handleStepChange = async (targetStep) => {
    if (targetStep === MENU_STEP.PERMISSION) {
        try {
            await formDataRef.value.validate()
            step.value = targetStep
            await fetchPermissionList()
        } catch (fields) {
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

// 已删除：提交时的字段处理
const handleSubmit = async () => {
    if (isSubmitting.value) return
    isSubmitting.value = true
    // 按钮类型清空路由字段
    if (formData.type === MENU_TYPE.BUTTON) {
        formData.name = ''
        formData.path = ''
        formData.redirect = ''
        formData.component = ''
    } else {
        formData.code = ''
    }
    // ...
}
```

### 3.3 恢复建议

**需要恢复的功能**：

1. 恢复 `step` 状态和 `handleStepChange`（两步表单）
2. 恢复 `editFormRules` 验证规则
3. 恢复 `handleAnimateDurationChange` 和 `handlePathChange`
4. 恢复 `MENU_TYPE`, `MENU_SWITCH_VALUE` 常量的使用
5. 恢复提交时的字段清空逻辑

---

## 4. 其他受影响文件

### 4.1 service.ts / API 层

| 文件                               | 变更                                                | 影响             |
| ---------------------------------- | --------------------------------------------------- | ---------------- |
| `src/modules/adminUser/service.ts` | 方法名变更 (`createAdminUserItem` → `addAdminUser`) | 调用方需同步更新 |
| `src/modules/role/service.ts`      | 类似变更                                            | 调用方需同步更新 |
| `src/modules/menu/service.ts`      | 类似变更                                            | 调用方需同步更新 |

### 4.2 model.ts / 常量层

| 文件                             | 删除的常量                                            | 影响               |
| -------------------------------- | ----------------------------------------------------- | ------------------ |
| `src/modules/adminUser/model.ts` | `ADMIN_USER_AVATAR_CONFIG`, `ADMIN_USER_SUBMIT_DELAY` | 头像配置和提交延迟 |
| `src/modules/menu/model.ts`      | `MENU_STEP`, `MENU_TYPE`, `MENU_SWITCH_VALUE`         | 菜单步骤和类型     |
| `src/modules/role/model.ts`      | `ROLE_EDIT_TYPE`, `ROLE_SUBMIT_DELAY`                 | 角色编辑类型和延迟 |

---

## 5. 恢复优先级

### P0 - 必须恢复（功能缺失）

1. **useAdminUserForm**: `dept_ids` 多部门支持
2. **useAdminUserForm**: 头像上传错误提示
3. **useRoleForm**: 菜单树勾选逻辑 (`handleMenuCheck`, `setMenuTreeChecked`)
4. **useRoleForm**: 父角色选择器 (`filteredRoleOptions`)
5. **useMenuForm**: 表单验证规则 (`editFormRules`)

### P1 - 强烈建议恢复（体验下降）

1. **useAdminUserForm**: 提交延迟防抖 (`ADMIN_USER_SUBMIT_DELAY`)
2. **useRoleForm**: 父角色菜单禁用 (`updateMenuTreeDisabled`)
3. **useMenuForm**: 两步表单步骤 (`handleStepChange`)
4. **useMenuForm**: 字段联动 (`handlePathChange`, `handleAnimateDurationChange`)

### P2 - 按需恢复（代码质量）

1. 统一 API 方法命名（保持 TS 版本或回退）
2. 恢复常量配置文件

---

## 6. 验证清单

恢复后需要验证的功能：

### 管理员管理

-   [ ] 新增管理员（多部门选择）
-   [ ] 编辑管理员（部门回显）
-   [ ] 头像上传（错误提示）
-   [ ] 角色分配

### 角色管理

-   [ ] 新增角色（父角色选择器选项正确）
-   [ ] 编辑角色（菜单树回显）
-   [ ] 菜单树勾选（父子节点联动）
-   [ ] 超级管理员菜单全选

### 菜单管理

-   [ ] 新增菜单（两步表单）
-   [ ] 路径输入（自动判断外链）
-   [ ] 按钮类型（清空路由字段）
-   [ ] 表单验证（所有字段）

---

## 7. 下一步建议

1. **立即执行**：从 git 历史恢复原始 JS 文件作为参考
2. **分模块恢复**：按 `useAdminUserForm` → `useRoleForm` → `useMenuForm` 顺序
3. **逐项验证**：每恢复一个功能立即测试
4. **保留 TS 类型**：在恢复逻辑的同时保留 TypeScript 类型定义

---

**备注**：此报告基于对比 `ee977ac^` (迁移前) 和 `ee977ac` (迁移后) 的差异生成。
