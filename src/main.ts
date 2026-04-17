import { createApp, type ComponentPublicInstance } from 'vue'
import 'animate.css'
import '@/assets/styles/index.scss'
import App from './App.vue'
import pinia from '@/stores/index'
import router from './router'
import { Icon } from '@iconify/vue'
import permissionDirective from '@/directives/permission'

const app = createApp(App)

// 注册全局错误处理
app.config.errorHandler = (err: unknown, vm: ComponentPublicInstance | null, info: string) => {
    console.error('【全局错误拦截】:', err)
    console.error('【错误组件】:', vm)
    console.error('【错误信息】:', info)
}

app.component('AppIcons', Icon)
// 注册权限指令
app.directive('permission', permissionDirective)
app.use(pinia).use(router).mount('#app')
