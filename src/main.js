import { createApp } from 'vue'
import 'animate.css'
import '@/assets/styles/index.scss'
import App from './App.vue'
import pinia from '@/stores/index'
import router from './router'
import { Icon } from '@iconify/vue'
// import zhCn from "element-plus/es/locale/lang/zh-cn";
// import ElementPlus from "element-plus";
// import * as ElementPlusIconsVue from "@element-plus/icons-vue";
const app = createApp(App)

// for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
//   app.component(key, component);
// }
// app.use(ElementPlus, { locale: zhCn })
app.component('AppIcons', Icon)
app.use(pinia).use(router).mount('#app')
