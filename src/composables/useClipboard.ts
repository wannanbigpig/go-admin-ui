import { Logger } from '@/utils/logger'

export function useClipboard() {
    const copyText = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text)
            return true
        } catch (error) {
            Logger.error('复制失败:', error)
            return false
        }
    }

    return {
        copyText,
    }
}
