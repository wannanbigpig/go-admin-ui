export default {
    tokenExpired: {
        content: '登录状态已过期，请重新登录',
        title: '系统提示',
        relogin: '重新登陆',
    },
    drawer: {
        resetOrFormRefRequired: '自定义重置方法和表单Ref二者必传一个，否则重置按钮无效',
        onConfirmRequired: '[XlDrawer] onConfirm 必传',
    },
    adminUser: {
        avatarTypeInvalid: '头像图片必须是 JPG、PNG 或 GIF 格式！',
        avatarSizeInvalid: '头像图片大小不能超过 2MB！',
        invalidRow: '无效的行数据',
        nicknameRequired: '昵称不能为空',
        usernameRequired: '用户名不能为空',
        usernameMin: '用户名长度不能少于 3 个字符',
        usernamePattern: '由字母、数字和下划线组成',
        passwordRequired: '密码不能为空',
        passwordLength: '密码长度 6-20 个字符',
        confirmPasswordRequired: '请确认密码',
        passwordNotMatch: '两次输入密码不一致',
    },
    profile: {
        nicknameRequired: '昵称不能为空',
        nicknameLength: '昵称长度应在 2-20 个字符之间',
        phoneInvalid: '请输入正确的手机号码',
        emailInvalid: '请输入正确的邮箱地址',
        avatarTypeInvalid: '头像图片必须是 JPG、PNG 或 GIF 格式！',
        avatarSizeInvalid: '头像图片大小不能超过 2MB！',
    },
    department: {
        nameRequired: '部门名称不能为空',
        sortRequired: '排序不能为空',
        formName: '部门表单',
        invalidRow: '无效的行数据',
    },
    role: {
        nameRequired: '角色名称不能为空',
        sortRequired: '排序不能为空',
        statusRequired: '状态不能为空',
        nameInputRequired: '请输入角色名称',
        codeInputRequired: '请输入角色标识',
        formName: '角色表单',
        invalidRow: '无效的行数据',
        readonlySuperAdmin: '超级管理员角色为只读，不允许编辑',
        fetchMenuFailed: '获取菜单列表失败',
    },
    menu: {
        formName: '菜单表单',
        invalidRow: '无效的行数据',
    },
    apiPermission: {
        formName: '接口权限表单',
    },
    profileForm: {
        formName: '个人资料表单',
    },
}
