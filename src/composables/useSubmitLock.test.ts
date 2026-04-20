import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSubmitLock } from '@/composables/useSubmitLock'

describe('composables/useSubmitLock.ts', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('应在任务执行期间设置提交锁并在结束后释放', async () => {
        const { isSubmitting, runWithSubmitLock } = useSubmitLock(100)

        const task = vi.fn(async () => 'ok')
        const promise = runWithSubmitLock(task)

        expect(isSubmitting.value).toBe(true)

        await vi.advanceTimersByTimeAsync(100)
        await expect(promise).resolves.toBe('ok')
        expect(task).toHaveBeenCalledTimes(1)
        expect(isSubmitting.value).toBe(false)
    })

    it('已加锁时应忽略新的提交请求', async () => {
        const { isSubmitting, runWithSubmitLock } = useSubmitLock(50)

        let resolveFirst!: (value: string) => void
        const firstPromise = runWithSubmitLock(
            () =>
                new Promise<string>((resolve) => {
                    resolveFirst = resolve
                })
        )

        expect(isSubmitting.value).toBe(true)

        const secondResult = await runWithSubmitLock(async () => 'second')
        expect(secondResult).toBeUndefined()

        resolveFirst('first')
        await vi.advanceTimersByTimeAsync(50)
        await expect(firstPromise).resolves.toBe('first')
        expect(isSubmitting.value).toBe(false)
    })

    it('任务执行过快时应补足最短锁定时长', async () => {
        const { runWithSubmitLock } = useSubmitLock(80)

        const settled = vi.fn()
        const promise = runWithSubmitLock(async () => 'done')
        promise.then(settled)

        await vi.advanceTimersByTimeAsync(79)
        expect(settled).not.toHaveBeenCalled()

        await vi.advanceTimersByTimeAsync(1)
        await expect(promise).resolves.toBe('done')
        expect(settled).toHaveBeenCalledTimes(1)
    })

    it('任务抛错后也应在锁定时长结束后释放', async () => {
        const { isSubmitting, runWithSubmitLock } = useSubmitLock(60)

        const promise = runWithSubmitLock(async () => {
            throw new Error('submit failed')
        })
        const rejected = expect(promise).rejects.toThrowError('submit failed')

        expect(isSubmitting.value).toBe(true)

        await vi.advanceTimersByTimeAsync(60)
        await rejected
        expect(isSubmitting.value).toBe(false)
    })
})
