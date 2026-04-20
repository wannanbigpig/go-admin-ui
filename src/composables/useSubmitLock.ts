import { ref } from 'vue'
import { DEFAULT_SUBMIT_DELAY } from '@/modules/shared/constants'

const sleep = (duration: number) => new Promise<void>((resolve) => setTimeout(resolve, duration))

/**
 * 提交互斥锁，避免重复提交，并保证最短锁定时长。
 *
 * @param defaultDuration 默认锁定时长（毫秒）
 * @returns 提交状态与带锁执行方法
 */
export function useSubmitLock(defaultDuration = DEFAULT_SUBMIT_DELAY) {
    const isSubmitting = ref(false)

    const runWithSubmitLock = async <T>(task: () => Promise<T>, duration = defaultDuration): Promise<T | undefined> => {
        if (isSubmitting.value) return undefined

        isSubmitting.value = true
        const startTime = Date.now()

        try {
            return await task()
        } finally {
            const elapsed = Date.now() - startTime
            const remaining = duration - elapsed
            if (remaining > 0) {
                await sleep(remaining)
            }
            isSubmitting.value = false
        }
    }

    return {
        isSubmitting,
        runWithSubmitLock,
    }
}
