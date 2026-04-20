/**
 * 环境敏感日志工具
 *
 * 根据当前环境自动调整日志输出行为：
 * - development: 输出所有日志
 * - production: 仅输出 error 级别日志
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LoggerConfig {
    /** 是否启用日志 */
    enabled: boolean
    /** 是否输出 debug 日志 */
    debugEnabled: boolean
    /** 是否输出 info 日志 */
    infoEnabled: boolean
    /** 是否输出 warn 日志 */
    warnEnabled: boolean
    /** 是否输出 error 日志 */
    errorEnabled: boolean
}

/**
 * 根据环境创建日志配置
 */
function createLoggerConfig(): LoggerConfig {
    const isProduction = import.meta.env.PROD

    return {
        enabled: true,
        debugEnabled: !isProduction,
        infoEnabled: !isProduction,
        warnEnabled: !isProduction,
        errorEnabled: true, // 生产环境也输出错误日志
    }
}

const config = createLoggerConfig()

/**
 * 日志工具类
 */
export const Logger = {
    /**
     * Debug 级别日志
     * 仅在开发环境输出
     */
    debug(message?: unknown, ...optionalParams: unknown[]): void {
        if (config.enabled && config.debugEnabled) {
            globalThis.console.debug('[DEBUG]', message, ...optionalParams)
        }
    },

    /**
     * Info 级别日志
     * 仅在开发环境输出
     */
    info(message?: unknown, ...optionalParams: unknown[]): void {
        if (config.enabled && config.infoEnabled) {
            globalThis.console.info('[INFO]', message, ...optionalParams)
        }
    },

    /**
     * Warn 级别日志
     * 仅在开发环境输出
     */
    warn(message?: unknown, ...optionalParams: unknown[]): void {
        if (config.enabled && config.warnEnabled) {
            globalThis.console.warn('[WARN]', message, ...optionalParams)
        }
    },

    /**
     * Error 级别日志
     * 所有环境都输出
     */
    error(message?: unknown, ...optionalParams: unknown[]): void {
        if (config.enabled && config.errorEnabled) {
            globalThis.console.error('[ERROR]', message, ...optionalParams)
        }
    },
}

/**
 * 全局错误拦截器
 * 捕获 Vue 应用未处理的错误
 */
export function setupGlobalErrorHandlers(): void {
    // 捕获未处理的 Promise rejection
    window.addEventListener('unhandledrejection', (event) => {
        Logger.error('[全局错误] 未处理的 Promise rejection:', event.reason)
    })

    // 捕获全局 JavaScript 错误
    window.addEventListener('error', (event) => {
        Logger.error('[全局错误] JavaScript 错误:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
        })
    })
}

export default Logger
