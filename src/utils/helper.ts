/**
 * 检查输入的数值是否符合指定的小数位数和正负性要求。
 *
 * @param value - 需要检查的数值。
 * @param decimal - 允许的小数位数，默认为 2。
 * @param negative - 是否允许负数，默认不允许。
 * @returns 如果数值满足条件则返回 true，否则返回 false。
 */
export function checkNumber(value: number | string, decimal: number = 2, negative: boolean = false): boolean {
    const numValue = Number(value)
    if (isNaN(numValue)) {
        return false
    }

    if (!negative && numValue < 0) {
        return false
    }

    if (decimal < 0) {
        return false
    }

    const valueStr = numValue.toString()

    if (decimal === 0) {
        return !valueStr.includes('.')
    }

    const decimalPart = valueStr.split('.')[1]
    if (decimalPart && decimalPart.length > decimal) {
        return false
    }

    return true
}

/**
 * 从对象中提取指定的属性，创建一个新对象
 * @param obj - 源对象
 * @param keys - 需要提取的属性名数组
 * @returns 包含指定属性的新对象
 */
export function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>
    keys.forEach((key) => {
        if (key in obj) {
            result[key] = obj[key]
        }
    })
    return result
}

/**
 * 异步函数：暂停指定时长
 * @param duration - 暂停的时长，以毫秒为单位。
 */
export async function pauseSync(duration: number = 2000): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, duration))
}

/**
 * 生成一个安全的随机字符串。
 * @param length - 字符串长度，默认为 16
 * @returns 随机字符串
 */
export function randomStr(length: number = 16): string {
    const str = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    let result = ''
    const randomValues = new Uint8Array(length)
    window.crypto.getRandomValues(randomValues)
    for (let i = 0; i < length; i++) {
        result += str[randomValues[i] % str.length]
    }
    return result
}

/**
 * 判断路径是否为外部链接
 * @param path - 需要检查的路径
 * @returns 如果是外部链接返回 true，否则返回 false
 */
export function isExternal(path: string): boolean {
    return /^(https?:|http?:)/.test(path)
}

/**
 * 判断是否为空
 * @param value - 需要判断的值
 * @returns 是否为空
 */
export function isEmpty(value: any): boolean {
    // 处理 Vue 的 Ref 对象
    if (value && typeof value === 'object' && '__v_isRef' in value) {
        value = value.value
    }

    if (value == null) return true

    switch (typeof value) {
        case 'boolean':
            return !value
        case 'number':
            return value === 0
        case 'string':
            return value.trim() === ''
    }

    if (value instanceof Map || value instanceof Set) return value.size === 0
    if (Array.isArray(value)) return value.length === 0

    if (typeof value === 'object') {
        return Reflect.ownKeys(value).length === 0
    }

    return false
}

/**
 * 过滤对象中的 null 和 undefined 值
 * @param obj - 源对象
 * @returns 过滤后的新对象
 */
export function filterNullUndefined<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(Object.entries(obj).filter(([, value]) => value !== null && value !== undefined)) as Partial<T>
}

/**
 * 防重复执行函数
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null
    return function (this: any, ...args: Parameters<T>) {
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => {
            fn.apply(this, args)
        }, delay)
    }
}

/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss 格式
 */
export function formatDate(date: Date | string | number): string {
    const dateObj = date instanceof Date ? date : new Date(date)
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const seconds = String(dateObj.getSeconds()).padStart(2, '0')

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

/**
 * 将多层级树形数据扁平化为选项数组
 */
export interface TreeOption {
    label: string
    value: any
}

export interface FlattenOptions {
    idKey?: string
    nameKey?: string
    childrenKey?: string
    separator?: string
}

export function flattenTree(tree: any[], prefix: string = '', options: FlattenOptions = {}): TreeOption[] {
    const { idKey = 'id', nameKey = 'name', childrenKey = 'children', separator = ' / ' } = options

    const result: TreeOption[] = []
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
 */
export function getImageUrl(value: string): string {
    if (!value) return ''

    if (typeof value === 'string' && /^https?:\/\//.test(value)) {
        return value
    }

    const { VITE_BASE_URL } = (import.meta as any).env
    return `${VITE_BASE_URL}/admin/v1/file/${value}`
}
