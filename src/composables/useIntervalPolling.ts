import { getCurrentInstance, onBeforeUnmount, ref } from 'vue'
import { Logger } from '@/utils/logger'

export interface UseIntervalPollingOptions {
    /** 轮询间隔（毫秒），必传 */
    interval: number
    /** 触发条件，返回 false 时跳过本轮（不影响下一轮调度） */
    when?: () => boolean
    /** 页面隐藏时是否暂停（默认 true） */
    pauseWhenHidden?: boolean
    /** 是否在 start 时立即执行一次（默认 false） */
    immediate?: boolean
}

export interface PollingTaskContext {
    signal: AbortSignal
}

export type PollingTask = (ctx: PollingTaskContext) => Promise<void> | void

/**
 * 通用轮询 composable：
 * - 串行调度：上一轮 fn 完成（或被 abort）后才开始下一轮，避免雪崩
 * - 页面隐藏时自动暂停（document.visibilitychange）
 * - 通过 AbortController 让 fn 内的网络请求/异步任务在下一轮启动前被取消
 *
 * 注意：fn 必须接收 signal 并将其传给底层（如 fetch）才能真正实现取消。
 */
export function useIntervalPolling(fn: PollingTask, options: UseIntervalPollingOptions) {
    const { interval, when, pauseWhenHidden = true, immediate = false } = options

    const isRunning = ref(false)
    let timer: ReturnType<typeof setTimeout> | null = null
    let controller: AbortController | null = null
    let pausedByVisibility = false
    let visibilityHandlerAttached = false
    let currentSessionId = 0

    const clearTimer = () => {
        if (timer !== null) {
            clearTimeout(timer)
            timer = null
        }
    }

    const abortCurrent = () => {
        if (controller) {
            controller.abort()
            controller = null
        }
    }

    const tick = async () => {
        if (!isRunning.value) return
        const sessionId = currentSessionId
        if (pauseWhenHidden && typeof document !== 'undefined' && document.hidden) {
            // 隐藏期间不执行，等可见后再重新调度
            pausedByVisibility = true
            return
        }
        if (typeof when === 'function' && !when()) {
            if (sessionId === currentSessionId) {
                schedule()
            }
            return
        }

        abortCurrent()
        controller = new AbortController()
        const localController = controller
        try {
            await fn({ signal: localController.signal })
        } catch (error) {
            // 由调用方决定是否处理；这里仅在非 abort 时让错误传播会破坏轮询，故吞掉。
            if ((error as { name?: string } | null)?.name !== 'AbortError') {
                Logger.warn('[useIntervalPolling] fn 抛错:', error)
            }
        } finally {
            if (controller === localController) {
                controller = null
            }
        }

        if (sessionId === currentSessionId) {
            schedule()
        }
    }

    const schedule = () => {
        clearTimer()
        if (!isRunning.value) return
        timer = setTimeout(() => {
            void tick()
        }, interval)
    }

    const onVisibilityChange = () => {
        if (!isRunning.value) return
        if (document.hidden) {
            // 暂停：清掉下一次定时器并打断当前 fn
            pausedByVisibility = true
            clearTimer()
            abortCurrent()
        } else if (pausedByVisibility) {
            pausedByVisibility = false
            void tick()
        }
    }

    const attachVisibility = () => {
        if (!pauseWhenHidden || visibilityHandlerAttached) return
        if (typeof document === 'undefined') return
        document.addEventListener('visibilitychange', onVisibilityChange)
        visibilityHandlerAttached = true
    }

    const detachVisibility = () => {
        if (!visibilityHandlerAttached) return
        if (typeof document === 'undefined') return
        document.removeEventListener('visibilitychange', onVisibilityChange)
        visibilityHandlerAttached = false
    }

    const start = () => {
        if (isRunning.value) return
        currentSessionId++
        isRunning.value = true
        pausedByVisibility = false
        attachVisibility()
        if (pauseWhenHidden && typeof document !== 'undefined' && document.hidden) {
            pausedByVisibility = true
            return
        }
        if (immediate) {
            void tick()
        } else {
            schedule()
        }
    }

    const stop = () => {
        currentSessionId++
        isRunning.value = false
        pausedByVisibility = false
        clearTimer()
        abortCurrent()
        detachVisibility()
    }

    const pause = () => {
        if (!isRunning.value) return
        currentSessionId++
        clearTimer()
        abortCurrent()
        detachVisibility()
        isRunning.value = false
    }

    const resume = () => {
        if (isRunning.value) return
        start()
    }

    if (getCurrentInstance()) {
        onBeforeUnmount(() => {
            stop()
        })
    }

    return {
        start,
        stop,
        clear: stop,
        pause,
        resume,
        isRunning,
    }
}
