/**
 * 检查输入的数值是否符合指定的小数位数和正负性要求。
 *
 * @param {number|string} value - 需要检查的数值。
 * @param {number} [decimal=2] - 允许的小数位数，默认为2。
 * @param {boolean} [negative=false] - 是否允许负数，默认不允许。
 * @returns {boolean} - 如果数值满足条件则返回true，否则返回false。
 */
export function checkNumber(value, decimal = 2, negative = false) {
  // 确保value可以转换为数值
  const numValue = Number(value)
  if (isNaN(numValue)) {
    return false // 如果转换失败，说明不是有效数字
  }

  // 检查是否允许负数
  if (!negative && numValue < 0) {
    return false // 如果不允许负数但传入的是负数
  }
  // 当decimal为0时，直接检查是否含有小数点
  if (decimal === 0) {
    if (value.includes('.')) {
      return false // 如果decimal为0且输入包含小数点，返回false
    } else {
      return true // 如果没有小数点且decimal为0，直接返回true，跳过后续检查
    }
  }
  // 转换为字符串以便检查小数位数
  const valueStr = numValue.toString()

  // 检查小数点后是否有超过允许的小数位数
  const decimalPart = valueStr.split('.')[1]
  if (decimalPart && decimalPart.length > decimal) {
    return false // 如果小数位数超过了允许的最大值
  }

  // 如果上述检查都通过，则数值满足条件
  return true
}
/**
 * 异步函数：暂停指定时长
 *
 * 该函数通过异步方式实现程序的暂停，使用Promise配合setTimeout实现。
 * 这种方式不同于传统的同步延迟，因为它不会阻塞代码的执行，而是允许其他代码
 * 在等待期间继续执行。这在异步编程中非常有用，可以用来控制异步操作的顺序
 * 或者在某些操作之间插入延迟。
 *
 * @param {number} duration - 暂停的时长，以毫秒为单位。默认值为2000毫秒（2秒）。
 */
export async function pauseSync(duration = 2000) {
  await new Promise((resolve) => setTimeout(resolve, duration))
}

/**
 * 生成一个随机字符串。
 *
 * 该函数用于生成一个由数字和大小写字母组成的16位随机字符串。此字符串可用于作为唯一标识符或作为密码的组成部分。
 *
 * @returns {string} 一个16位的随机字符串，包含数字和大小写字母。
 */
export function randomStr(length = 16) {
  // 定义包含所有可能字符的字符串
  const str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let result = ''
  // 循环16次，每次从str中随机选择一个字符并添加到result中
  for (let i = 0; i < length; i++) {
    result += str[Math.floor(Math.random() * str.length)]
  }
  return result
}

/**
 * 判断是否外链
 *
 * @param {string} path
 * @returns
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * 判断是否为空
 *
 * @param {object} value
 * @returns {boolean}
 */
export function isEmpty(value) {
  // 处理 null 和 undefined
  if (value == null) return true

  // 处理布尔值
  if (typeof value === 'boolean') return !value

  // 处理数字 (0 为 false, 其他数字为 true)
  if (typeof value === 'number') return value === 0

  // 处理字符串 (空字符串为 true)
  if (typeof value === 'string') return value.trim().length === 0

  // 处理数组 (空数组为 true)
  if (Array.isArray(value)) return value.length === 0

  // 处理 Map 和 Set (空为 true)
  if (value instanceof Map || value instanceof Set) return value.size === 0

  // 处理普通对象 (没有可枚举属性和 Symbol 属性为 true)
  if (typeof value === 'object') {
    return Object.keys(value).length === 0 && Object.getOwnPropertySymbols(value).length === 0
  }

  // 对于所有其他类型，默认返回 false
  return false
}
