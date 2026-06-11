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

    if (Math.abs(numValue) >= 1e21) {
        return decimal === 0 ? Number.isInteger(numValue) : true
    }

    const valueStr = numValue.toString()
    let realDecimals = 0
    if (valueStr.toLowerCase().includes('e')) {
        const [base, expStr] = valueStr.toLowerCase().split('e')
        const exponent = parseInt(expStr, 10)
        const baseDecimalPart = base.split('.')[1]
        const baseDecimals = baseDecimalPart ? baseDecimalPart.length : 0
        realDecimals = Math.max(0, baseDecimals - exponent)
    } else {
        const decimalPart = valueStr.split('.')[1]
        realDecimals = decimalPart ? decimalPart.length : 0
    }

    return realDecimals <= decimal
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
function isVueRef(value: unknown): value is { value: unknown } {
    return typeof value === 'object' && value !== null && '__v_isRef' in value
}

export function isEmpty(value: unknown): boolean {
    // 处理 Vue 的 Ref 对象
    let val = value
    if (isVueRef(val)) {
        val = val.value
    }

    if (val == null) return true

    if (val instanceof Date) {
        return isNaN(val.getTime())
    }

    switch (typeof val) {
        case 'boolean':
            return false
        case 'number':
            return false
        case 'string':
            return val.trim() === ''
    }

    if (val instanceof Map || val instanceof Set) return val.size === 0
    if (Array.isArray(val)) return val.length === 0

    if (typeof val === 'object') {
        return Reflect.ownKeys(val).length === 0
    }

    return false
}

export function isBlankOrFalsy(value: unknown): boolean {
    let val = value
    if (isVueRef(val)) {
        val = val.value
    }

    if (val == null) return true

    if (val instanceof Date) {
        return isNaN(val.getTime())
    }

    switch (typeof val) {
        case 'boolean':
            return !val
        case 'number':
            return val === 0
        case 'string':
            return val.trim() === ''
    }

    if (val instanceof Map || val instanceof Set) return val.size === 0
    if (Array.isArray(val)) return val.length === 0

    if (typeof val === 'object') {
        return Reflect.ownKeys(val).length === 0
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
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout> | null = null
    return function (this: unknown, ...args: Parameters<T>) {
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
    if (isNaN(dateObj.getTime())) return ''
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
    value: unknown
}

export interface FlattenOptions<T extends object = Record<string, unknown>> {
    idKey?: keyof T
    nameKey?: keyof T
    childrenKey?: keyof T
    separator?: string
}

export function flattenTree<T extends object>(tree: T[], prefix: string = '', options: FlattenOptions<T> = {}): TreeOption[] {
    const { idKey = 'id' as keyof T, nameKey = 'name' as keyof T, childrenKey = 'children' as keyof T, separator = ' / ' } = options

    const result: TreeOption[] = []
    tree.forEach((item) => {
        const name = String(item[nameKey] ?? '')
        const label = prefix ? `${prefix}${separator}${name}` : name
        result.push({
            label,
            value: item[idKey],
        })
        const children = item[childrenKey]
        if (Array.isArray(children) && children.length > 0) {
            result.push(...flattenTree(children as T[], label, options))
        }
    })
    return result
}

/**
 * 获取图片 URL
 */
export function getSystemFileUrl(value: string): string {
    if (!value || value === '-') return ''

    if (typeof value === 'string' && /^https?:\/\//.test(value)) {
        return value
    }

    const { VITE_BASE_URL } = import.meta.env
    return `${VITE_BASE_URL}/admin/v1/file/${value}`
}

export function getImageUrl(value: string): string {
    return getSystemFileUrl(value)
}

/**
 * 将字节数格式化为可读的文件大小字符串。
 * @param size - 字节数
 * @returns 例如 "1.23 MB"
 */
export function formatFileSize(size?: number | null): string {
    const bytes = Number(size || 0)
    if (!bytes || bytes < 0) return '0 B'
    const units = ['B', 'KB', 'MB', 'GB', 'TB']
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
    return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

/**
 * 解析用户 ID 字符串。
 *
 * 支持以逗号、空格、换行、分号、tab 等任意常见分隔符分隔的 ID 列表，
 * 自动去重、过滤空值与非数字。
 *
 * @param input 待解析字符串，可为 null/undefined
 * @returns 数字数组（去重并保持原始顺序）
 *
 * @example
 *   parseUserIDs('1, 2,3 4') // [1, 2, 3, 4]
 *   parseUserIDs('1,,2,abc,3') // [1, 2, 3]
 */
export function parseUserIDs(input?: string | null): number[] {
    if (!input) return []
    const seen = new Set<number>()
    const result: number[] = []
    String(input)
        .split(/[\s,;]+/)
        .forEach((token) => {
            const trimmed = token.trim()
            if (!trimmed) return
            const num = Number(trimmed)
            if (!Number.isFinite(num) || !Number.isInteger(num)) return
            if (seen.has(num)) return
            seen.add(num)
            result.push(num)
        })
    return result
}
