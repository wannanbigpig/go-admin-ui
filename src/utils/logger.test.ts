import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Logger, setupGlobalErrorHandlers } from '@/utils/logger'

// 保存原始 console 方法
const originalConsole = {
    debug: console.debug,
    info: console.info,
    warn: console.warn,
    error: console.error,
}

describe('logger.ts', () => {
    beforeEach(() => {
        // 重置所有 mock
        vi.clearAllMocks()
    })

    afterEach(() => {
        // 恢复原始 console 方法
        console.debug = originalConsole.debug
        console.info = originalConsole.info
        console.warn = originalConsole.warn
        console.error = originalConsole.error
    })

    describe('Logger', () => {
        it('debug 方法应该调用 console.debug', () => {
            console.debug = vi.fn()
            Logger.debug('test message')
            expect(console.debug).toHaveBeenCalledWith('[DEBUG]', 'test message')
        })

        it('info 方法应该调用 console.info', () => {
            console.info = vi.fn()
            Logger.info('test message')
            expect(console.info).toHaveBeenCalledWith('[INFO]', 'test message')
        })

        it('warn 方法应该调用 console.warn', () => {
            console.warn = vi.fn()
            Logger.warn('test message')
            expect(console.warn).toHaveBeenCalledWith('[WARN]', 'test message')
        })

        it('error 方法应该调用 console.error', () => {
            console.error = vi.fn()
            Logger.error('test message')
            expect(console.error).toHaveBeenCalledWith('[ERROR]', 'test message')
        })

        it('应该支持多个参数', () => {
            console.debug = vi.fn()
            Logger.debug('message', { key: 'value' }, [1, 2, 3])
            expect(console.debug).toHaveBeenCalledWith('[DEBUG]', 'message', { key: 'value' }, [1, 2, 3])
        })
    })

    describe('setupGlobalErrorHandlers', () => {
        it('应该设置 unhandledrejection 监听器', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
            setupGlobalErrorHandlers()
            expect(addEventListenerSpy).toHaveBeenCalledWith('unhandledrejection', expect.any(Function))
        })

        it('应该设置 error 监听器', () => {
            const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
            setupGlobalErrorHandlers()
            expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function))
        })
    })
})
