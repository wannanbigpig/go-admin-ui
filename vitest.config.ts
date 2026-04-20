import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue()],
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        coverage: {
            reporter: ['text', 'json', 'html'],
            exclude: ['node_modules/', 'src/**/*.d.ts'],
        },
        setupFiles: ['./src/test/setup.ts'],
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, './src'),
        },
    },
})
