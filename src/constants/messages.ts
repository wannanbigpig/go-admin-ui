/** 统一确认弹窗标题 key */
export const CONFIRM_DIALOG_TITLE = 'common.confirm.title'

/** 统一确认按钮文案 key */
export const CONFIRM_BUTTON_TEXT = 'common.actions.confirm'

/** 统一取消按钮文案 key */
export const CANCEL_BUTTON_TEXT = 'common.actions.cancel'

/** 统一确认弹窗内容 key */
export const CONFIRM_MESSAGES = {
    LOGOUT: 'common.confirm.logout',
    DELETE_ADMIN_USER: 'common.confirm.deleteAdminUser',
    DELETE_DEPARTMENT: 'common.confirm.deleteDepartment',
    DELETE_ROLE: 'common.confirm.deleteRole',
    DELETE_MENU: 'common.confirm.deleteMenu',
} as const

/** 统一操作结果文案 key */
export const RESULT_MESSAGES = {
    DELETE_SUCCESS: 'common.result.deleteSuccess',
    LOGOUT_SUCCESS: 'common.result.logoutSuccess',
    LOGOUT_CANCEL: 'common.result.logoutCancel',
    REFRESH_SUCCESS: 'common.result.refreshSuccess',
    REFRESH_FAILED: 'common.result.refreshFailed',
    OPERATION_SUCCESS: 'common.result.operationSuccess',
    ADD_SUCCESS: 'common.result.addSuccess',
    EDIT_SUCCESS: 'common.result.editSuccess',
    BIND_ROLE_SUCCESS: 'common.result.bindRoleSuccess',
    UPDATE_SUCCESS: 'common.result.updateSuccess',
    UPLOAD_SUCCESS: 'common.result.uploadSuccess',
    UPLOAD_FAILED: 'common.result.uploadFailed',
} as const

/** 生成抽屉关闭前确认文案 key */
export const DRAWER_EXIT_CONFIRM_MESSAGE_KEY = 'common.confirm.drawerExit'
