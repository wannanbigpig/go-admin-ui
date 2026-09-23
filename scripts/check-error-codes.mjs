import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const docsPath = path.join(root, 'docs/error_codes.ts')
const constPath = path.join(root, 'src/constants/errorCodes.ts')

/** 去掉生成器 Source 注释行，只比较错误码主体，避免“Source: backend/...”与“Source: internal/...”文案差异误报 */
function normalize(source) {
    return source
        .split('\n')
        .filter((line) => !/^\/\/\s*Source:/.test(line.trim()))
        .join('\n')
        .replace(/\r\n/g, '\n')
        .trim()
}

function extractErrorCodeBlock(source) {
    const match = source.match(/export const ErrorCode = \{[\s\S]*?\n\}/)
    if (!match) {
        throw new Error('未找到 export const ErrorCode 块')
    }
    return match[0].trim()
}

for (const file of [docsPath, constPath]) {
    if (!fs.existsSync(file)) {
        console.error(`缺少错误码文件: ${path.relative(root, file)}`)
        process.exit(1)
    }
}

const docs = fs.readFileSync(docsPath, 'utf8')
const constants = fs.readFileSync(constPath, 'utf8')

const docsBlock = extractErrorCodeBlock(docs)
const constBlock = extractErrorCodeBlock(constants)

if (docsBlock !== constBlock) {
    console.error('docs/error_codes.ts 与 src/constants/errorCodes.ts 的 ErrorCode 定义不一致')
    console.error('请用后端 `go-layout command gen-error-codes` 同步 docs/error_codes.ts，并复制到 src/constants/errorCodes.ts')
    process.exit(1)
}

// 归一化后全文也应一致（允许 Source 注释文案不同）
if (normalize(docs) !== normalize(constants)) {
    console.error('错误码文件除 Source 注释外仍有差异')
    process.exit(1)
}

console.log('✅ docs/error_codes.ts 与 src/constants/errorCodes.ts 错误码定义一致')
