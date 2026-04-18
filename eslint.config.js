import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'
import { readFile } from 'node:fs/promises'

// ==================== 自动导入全局变量 ====================
const autoImportFile = new URL('./.eslintrc-auto-import.json', import.meta.url)
const autoImportGlobals = JSON.parse(await readFile(autoImportFile, 'utf8'))

// ==================== ESLint 配置 ====================
export default tseslint.config(
    // 1. 指定需要检查的文件类型
    {
        files: ['**/*.{js,mjs,cjs,ts,vue,tsx}'],
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
                ...autoImportGlobals.globals,
                process: 'readonly',
                __filename: 'readonly',
                ElMessageBox: 'readonly',
                ElMessage: 'readonly',
            },
        },
    },

    // 2. 忽略目录
    {
        ignores: ['dist/**', 'node_modules/**', '.vite/**', 'public/**'],
    },

    // 3. JavaScript 推荐规则
    pluginJs.configs.recommended,

    // 4. TypeScript 推荐规则
    ...tseslint.configs.recommended,

    // 5. Vue 3 推荐规则
    ...pluginVue.configs['flat/essential'],

    // 6. 覆盖 Vue 文件的解析器，使其支持 TS
    {
        files: ['**/*.vue'],
        languageOptions: {
            parserOptions: {
                parser: tseslint.parser,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
    },

    // 7. 自定义业务规则
    {
        rules: {
            // 禁用原生的未使用的变量检查，使用 TS 版本的（避免误报）
            'no-unused-vars': 'off',
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

            // 允许显式使用 any（在迁移初期可以适当放宽，后续再收紧）
            '@typescript-eslint/no-explicit-any': 'warn',

            // 允许非空断言（看项目习惯）
            '@typescript-eslint/no-non-null-assertion': 'off',

            // 允许空函数
            '@typescript-eslint/no-empty-function': 'warn',

            // 禁止使用 var
            'no-var': 'error',

            // 常规规则
            'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
            'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
            'prefer-const': 'error',
            'no-duplicate-imports': 'error',

            // Vue 规则
            'vue/multi-word-component-names': 'off',
            'vue/no-mutating-props': 'error',
            'vue/attribute-hyphenation': 'off',
        },
    }
)
