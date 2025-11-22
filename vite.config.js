import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import eslintPlugin from 'vite-plugin-eslint'

// ==================== 常量定义 ====================
/** 是否自动打开浏览器（从环境变量读取，默认为 true） */
const AUTO_OPEN_BROWSER = process.env.AUTO_OPEN_BROWSER
const autoOpenBrowser = AUTO_OPEN_BROWSER === 'true' || AUTO_OPEN_BROWSER === undefined

/** Base 路径（用于 GitHub Pages 部署） */
// 从环境变量读取，如果未设置则默认为 '/'
// GitHub Pages 部署时，如果是仓库根目录，使用仓库名称；如果是自定义域名，使用 '/'
const base = process.env.VITE_BASE_URL || '/'

export default defineConfig({
    // ==================== Base 路径配置 ====================
    base,

    // ==================== 路径解析配置 ====================
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
            '~': resolve(__dirname, './node_modules'),
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
    },

    // ==================== 插件配置 ====================
    plugins: [
        // Vue 3 支持
        vue(),

        // 自动导入 API（Vue、Element Plus、图标等）
        AutoImport({
            imports: ['vue'],
            resolvers: [
                ElementPlusResolver(),
                IconsResolver(), // 自动导入图标组件
            ],
            eslintrc: {
                enabled: true,
                filepath: './.eslintrc-auto-import.json',
                globalsPropValue: true,
            },
        }),

        // 自动导入组件（Element Plus、图标等）
        Components({
            resolvers: [
                ElementPlusResolver(),
                IconsResolver({
                    enabledCollections: ['ep', 'ant-design'], // 启用的图标集合
                    customCollections: ['custom'], // 自定义图标集合
                }),
            ],
        }),

        // 图标插件
        Icons({
            compiler: 'vue3',
            autoInstall: true,
            customCollections: {
                custom: FileSystemIconLoader('./src/assets/svg'), // 自定义 SVG 图标
            },
        }),

        // Element Plus 按需导入样式
        ElementPlus(),

        // ESLint 插件
        eslintPlugin({
            cache: false, // 禁用缓存，确保每次都能检查到最新代码
        }),
    ],

    // ==================== 开发服务器配置 ====================
    server: {
        open: autoOpenBrowser ? '/' : false, // 自动打开浏览器
        host: '127.0.0.1',
        port: 3000,
        strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
        https: false,
        proxy: {}, // 代理配置
    },

    // ==================== 构建配置 ====================
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, './index.html'),
            },
        },
        outDir: 'dist',
    },

    // ==================== CSS 配置 ====================
    css: {
        preprocessorOptions: {
            scss: {
                // 全局注入 SCSS 变量和混入
                additionalData: `@import "@/assets/styles/global.scss";`,
            },
        },
    },

    // ==================== 公共资源目录 ====================
    publicDir: 'public',
})
