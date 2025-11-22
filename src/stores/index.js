import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

// ==================== 常量 ====================
const PERSISTED_STATE_KEY_PREFIX = '__persisted__'

// ==================== 创建 Pinia 实例 ====================
/**
 * Pinia 状态管理实例
 * 配置了持久化插件，使用 localStorage 存储
 */
const pinia = createPinia()

pinia.use(
  createPersistedState({
    storage: localStorage,
    key: (id) => `${PERSISTED_STATE_KEY_PREFIX}${id}`,
  })
)

// ==================== 导出 ====================
export default pinia
