/** 统一确认弹窗标题 */
export const CONFIRM_DIALOG_TITLE = '温馨提示'

/** 统一确认按钮文案 */
export const CONFIRM_BUTTON_TEXT = '确认'

/** 统一取消按钮文案 */
export const CANCEL_BUTTON_TEXT = '取消'

/** 统一确认弹窗内容文案 */
export const CONFIRM_MESSAGES = {
    LOGOUT: '确定退出系统当前登录账号吗?',
    DELETE_ADMIN_USER: '确认删除该管理员吗?',
    DELETE_DEPARTMENT: '确认删除该部门吗?',
    DELETE_ROLE: '确认删除该角色吗?',
    DELETE_MENU: '确认删除该菜单吗？',
} as const

/** 统一操作结果文案 */
export const RESULT_MESSAGES = {
    DELETE_SUCCESS: '删除成功',
    LOGOUT_SUCCESS: '退出成功',
    LOGOUT_CANCEL: '已取消操作',
    REFRESH_SUCCESS: '刷新成功',
    REFRESH_FAILED: '刷新失败，请稍后重试',
} as const

/** 生成抽屉关闭前确认文案 */
export const getDrawerExitConfirmMessage = (formTitle: string) => `已填写数据将会重置，确认退出${formTitle}吗？`
