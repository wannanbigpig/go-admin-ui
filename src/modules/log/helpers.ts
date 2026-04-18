export function applyDateRangeToQuery(query: Record<string, unknown>, dateRange: [string, string] | null) {
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

export function formatJson(jsonStr: string) {
    if (!jsonStr) return '-'
    try {
        const obj = JSON.parse(jsonStr)
        return JSON.stringify(obj, null, 2)
    } catch {
        return jsonStr
    }
}

export function formatJwtToken(token: string) {
    if (!token) return ''
    const parts = token.split('.')
    if (parts.length !== 3) {
        // 不是标准 JWT 格式，直接返回原始 token
        return token
    }

    try {
        const headerPart = parts[0]
        const payloadPart = parts[1]
        const signaturePart = parts[2]

        // 解码 Header
        let header = ''
        try {
            const headerStr = base64UrlDecode(headerPart)
            const headerJson = JSON.parse(headerStr)
            header = JSON.stringify(headerJson, null, 2)
        } catch {
            header = headerPart
        }

        // 解码 Payload
        let payload = ''
        try {
            const payloadStr = base64UrlDecode(payloadPart)
            const payloadJson = JSON.parse(payloadStr)
            payload = JSON.stringify(payloadJson, null, 2)
        } catch {
            payload = payloadPart
        }

        return `Header:\n${header}\n\nPayload:\n${payload}\n\nSignature:\n${signaturePart}`
    } catch {
        return token
    }
}

function base64UrlDecode(str: string) {
    // Base64URL 转 Base64
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    // 添加填充
    while (base64.length % 4) {
        base64 += '='
    }
    // 使用 atob 解码
    const binaryString = atob(base64)
    // 将 Latin-1 字符串转换为 UTF-8
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
    }
    // 使用 TextDecoder 解码为 UTF-8
    return new TextDecoder('utf-8').decode(bytes)
}
