export function applyDateRangeToQuery(query, dateRange) {
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
        query.start_time = dateRange[0]
        query.end_time = dateRange[1]
        return
    }

    query.start_time = null
    query.end_time = null
}

export function formatIpAddress(ip, ipLocation) {
    if (!ip) return '-'
    return ipLocation ? `${ip} ${ipLocation}` : ip
}

export function formatJsonContent(jsonStr) {
    if (!jsonStr) return '{}'
    try {
        const obj = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr
        return JSON.stringify(obj, null, 2)
    } catch {
        return jsonStr
    }
}

export function formatJwtToken(token) {
    if (!token) return ''

    try {
        const parts = token.split('.')
        if (parts.length !== 3) return token

        const [headerPart, payloadPart, signaturePart] = parts

        let header = ''
        try {
            const headerStr = base64UrlDecode(headerPart)
            header = JSON.stringify(JSON.parse(headerStr), null, 2)
        } catch {
            header = headerPart
        }

        let payload = ''
        try {
            const payloadStr = base64UrlDecode(payloadPart)
            payload = JSON.stringify(JSON.parse(payloadStr), null, 2)
        } catch {
            payload = payloadPart
        }

        return `Header:\n${header}\n\nPayload:\n${payload}\n\nSignature:\n${signaturePart}`
    } catch {
        return token
    }
}

function base64UrlDecode(str) {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
        base64 += '='
    }

    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let index = 0; index < binaryString.length; index += 1) {
        bytes[index] = binaryString.charCodeAt(index)
    }

    return new TextDecoder('utf-8').decode(bytes)
}
