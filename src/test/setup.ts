// Vitest 测试环境设置
import { vi, afterEach } from 'vitest'

// 清理 mock
afterEach(() => {
    vi.clearAllMocks()
})
