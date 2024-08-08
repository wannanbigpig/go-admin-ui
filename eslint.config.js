import globals from 'globals'
import pluginJs from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'

import { readFile } from 'node:fs/promises'

/**
 * 由于安装了autoimport 插件，所以，需要引入.eslintrc-auto-import.json 来完善eslint以免不必要的报错
 * 如果没有使用autoimport ，就不需要引入了
 * @description:
 * @return {*}
 */
const autoImportFile = new URL('./.eslintrc-auto-import.json', import.meta.url)
const autoImportGlobals = JSON.parse(await readFile(autoImportFile, 'utf8'))
export default [
  { files: ['**/*.{js,mjs,cjs,ts,vue,tsx}'] },
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...autoImportGlobals.globals,
      },
    },
  },
  pluginJs.configs.recommended,
  ...pluginVue.configs['flat/essential'],
  {
    languageOptions: {
      globals: { ...globals.browser, process: 'readonly', __filename: 'readonly', ElMessageBox: 'readonly', ElMessage: 'readonly' },
    },
  },
  {
    rules: {
      // eslint（https://eslint.bootcss.com/docs/rules/）
      'no-var': 'off', // 要求使用 let 或 const 而不是 var
      'no-multiple-empty-lines': ['off', { max: 1 }], // 不允许多个空行
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 生产环境不允许出现console语句
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off', // 生产环境不允许出现debugger语句
      'no-unexpected-multiline': 'off', // 禁止空余的多行
      'no-unused-vars': 'error', // 禁止出现未使用的变量
      'array-callback-return': 'error', // 禁止在条件语句中出现赋值语句
      'prefer-const': 'error', // 要求使用 const 声明那些声明后不再被修改的变量
      'for-direction': 'error', // 禁止在循环中赋值
      'no-dupe-else-if': 'warn', // switch语句中不允许出现重复的case标签
      'no-duplicate-imports': 'error', // 禁止重复导入
      'no-loss-of-precision': 'warn', // 禁止使用不必要的分号
      'no-const-assign': 'warn', // 不允许重新赋值
      'no-useless-escape': 'warn', // 禁止使用不必要的转义字符
      'no-cond-assign': 'error', //条件语句的条件中不允许出现赋值运算符
      'no-constant-condition': 'error', //条件语句的条件中不允许出现恒定不变的量
      'no-control-regex': 'error', //正则表达式中不允许出现控制字符
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

      // eslint-plugin-vue (https://eslint.vuejs.org/rules/)
      'vue/multi-word-component-names': 'off', // 要求组件名称始终为 “-” 链接的单词
      'vue/script-setup-uses-vars': 'off', // 防止<script setup>使用的变量<template>被标记为未使用
      'vue/no-mutating-props': 'off', // 不允许组件 prop的改变
      'vue/attribute-hyphenation': 'off', // 对模板中的自定义组件强制执行属性命名样式
    },
  },
]
