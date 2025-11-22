import { createApp } from 'vue'
import 'animate.css'
import '@/assets/styles/index.scss'
import App from './App.vue'
import pinia from '@/stores/index'
import router from './router'
import { Icon } from '@iconify/vue'
import permissionDirective from '@/directives/permission'
// import zhCn from "element-plus/es/locale/lang/zh-cn";
// import ElementPlus from "element-plus";
// import * as ElementPlusIconsVue from "@element-plus/icons-vue";
const app = createApp(App)

// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component);
// }
// app.use(ElementPlus, { locale: zhCn })
// 关闭所有警告提示

app.component('AppIcons', Icon)
// 注册权限指令
app.directive('permission', permissionDirective)
app.use(pinia).use(router).mount('#app')
