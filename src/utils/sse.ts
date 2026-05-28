import { useAuthStore } from '@/stores/auth'
import { useSettingStore } from '@/stores/setting'
import { DEFAULT_LOCALE } from '@/locales'
import { Logger } from '@/utils/logger'
import { resolveBaseURL } from '@/utils/env'

export interface SSEHandlers<TComplete = unknown, TProgress = unknown> {
    onStart?: (data: { total?: number }) => void
    onProgress?: (data: TProgress) => void
    onComplete?: (data: TComplete) => void
    onError?: (data: { message?: string }) => void
}

/**
 * 以 SSE (Server-Sent Events) 方式发送 POST 请求并消费事件流。
 *
 * 后端需识别 `?stream=1` 或 `Accept: text/event-stream`，按以下顺序推送事件：
 *  - event: start    -> 初始化（含 total）
 *  - event: progress -> 每完成一项推送一次
 *  - event: complete -> 全部完成，携带完整结果
 *  - event: error    -> 处理过程中出错
 */
/**
 * 内部实际执行 SSE 请求的函数
 */
async function runPostSSE<TComplete = unknown, TProgress = unknown>(url: string, payload: unknown, handlers: SSEHandlers<TComplete, TProgress>, options: { signal?: AbortSignal } = {}): Promise<TComplete | undefined> {
    const authStore = useAuthStore()
    const settingStore = useSettingStore()
    const baseURL = resolveBaseURL()
    const separator = url.includes('?') ? '&' : '?'
    const fullURL = `${baseURL}${url}${separator}stream=1`

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        'Accept-Language': settingStore.locale || DEFAULT_LOCALE,
    }
    if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`
    }

    const response = await fetch(fullURL, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: options.signal,
    })

    if (response.status === 401) {
        authStore.handleTokenExpired()
        throw new Error('Unauthorized')
    }

    if (!response.ok || !response.body) {
        throw new Error(`SSE request failed: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    let completed: TComplete | undefined

    try {
        while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })

            let separatorIndex = buffer.indexOf('\n\n')
            while (separatorIndex >= 0) {
                const block = buffer.slice(0, separatorIndex)
                buffer = buffer.slice(separatorIndex + 2)
                separatorIndex = buffer.indexOf('\n\n')

                let eventName = 'message'
                const dataLines: string[] = []
                for (const rawLine of block.split('\n')) {
                    const line = rawLine.replace(/\r$/, '')
                    if (!line) continue
                    if (line.startsWith('event:')) {
                        eventName = line.slice(6).trim()
                    } else if (line.startsWith('data:')) {
                        dataLines.push(line.slice(5).trimStart())
                    }
                }
                if (dataLines.length === 0) continue

                let parsed: unknown
                try {
                    parsed = JSON.parse(dataLines.join('\n'))
                } catch (err) {
                    Logger.warn('SSE 解析失败:', err)
                    continue
                }

                switch (eventName) {
                    case 'start':
                        handlers.onStart?.(parsed as { total?: number })
                        break
                    case 'progress':
                        handlers.onProgress?.(parsed as TProgress)
                        break
                    case 'complete':
                        completed = parsed as TComplete
                        handlers.onComplete?.(completed)
                        break
                    case 'error':
                        handlers.onError?.(parsed as { message?: string })
                        throw new Error((parsed as { message?: string })?.message || 'SSE error')
                }
            }
        }
    } finally {
        try {
            await reader.cancel()
        } catch {
            // 忽略正常读完导致的 cancel 报错
        }
        reader.releaseLock()
    }

    return completed
}

/**
 * 以 SSE (Server-Sent Events) 方式发送 POST 请求并消费事件流。
 *
 * 后端需识别 `?stream=1` 或 `Accept: text/event-stream`，并推送特定生命周期事件。
 * 具备指数退避重试（最多3次），支持 AbortSignal 中止。
 */
export async function postSSE<TComplete = unknown, TProgress = unknown>(
    url: string,
    payload: unknown,
    handlers: SSEHandlers<TComplete, TProgress>,
    options: { signal?: AbortSignal } = {}
): Promise<TComplete | undefined> {
    const maxRetries = 3
    let attempt = 0
    let delay = 1000

    while (true) {
        try {
            return await runPostSSE<TComplete, TProgress>(url, payload, handlers, options)
        } catch (error) {
            attempt++
            if (attempt > maxRetries || (error instanceof Error && error.message === 'Unauthorized') || options.signal?.aborted) {
                throw error
            }
            Logger.warn(`SSE 请求失败，正在进行第 ${attempt}/${maxRetries} 次重试，将在 ${delay}ms 后开始...`, error)

            // 指数退避等待，并支持即时 AbortSignal 中止
            await new Promise<void>((resolve, reject) => {
                const timer = setTimeout(resolve, delay)
                if (options.signal) {
                    const onAbort = () => {
                        clearTimeout(timer)
                        reject(new Error('Aborted'))
                    }
                    options.signal.addEventListener('abort', onAbort, { once: true })
                }
            })
            delay *= 2
        }
    }
}

export interface UploadBatchProgress {
    index: number
    total: number
    completed: number
    success: number
    failed: number
    client_id?: string
}
