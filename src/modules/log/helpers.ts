// toAbsoluteInstant 把日期选择器产出的本地墙钟串（YYYY-MM-DD HH:mm:ss）转成带时区的 ISO-8601 绝对时刻，
// 避免浏览器时区≠服务器时区时区间整体偏移；后端按绝对时刻解析并落到服务器本地时区比较。
function toAbsoluteInstant(value: string): string | null {
    if (!value) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function applyDateRangeToQuery(query: Record<string, unknown>, dateRange: [string, string] | null) {
    if (dateRange && dateRange.length === 2) {
        query.start_time = toAbsoluteInstant(dateRange[0])
        query.end_time = toAbsoluteInstant(dateRange[1])
    } else {
        query.start_time = null
        query.end_time = null
    }
}

export function formatIpAddress(ip: string, ipLocation?: string) {
    if (!ip) return '-'
    return ipLocation ? `${ip} (${ipLocation})` : ip
}

export function formatJson(jsonStr: string) {
    if (!jsonStr) return '-'
    try {
        const obj = JSON.parse(jsonStr)
        return JSON.stringify(obj, null, 2)
    } catch {
        return jsonStr
    }
}
