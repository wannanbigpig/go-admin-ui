import { Logger } from '@/utils/logger'

export function useClipboard() {
    const copyText = async (text: string) => {
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(text)
                return true
            } catch (error) {
                Logger.error('使用 Clipboard API 复制失败:', error)
            }
        }

        // Fallback: 传统 execCommand 兜底
        const textarea = document.createElement('textarea')
        try {
            textarea.value = text
            textarea.style.position = 'fixed'
            textarea.style.top = '0'
            textarea.style.left = '0'
            textarea.style.width = '2em'
            textarea.style.height = '2em'
            textarea.style.padding = '0'
            textarea.style.border = 'none'
            textarea.style.outline = 'none'
            textarea.style.boxShadow = 'none'
            textarea.style.background = 'transparent'
            document.body.appendChild(textarea)
            textarea.focus()
            textarea.select()
            const success = document.execCommand('copy')
            if (success) {
                return true
            }
            Logger.error('execCommand 复制指令返回失败')
            return false
        } catch (fallbackError) {
            Logger.error('Fallback 复制失败:', fallbackError)
            return false
        } finally {
            textarea.remove()
        }
    }

    return {
        copyText,
    }
}
