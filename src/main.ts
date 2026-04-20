import { createApp, type ComponentPublicInstance } from 'vue'
import 'animate.css'
import '@/assets/styles/index.scss'
import App from './App.vue'
import pinia from '@/stores/index'
import router from './router'
import { Icon } from '@iconify/vue'
import permissionDirective from '@/directives/permission'
import { Logger, setupGlobalErrorHandlers } from '@/utils/logger'

const app = createApp(App)

// 注册全局错误处理
app.config.errorHandler = (err: unknown, vm: ComponentPublicInstance | null, info: string) => {
    Logger.error('[全局错误拦截]:', err)
    Logger.error('[错误组件]:', vm)
    Logger.error('[错误信息]:', info)
}

// 设置全局错误处理器
setupGlobalErrorHandlers()

app.component('AppIcons', Icon)
// 注册权限指令
app.directive('permission', permissionDirective)
app.use(pinia).use(router).mount('#app')
