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

// 是否自动开启浏览器
const AUTO_OPEN_BROWESR = process.env.AUTO_OPEN_BROWESR
const autoOpenBrowser = AUTO_OPEN_BROWESR === 'true' || AUTO_OPEN_BROWESR === undefined
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '~': resolve(__dirname, './node_modules'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  plugins: [
    vue(),
    AutoImport({
      imports: ['vue'],
      resolvers: [
        ElementPlusResolver(),
        // 自动导入图标组件
        IconsResolver(),
      ],
      eslintrc: {
        enabled: true, // Default `false`
        filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
        globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      },
    }),
    Components({
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          enabledCollections: ['ep', 'ant-design'],
          customCollections: ['custom'],
        }),
      ],
    }),
    Icons({
      compiler: 'vue3', // 指定编译器
      autoInstall: true,
      customCollections: {
        custom: FileSystemIconLoader('./src/assets/svg'),
      },
    }),
    ElementPlus({
      // options,
    }),
    eslintPlugin({
      // 配置选项
      cache: false, // 禁用缓存
    }),
  ],
  publicDir: 'public',
  lintOnSave: true,
  server: {
    open: autoOpenBrowser ? '/' : '',
    host: '127.0.0.1',
    port: 3000,
    strictPort: false,
    https: false, // 开启https
    proxy: {},
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, './index.html'),
      },
    },
    outDir: 'dist',
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/global.scss";`, // 添加全局样式
      },
    },
  },
})
