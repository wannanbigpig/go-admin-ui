import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate'

// ==================== 常量 ====================
const PERSISTED_STATE_KEY_PREFIX = '__persisted__'

// ==================== 创建 Pinia 实例 ====================
const pinia = createPinia()

pinia.use(
    createPersistedState({
        storage: localStorage,
        key: (id) => `${PERSISTED_STATE_KEY_PREFIX}${id}`,
    })
)

export default pinia
