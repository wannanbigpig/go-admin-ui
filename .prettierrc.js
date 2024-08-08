export default {
  printWidth: 220,
  tableWidth: 4, // 每个缩进级别的空格数
  tabs: false,
  semi: false, // 行尾是否要分号
  singleQuote: true, // 是否使用单引号
  bracketSpacing: true, // 是否在对象属性添加空格
  trailingComma: 'es5',
  quoteProps: 'as-needed',
  arrowParens: 'always',
  endOfLine: 'lf',
  eslintIntegration: true,
  ignorePath: '.prettierignore', // 不使用prettier格式化的文件填写在项目的.prettierignore文件中
}
