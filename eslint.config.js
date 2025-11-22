import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import { readFile } from 'node:fs/promises'

// ==================== 自动导入全局变量 ====================
/**
 * 读取 auto-import 插件生成的全局变量配置
 * 由于安装了 unplugin-auto-import 插件，需要引入 .eslintrc-auto-import.json
 * 来完善 ESLint 配置，避免不必要的报错
 */
const autoImportFile = new URL('./.eslintrc-auto-import.json', import.meta.url)
const autoImportGlobals = JSON.parse(await readFile(autoImportFile, 'utf8'))

// ==================== ESLint 配置 ====================
export default [
  // 指定需要检查的文件类型
  { files: ['**/*.{js,mjs,cjs,ts,vue,tsx}'] },

  // 语言选项配置
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...autoImportGlobals.globals, // 自动导入的全局变量
      },
    },
  },

  // 使用推荐的 JavaScript 规则
  pluginJs.configs.recommended,

  // 使用 Vue 3 基础规则
  ...pluginVue.configs['flat/essential'],

  // 额外的全局变量
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        process: 'readonly',
        __filename: 'readonly',
        ElMessageBox: 'readonly',
        ElMessage: 'readonly',
      },
    },
  },
  // ==================== 自定义规则 ====================
  {
    rules: {
      // ==================== ESLint 基础规则 ====================
      // 参考：https://eslint.org/docs/latest/rules/

      // 变量和声明
      'no-var': 'off', // 允许使用 var（项目可能需要兼容性）
      'prefer-const': 'error', // 要求使用 const 声明那些声明后不再被修改的变量
      'no-const-assign': 'warn', // 不允许重新赋值 const 变量
      'no-unused-vars': 'error', // 禁止出现未使用的变量

      // 代码质量
      // 生产环境禁止 console.log，但允许 console.error 和 console.warn（用于错误日志）
      'no-console': process.env.NODE_ENV === 'production' 
        ? ['error', { allow: ['warn', 'error'] }] 
        : 'off',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 生产环境禁止 debugger
      'no-unused-expressions': 'warn', // 禁止出现未使用的表达式
      'no-unreachable': 'error', // 禁止在 return、throw、continue、break 后出现不可达代码

      // 导入和导出
      'no-duplicate-imports': 'error', // 禁止重复导入

      // 代码风格
      'no-multiple-empty-lines': ['off', { max: 1 }], // 允许多个空行（由 Prettier 控制）
      'no-multi-str': 'error', // 禁止使用多行字符串

      // 逻辑错误
      'no-cond-assign': 'error', // 禁止在条件语句中使用赋值运算符
      'no-constant-condition': 'error', // 禁止在条件语句中使用常量
      'no-dupe-else-if': 'warn', // 禁止重复的 else-if 条件
      'no-dupe-args': 'error', // 禁止函数参数重复
      'no-dupe-keys': 'error', // 禁止对象键重复
      'no-duplicate-case': 'error', // 禁止 switch 语句中重复的 case 标签
      'no-empty': 'error', // 禁止空代码块
      'no-self-assign': 'error', // 禁止自我赋值
      'no-self-compare': 'error', // 禁止自身比较
      'no-unmodified-loop-condition': 'error', // 禁止一成不变的循环条件

      // 正则表达式
      'no-control-regex': 'error', // 禁止在正则表达式中使用控制字符
      'no-empty-character-class': 'error', // 禁止正则表达式中出现空的字符组
      'no-invalid-regexp': 'error', // 禁止在 RegExp 构造函数中使用无效的正则表达式
      'no-regex-spaces': 'error', // 禁止正则表达式中出现多个连续空格
      'no-useless-escape': 'warn', // 禁止不必要的转义字符

      // 其他
      'no-unexpected-multiline': 'off', // 关闭（可能与 Prettier 冲突）
      'array-callback-return': 'error', // 要求数组回调函数有返回值
      'for-direction': 'error', // 禁止 for 循环方向错误
      'no-loss-of-precision': 'warn', // 禁止精度丢失
      'no-negated-in-lhs': 'error', // 禁止在 in 表达式中对左侧运算数使用取反
      'no-obj-calls': 'error', // 禁止将全局对象属性当作函数调用
      'no-sparse-arrays': 'error', // 禁止稀疏数组
      'no-ex-assign': 'error', // 禁止在 try-catch 中重新分配异常变量
      'no-extra-boolean-cast': 'error', // 禁止不必要的布尔值转换
      'no-func-assign': 'error', // 禁止重新分配函数声明
      'no-inner-declarations': ['error', 'functions'], // 禁止在嵌套代码块中声明函数
      'no-irregular-whitespace': 'error', // 禁止不规则的空格
      'use-isnan': 'error', // 要求使用 isNaN() 检查 NaN

      // ==================== Vue 插件规则 ====================
      // 参考：https://eslint.vuejs.org/rules/

      'vue/multi-word-component-names': 'off', // 允许单单词组件名
      'vue/script-setup-uses-vars': 'off', // 关闭（已由 auto-import 处理）
      'vue/no-mutating-props': 'off', // 允许修改 props（某些场景需要）
      'vue/attribute-hyphenation': 'off', // 允许使用驼峰属性名
    },
  },
]
