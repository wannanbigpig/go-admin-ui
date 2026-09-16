interface CacheItem<T> {
    data: T
    expiry: number
}

class ApiCache {
    private cache = new Map<string, CacheItem<unknown>>()
    private pending = new Map<string, Promise<unknown>>()
    private generation = 0
    private keyGenerations = new Map<string, number>()
    private readonly maxLimit = 100

    private invalidateKey(key: string): void {
        this.keyGenerations.set(key, (this.keyGenerations.get(key) || 0) + 1)
        this.cache.delete(key)
        this.pending.delete(key)
    }

    /**
     * 获取缓存数据并刷新 LRU 状态
     * @param key 缓存键
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key)
        if (item) {
            if (item.expiry > Date.now()) {
                // 刷新 LRU 活跃顺序：先删再设，移动到 Map 末尾
                this.cache.delete(key)
                this.cache.set(key, item)
                return item.data as T
            }
            this.cache.delete(key)
        }
        return null
    }

    /**
     * 写入缓存数据，超出最大容量时进行 LRU 淘汰
     * @param key 缓存键
     * @param data 缓存值
     * @param ttl 缓存有效期（毫秒），默认 5 分钟 (300,000 ms)
     */
    set<T>(key: string, data: T, ttl = 300000): void {
        this.cache.delete(key)
        this.cache.set(key, {
            data,
            expiry: Date.now() + ttl,
        })
        if (this.cache.size > this.maxLimit) {
            const oldestKey = this.cache.keys().next().value
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey)
            }
        }
    }

    /**
     * 删除指定缓存键
     * @param key 缓存键
     */
    delete(key: string): void {
        this.invalidateKey(key)
    }

    /**
     * 根据前缀模糊清除缓存
     * @param prefix 前缀标识
     */
    deleteByPrefix(prefix: string): void {
        const matchedKeys = new Set<string>()
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                matchedKeys.add(key)
            }
        }
        for (const key of this.pending.keys()) {
            if (key.startsWith(prefix)) {
                matchedKeys.add(key)
            }
        }
        matchedKeys.forEach((key) => this.invalidateKey(key))
    }

    /**
     * 获取当前处于 Pending 状态的 Promise
     * @param key 缓存键
     */
    getPending<T>(key: string): Promise<T> | undefined {
        return this.pending.get(key) as Promise<T> | undefined
    }

    /**
     * 设置当前处于 Pending 状态的 Promise
     * @param key 缓存键
     * @param promise 请求 Promise
     */
    setPending<T>(key: string, promise: Promise<T>): void {
        this.pending.set(key, promise)
    }

    /**
     * 移除 Pending Promise
     * @param key 缓存键
     */
    deletePending(key: string): void {
        this.pending.delete(key)
    }

    /**
     * 读取缓存或合并同一代次内的并发请求。
     * clear() 会推进代次，旧请求即使稍后完成也不会把上一会话数据写回缓存。
     */
    getOrSet<T>(key: string, loader: () => Promise<T>, ttl = 300000): Promise<T> {
        const cached = this.get<T>(key)
        if (cached !== null) return Promise.resolve(cached)

        const pending = this.getPending<T>(key)
        if (pending) return pending

        const requestGeneration = this.generation
        const requestKeyGeneration = this.keyGenerations.get(key) || 0
        const promise = Promise.resolve()
            .then(loader)
            .then((data) => {
                if (requestGeneration === this.generation && requestKeyGeneration === (this.keyGenerations.get(key) || 0)) {
                    this.set(key, data, ttl)
                }
                return data
            })
            .finally(() => {
                if (
                    requestGeneration === this.generation &&
                    requestKeyGeneration === (this.keyGenerations.get(key) || 0) &&
                    this.pending.get(key) === promise
                ) {
                    this.pending.delete(key)
                }
            })

        this.setPending(key, promise)
        return promise
    }

    /**
     * 清空所有缓存与 Pending 队列
     */
    clear(): void {
        this.generation++
        this.cache.clear()
        this.pending.clear()
        this.keyGenerations.clear()
    }
}

export const apiCache = new ApiCache()
