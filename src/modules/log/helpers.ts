export function applyDateRangeToQuery(query: any, dateRange: [string, string] | null) {
    if (dateRange && dateRange.length === 2) {
        query.start_time = dateRange[0]
        query.end_time = dateRange[1]
    } else {
        query.start_time = null
        query.end_time = null
    }
}

export function formatIpAddress(ip: string, ipLocation: string) {
    if (!ip) return '-'
    return ipLocation ? `${ip} (${ipLocation})` : ip
}

export function formatJsonContent(jsonStr: string) {
    if (!jsonStr) return '-'
    try {
        const obj = JSON.parse(jsonStr)
        return JSON.stringify(obj, null, 2)
    } catch {
        return jsonStr
    }
}

export function formatJwtToken(token: string) {
    if (!token) return '-'
    const parts = token.split('.')
    if (parts.length !== 3) return token

    try {
        const header = JSON.parse(base64UrlDecode(parts[0]))
        const payload = JSON.parse(base64UrlDecode(parts[1]))
        return {
            header,
            payload,
            signature: parts[2],
        }
    } catch {
        return token
    }
}

function base64UrlDecode(str: string) {
    str = str.replace(/-/g, '+').replace(/_/g, '/')
    const pad = str.length % 4
    if (pad) {
        if (pad === 1) {
            throw new Error('InvalidLengthError: Input base64str is of invalid length')
        }
        str += new Array(5 - pad).join('=')
    }
    return atob(str)
}
