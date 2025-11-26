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

    // 检查decimal是否合法
    if (decimal < 0) {
        return false
    }

    // 转换为字符串以便检查小数位数
    const valueStr = numValue.toString()

    // 当decimal为0时，直接检查是否含有小数点
    if (decimal === 0) {
        return !valueStr.includes('.')
    }

    // 检查小数点后是否有超过允许的小数位数
    const decimalPart = valueStr.split('.')[1]
    if (decimalPart && decimalPart.length > decimal) {
        return false // 如果小数位数超过了允许的最大值
    }

    // 如果上述检查都通过，则数值满足条件
    return true
}

/**
 * 从对象中提取指定的属性，创建一个新对象
 * @param {Object} obj - 源对象
 * @param {string[]} keys - 需要提取的属性名数组
 * @returns {Object} 包含指定属性的新对象
 *
 * @example
 * pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])
 * // 返回: { a: 1, c: 3 }
 */
export function pick(obj, keys) {
    const result = {}
    keys.forEach((key) => {
        if (key in obj) {
            result[key] = obj[key]
        }
    })
    return result
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
 * 判断路径是否为外部链接
 * 检查路径是否以 http:// 或 https:// 开头
 *
 * @param {string} path - 需要检查的路径
 * @returns {boolean} 如果是外部链接返回 true，否则返回 false
 *
 * @example
 * isExternal('https://example.com') // true
 * isExternal('/home') // false
 */
export function isExternal(path) {
    return /^(https?:|http?:)/.test(path)
}

/**
 * 判断是否为空
 *
 * @param {object} value
 * @returns {boolean}
 */
export function isEmpty(value) {
    // 处理 Vue 的 Ref 对象（如 ref([])）
    if (value?.__v_isRef) value = value.value

    // 基础类型快速判断
    if (value == null) return true
    switch (typeof value) {
        case 'boolean':
            return !value
        case 'number':
            return value === 0
        case 'string':
            return value.trim() === ''
    }

    // 集合类型（Map/Set/Array）
    if (value instanceof Map || value instanceof Set) return value.size === 0
    if (Array.isArray(value)) return value.length === 0

    // 普通对象（包含 Symbol 属性的判断）
    if (typeof value === 'object') {
        return Reflect.ownKeys(value).length === 0 // 合并普通属性和 Symbol 属性检查
    }

    // 其他类型（如函数、Symbol 等）默认非空
    return false
}

/**
 * 过滤对象中的 null 和 undefined 值
 * 创建一个新对象，只包含非 null 和非 undefined 的属性
 *
 * @param {Object} obj - 源对象
 * @returns {Object} 过滤后的新对象
 *
 * @example
 * filterNullUndefined({ a: 1, b: null, c: undefined, d: 'test' })
 * // 返回: { a: 1, d: 'test' }
 */
export function filterNullUndefined(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== null && value !== undefined))
}

/**
 * 防重复执行函数
 *
 * 假设有一个用户输入搜索的场景，我们希望用户停止输入后的300毫秒才执行搜索请求，可以使用这个防抖函数来减少不必要的请求。
 * 在用户停止输入的300毫秒后，search 函数才会被调用。如果在300毫秒内用户又输入了新的内容，则会重新计时，最终只会执行最后一次有效的搜索操作。
 *
 * @param {Function} fn
 * @param {Number} delay
 * @returns
 */
export function debounce(fn, delay) {
    let timer
    return function (...args) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
            fn.apply(this, args)
        }, delay)
    }
}

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss 格式
 *
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @returns {string} 格式化后的日期字符串，格式为 YYYY-MM-DD HH:mm:ss
 *
 * @example
 * formatDate(new Date())
 * // 返回: '2024-01-01 12:00:00'
 */
export function formatDate(date) {
    const dateObj = date instanceof Date ? date : new Date(date)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0') // 月份从 0 开始，需要 +1
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const seconds = String(dateObj.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 将多层级树形数据扁平化为选项数组
 *
 * 该函数用于将树形结构的数据（如部门、菜单等）转换为扁平化的选项数组，
 * 每个选项包含 label 和 value，label 会保留层级关系（使用 / 分隔符）。
 *
 * @param {Array} tree - 树形数据数组，每个节点应包含 id、name 和 children 属性
 * @param {string} prefix - 前缀字符串，用于构建层级路径，默认为空字符串
 * @param {Object} options - 配置选项
 * @param {string} options.idKey - ID字段名，默认为 'id'
 * @param {string} options.nameKey - 名称字段名，默认为 'name'
 * @param {string} options.childrenKey - 子节点字段名，默认为 'children'
 * @param {string} options.separator - 层级分隔符，默认为 ' / '
 * @returns {Array} 扁平化的选项数组，每个选项包含 { label, value }
 *
 * @example
 * const tree = [
 *   { id: 1, name: '技术部', children: [
 *     { id: 2, name: '前端组', children: [] }
 *   ]}
 * ]
 * flattenTree(tree)
 * // 返回: [
 * //   { label: '技术部', value: 1 },
 * //   { label: '技术部 / 前端组', value: 2 }
 * // ]
 */
export function flattenTree(tree, prefix = '', options = {}) {
    const { idKey = 'id', nameKey = 'name', childrenKey = 'children', separator = ' / ' } = options

    const result = []
    tree.forEach((item) => {
        const label = prefix ? `${prefix}${separator}${item[nameKey]}` : item[nameKey]
        result.push({
            label,
            value: item[idKey],
        })
        if (item[childrenKey] && item[childrenKey].length > 0) {
            result.push(...flattenTree(item[childrenKey], label, options))
        }
    })
    return result
}

/**
 * 获取图片 URL
 * 如果值是 http 开头的，直接返回；否则拼接域名 + /admin/v1/file/ + uuid
 *
 * @param {string} value - 图片的 uuid 或完整 URL
 * @returns {string} 完整的图片 URL
 *
 * @example
 * getImageUrl('cdae4c9654d34e938052ef48c29345d0')
 * // 返回: 'http://127.0.0.1:9001/admin/v1/file/cdae4c9654d34e938052ef48c29345d0'
 *
 * @example
 * getImageUrl('http://example.com/image.jpg')
 * // 返回: 'http://example.com/image.jpg'
 */
export function getImageUrl(value) {
    if (!value) return ''

    // 如果已经是 http 或 https 开头，直接返回
    if (typeof value === 'string' && /^https?:\/\//.test(value)) {
        return value
    }

    // 否则拼接域名 + /admin/v1/file/ + uuid
    const { VITE_BASE_URL } = import.meta.env
    return `${VITE_BASE_URL}/admin/v1/file/${value}`
}
