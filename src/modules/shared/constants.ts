// ==================== 提交相关常量 ====================
/** 默认提交延迟时间（毫秒） */
export const DEFAULT_SUBMIT_DELAY = 3000

// ==================== 请求相关常量 ====================
/** 请求超时时间（毫秒） */
export const REQUEST_TIMEOUT = 10 * 1000

/** 请求重试次数 */
export const REQUEST_RETRY_COUNT = 3

// ==================== 分页相关常量 ====================
/** 默认每页条数 */
export const DEFAULT_PAGE_SIZE = 10

/** 每页条数选项 */
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// ==================== 表单相关常量 ====================
/** 表单验证触发器 */
export const FORM_VALIDATION_TRIGGERS = ['blur', 'change'] as const

// ==================== UI 相关常量 ====================
/** 侧边栏过渡动画时间（毫秒） */
export const SIDEBAR_TRANSITION_DURATION = 320

/** 侧边栏过渡动画缓动函数 */
export const SIDEBAR_TRANSITION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)'

/** Message 默认显示时长（毫秒） */
export const MESSAGE_DURATION = 3 * 1000

/** Message 错误显示时长（毫秒） */
export const MESSAGE_ERROR_DURATION = 5 * 1000

// ==================== 缓存相关常量 ====================
/** Pinia 持久化前缀 */
export const PERSISTED_STATE_KEY_PREFIX = '__persisted__'

/** 缓存版本号（用于破坏性更新时清理旧缓存） */
export const CACHE_VERSION = 'v1'

// ==================== 状态常量 ====================
/** 通用启用状态值 */
export const STATUS_ENABLED = 1

/** 通用禁用状态值 */
export const STATUS_DISABLED = 0
