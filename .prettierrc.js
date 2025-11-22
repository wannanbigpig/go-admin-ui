/**
 * Prettier 代码格式化配置
 * 参考：https://prettier.io/docs/en/options.html
 */
export default {
  // 每行最大字符数
  printWidth: 220,
  // 每个缩进级别的空格数
  tabWidth: 4,
  // 使用空格而不是制表符
  useTabs: false,
  // 行尾不使用分号
  semi: false,
  // 使用单引号
  singleQuote: true,
  // 对象属性添加空格 { foo: bar }
  bracketSpacing: true,
  // 尾随逗号（ES5 兼容）
  trailingComma: 'es5',
  // 仅在需要时引用对象属性
  quoteProps: 'as-needed',
  // 箭头函数参数始终使用括号
  arrowParens: 'always',
  // 使用 LF 作为行尾序列
  endOfLine: 'lf',
  // 忽略文件路径配置
  ignorePath: '.prettierignore',
}
