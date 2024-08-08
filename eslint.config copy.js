import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

export default [
  {
    ignores: ['**/*.config.js', '!**/eslint.config.js', '!**/vite.config.js', 'node_modules/*'],
  },
  {
    files: ['**/*.{js,mjs,cjs,vue}'],
    rules: {
      'array-callback-return': 'error',
      'prefer-const': 'error',
      'for-direction': 'error',
      'no-dupe-else-if': 'warn',
      'no-duplicate-imports': 'error',
      'no-loss-of-precision': 'warn',
      'no-const-assign': 'warn',
      'no-useless-escape': 'warn',
      'no-cond-assign': 'error', //条件语句的条件中不允许出现赋值运算符
      'no-console': 'error', //不允许出现console语句
      'no-constant-condition': 'error', //条件语句的条件中不允许出现恒定不变的量
      'no-control-regex': 'error', //正则表达式中不允许出现控制字符
      'no-debugger': 'error', //不允许出现debugger语句
      'no-dupe-args': 'error', //函数定义的时候不允许出现重复的参数
      'no-dupe-keys': 'error', //对象中不允许出现重复的键
      'no-duplicate-case': 'error', //switch语句中不允许出现重复的case标签
      'no-empty': 'error', //不允许出现空的代码块
      'no-empty-character-class': 'error', //正则表达式中不允许出现空的字符组
      'no-ex-assign': 'error', //在try catch语句中不允许重新分配异常变量
      'no-extra-boolean-cast': 'error', //不允许出现不必要的布尔值转换
      'no-func-assign': 'error', //不允许重新分配函数声明
      'no-inner-declarations': ['error', 'functions'], //不允许在嵌套代码块里声明函数
      'no-invalid-regexp': 'error', //不允许在RegExp构造函数里出现无效的正则表达式
      'no-irregular-whitespace': 'error', //不允许出现不规则的空格
      'no-negated-in-lhs': 'error', //不允许在in表达式语句中对最左边的运算数使用取反操作
      'no-obj-calls': 'error', //不允许把全局对象属性当做函数来调用
      'no-regex-spaces': 'error', //正则表达式中不允许出现多个连续空格
      'no-sparse-arrays': 'error', //数组中不允许出现空位置
      'no-unreachable': 'error', //在return，throw，continue，break语句后不允许出现不可能到达的语句
      'use-isnan': 'error', //要求检查NaN的时候使用isNaN()
      'no-multi-str': 'error', // 禁止使用多行字符串
      'no-self-assign': 'error', // 禁止自我赋值
      'no-self-compare': 'error', // 禁止自身比较
      'no-unmodified-loop-condition': 'error', // 禁用一成不变的循环条件
      'no-unused-expressions': 'warn', // 禁止出现未使用的表达式
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, process: 'readonly', __filename: 'readonly' },
    },
  },
  pluginJs.configs.recommended,
  ...pluginVue.configs['flat/essential'],
]
