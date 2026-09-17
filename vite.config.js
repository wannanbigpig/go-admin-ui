import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { existsSync, readFileSync, readdirSync } from 'fs'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'))
const elementPlusComponentsDir = resolve(import.meta.dirname, 'node_modules/element-plus/es/components')
const elementPlusStyleEntries = readdirSync(elementPlusComponentsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && existsSync(resolve(elementPlusComponentsDir, entry.name, 'style/css.mjs')))
    .map((entry) => `element-plus/es/components/${entry.name}/style/css`)

/** @param {string} id */
const manualChunks = (id) => {
    const moduleId = id.replaceAll('\\', '/')
    if (!moduleId.includes('/node_modules/')) return

    if (moduleId.includes('/echarts/lib/chart/')) return 'vendor-echarts-charts'
    if (moduleId.includes('/echarts/lib/component/')) return 'vendor-echarts-components'
    if (moduleId.includes('/node_modules/echarts/')) return 'vendor-echarts-core'
    if (moduleId.includes('/node_modules/zrender/')) return 'vendor-zrender'
    if (
        moduleId.includes('/node_modules/vue/') ||
        moduleId.includes('/node_modules/@vue/') ||
        moduleId.includes('/node_modules/vue-router/') ||
        moduleId.includes('/node_modules/vue-i18n/') ||
        moduleId.includes('/node_modules/pinia/') ||
        moduleId.includes('/node_modules/pinia-plugin-persistedstate/')
    ) {
        return 'vendor-vue'
    }
    if (moduleId.includes('/node_modules/axios/') || moduleId.includes('/node_modules/nprogress/')) {
        return 'vendor-network'
    }
}

// ==================== 常量定义 ====================
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '')
    /** 是否自动打开浏览器（从环境变量读取，默认为 true） */
    const autoOpenBrowser = env.AUTO_OPEN_BROWSER === 'true' || env.AUTO_OPEN_BROWSER === undefined

    /** Base 路径（用于 GitHub Pages 部署） */
    // 从环境变量读取，如果未设置则默认为 '/'
    // GitHub Pages 部署时，如果是仓库根目录，使用仓库名称；如果是自定义域名，使用 '/'
    // 注意：VITE_APP_BASE 用于页面 base 路径，VITE_BASE_URL 用于 API 地址（两者分开）
    const base = env.VITE_APP_BASE || '/'
    const proxyTarget = env.VITE_PROXY_TARGET || env.VITE_BASE_URL || 'http://127.0.0.1:9001'

    /** @returns {import('vite').ProxyOptions} */
    const createProxyConfig = () => ({
        target: proxyTarget,
        changeOrigin: true,
        ws: true,
        configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
                proxyReq.removeHeader('origin')
                proxyReq.removeHeader('referer')
            })
            // 注意：WS 升级请求保留 Origin，后端 upgrader.CheckOrigin 依赖此头做白名单校验，
            // 需要后端 config.yaml `cors_origins` 显式放行 http://127.0.0.1:3000 / http://localhost:3000。
        },
    })

    const proxy = {
        '/admin': createProxyConfig(),
        '/static': createProxyConfig(),
    }

    return {
        // ==================== Base 路径配置 ====================
        base,

        // ==================== 路径解析配置 ====================
        resolve: {
            alias: {
                '@': resolve(import.meta.dirname, './src'),
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
                    IconsResolver({}), // 自动导入图标组件
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
                        enabledCollections: ['ep', 'ant-design', 'lucide'], // 启用的图标集合
                        customCollections: ['custom'], // 自定义图标集合
                    }),
                ],
            }),

            // 图标插件
            Icons({
                compiler: 'vue3',
                autoInstall: false,
                customCollections: {
                    custom: FileSystemIconLoader('./src/assets/svg'), // 自定义 SVG 图标
                },
            }),

            // Element Plus 按需导入样式
            ElementPlus({}),

            // Gzip 压缩插件
            viteCompression({
                verbose: false,
                disable: false,
                threshold: 10240, // 超过 10KB 的文件进行压缩
                algorithm: 'gzip',
                ext: '.gz',
            }),
        ],

        // 预扫描全部懒加载页面，避免首次点击菜单时才发现 Element Plus 深层样式依赖并触发整页重载。
        optimizeDeps: {
            entries: ['index.html', 'src/{views,layout,components,modules}/**/*.vue'],
            include: elementPlusStyleEntries,
        },

        // ==================== 开发服务器配置 ====================
        server: {
            open: autoOpenBrowser ? '/' : false, // 自动打开浏览器
            host: '127.0.0.1',
            port: 3000,
            strictPort: false, // 如果端口被占用，自动尝试下一个可用端口
            proxy, // 代理配置
        },

        // ==================== 预览服务器配置 ====================
        // 解决打包后本地预览时 /admin 与 /static 请求被回退到 index.html 的问题
        preview: {
            host: '127.0.0.1',
            port: 4173,
            strictPort: false,
            proxy,
        },

        // ==================== 构建配置 ====================
        build: {
            rolldownOptions: {
                input: {
                    main: resolve(import.meta.dirname, './index.html'),
                },
                output: {
                    manualChunks,
                    minify: {
                        compress: {
                            dropConsole: mode === 'production',
                            dropDebugger: mode === 'production',
                        },
                    },
                },
            },
            outDir: 'dist',
        },

        // ==================== CSS 配置 ====================
        css: {
            preprocessorOptions: {
                scss: {
                    // 启用 Dart Sass modern compiler API（Vite 5.4+ 推荐），彻底消除 legacy-js-api 警告
                    api: 'modern-compiler',
                    // 全局注入 SCSS 变量和混入（仅纯定义，无 CSS 输出）
                    additionalData: `@use "@/assets/styles/shared.scss" as *;`,
                },
            },
        },

        define: {
            __APP_VERSION__: JSON.stringify(pkg.version),
        },

        // ==================== 公共资源目录 ====================
        publicDir: 'public',
    }
})
