import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['e2e/**', 'node_modules/**'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            // 覆盖率门槛聚焦已有单元测试职责内的可复用逻辑；页面级覆盖由后续 E2E 单独衡量。
            include: [
                'src/composables/*.ts',
                'src/directives/permission.ts',
                'src/modules/shared/*.ts',
                'src/router/{componentMap,dynamicRoutes}.ts',
                'src/stores/{auth,notification}.ts',
                'src/utils/{apiCache,env,helper,iframe,logger,notificationAction,redirect,request}.ts',
            ],
            exclude: ['node_modules/', 'src/**/*.d.ts'],
            thresholds: {
                statements: 60,
                branches: 50,
                functions: 60,
                lines: 60,
            },
        },
        setupFiles: ['./src/test/setup.ts'],
    },
    resolve: {
        alias: {
            '@': resolve(import.meta.dirname, './src'),
        },
    },
})
