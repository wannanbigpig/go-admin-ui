import { sha256 } from 'js-sha256'

self.onmessage = async (e: MessageEvent<{ file: File; chunkSize?: number }>) => {
    const { file, chunkSize = 10 * 1024 * 1024 } = e.data
    const totalSize = file.size
    let offset = 0
    const hashObj = sha256.create()

    try {
        while (offset < totalSize) {
            const slice = file.slice(offset, offset + chunkSize)
            const buffer = await slice.arrayBuffer()
            hashObj.update(buffer)
            offset += buffer.byteLength

            const progress = Math.min(100, Math.round((offset / totalSize) * 100))
            self.postMessage({ type: 'progress', progress })
        }

        const hashResult = hashObj.hex()
        self.postMessage({ type: 'success', hash: hashResult })
    } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        self.postMessage({ type: 'error', error: errorMsg || 'Hash calculation failed' })
    }
}
