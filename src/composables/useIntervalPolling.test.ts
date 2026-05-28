import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useIntervalPolling } from '@/composables/useIntervalPolling'

// 这些用例不依赖 Vue 组件生命周期，onBeforeUnmount 在非组件环境下是 no-op；
// vue 在测试中允许在 setup 外调用生命周期 hooks 但会 warn，这里允许 warn。
describe('composables/useIntervalPolling.ts', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('start 后按间隔执行 fn；stop 后不再触发', async () => {
        const fn = vi.fn(async () => {
            /* noop */
        })
        const polling = useIntervalPolling(fn, { interval: 1000 })

        polling.start()
        expect(fn).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(1000)
        expect(fn).toHaveBeenCalledTimes(1)

        await vi.advanceTimersByTimeAsync(1000)
        expect(fn).toHaveBeenCalledTimes(2)

        polling.stop()
        await vi.advanceTimersByTimeAsync(5000)
        expect(fn).toHaveBeenCalledTimes(2)
        expect(polling.isRunning.value).toBe(false)
    })

    it('immediate=true 时立即触发一次', async () => {
        const fn = vi.fn(async () => {
            /* noop */
        })
        const polling = useIntervalPolling(fn, { interval: 1000, immediate: true })

        polling.start()
        await vi.advanceTimersByTimeAsync(0)
        expect(fn).toHaveBeenCalledTimes(1)

        polling.stop()
    })

    it('when 返回 false 时跳过本轮但保持调度', async () => {
        const fn = vi.fn(async () => {
            /* noop */
        })
        let gate = false
        const polling = useIntervalPolling(fn, {
            interval: 500,
            when: () => gate,
        })

        polling.start()
        await vi.advanceTimersByTimeAsync(500)
        expect(fn).toHaveBeenCalledTimes(0)

        gate = true
        await vi.advanceTimersByTimeAsync(500)
        expect(fn).toHaveBeenCalledTimes(1)

        polling.stop()
    })

    it('新一轮启动前 abort 上一轮的 signal', async () => {
        const signals: AbortSignal[] = []
        const fn = vi.fn(async ({ signal }: { signal: AbortSignal }) => {
            signals.push(signal)
            // 用一个永远不 resolve 的 promise 模拟长任务，靠 signal 取消
            await new Promise<void>((resolve) => {
                signal.addEventListener('abort', () => resolve())
            })
        })
        const polling = useIntervalPolling(fn, { interval: 100 })

        polling.start()
        await vi.advanceTimersByTimeAsync(100)
        expect(signals.length).toBe(1)
        expect(signals[0].aborted).toBe(false)

        // stop 时应 abort 当前 controller
        polling.stop()
        expect(signals[0].aborted).toBe(true)
    })

    it('pause/resume 控制运行态', async () => {
        const fn = vi.fn(async () => {
            /* noop */
        })
        const polling = useIntervalPolling(fn, { interval: 200 })

        polling.start()
        expect(polling.isRunning.value).toBe(true)

        polling.pause()
        expect(polling.isRunning.value).toBe(false)

        await vi.advanceTimersByTimeAsync(1000)
        expect(fn).toHaveBeenCalledTimes(0)

        polling.resume()
        expect(polling.isRunning.value).toBe(true)
        await vi.advanceTimersByTimeAsync(200)
        expect(fn).toHaveBeenCalledTimes(1)

        polling.stop()
    })

    it('当页面隐藏且配置了 pauseWhenHidden 时，start 不会调度定时器', async () => {
        const fn = vi.fn(async () => {
            /* noop */
        })

        vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)

        const polling = useIntervalPolling(fn, {
            interval: 1000,
            pauseWhenHidden: true,
        })

        polling.start()
        expect(polling.isRunning.value).toBe(true)

        await vi.advanceTimersByTimeAsync(3000)
        expect(fn).toHaveBeenCalledTimes(0)

        vi.spyOn(document, 'hidden', 'get').mockReturnValue(false)
        const event = new Event('visibilitychange')
        document.dispatchEvent(event)

        // 应该是可见后立即触发一次执行
        await vi.advanceTimersByTimeAsync(0)
        expect(fn).toHaveBeenCalledTimes(1)

        polling.stop()
    })
})
