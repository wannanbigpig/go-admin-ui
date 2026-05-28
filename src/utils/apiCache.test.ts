import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiCache } from '@/utils/apiCache'

describe('utils/apiCache.ts', () => {
    beforeEach(() => {
        apiCache.clear()
        vi.useFakeTimers()
    })

    it('能够正确写入和读取缓存', () => {
        apiCache.set('key1', { name: 'test' }, 5000)
        expect(apiCache.get('key1')).toEqual({ name: 'test' })
    })

    it('过期缓存被调用 get 时应惰性淘汰并返回 null', () => {
        apiCache.set('key1', 'value1', 5000)
        vi.advanceTimersByTime(5001)
        expect(apiCache.get('key1')).toBeNull()
    })

    it('能够正常主动删除缓存', () => {
        apiCache.set('key1', 'value1')
        apiCache.delete('key1')
        expect(apiCache.get('key1')).toBeNull()
    })

    it('能够根据前缀删除缓存', () => {
        apiCache.set('user:info:1', 'user1')
        apiCache.set('user:info:2', 'user2')
        apiCache.set('role:info:1', 'role1')

        apiCache.deleteByPrefix('user:info:')

        expect(apiCache.get('user:info:1')).toBeNull()
        expect(apiCache.get('user:info:2')).toBeNull()
        expect(apiCache.get('role:info:1')).toBe('role1')
    })

    it('能够管理 pending 状态下的 promise', async () => {
        const promise = Promise.resolve('data')
        apiCache.setPending('key1', promise)

        expect(apiCache.getPending('key1')).toBe(promise)

        apiCache.deletePending('key1')
        expect(apiCache.getPending('key1')).toBeUndefined()
    })

    it('clear 能够清除全部缓存与 pending', () => {
        apiCache.set('key1', 'value1')
        apiCache.setPending('key2', Promise.resolve())

        apiCache.clear()

        expect(apiCache.get('key1')).toBeNull()
        expect(apiCache.getPending('key2')).toBeUndefined()
    })

    it('get 应刷新 LRU 活跃度并在超出 maxLimit 时淘汰最久未活跃的缓存', () => {
        // limit = 100
        // 我们写入 key_0 到 key_100 (共 101 个)
        for (let i = 0; i <= 100; i++) {
            apiCache.set(`key_${i}`, `value_${i}`)
        }

        // key_0 是最老写入的，应该被淘汰掉
        expect(apiCache.get('key_0')).toBeNull()
        expect(apiCache.get('key_1')).toBe('value_1')
        expect(apiCache.get('key_100')).toBe('value_100')

        // 此时 key_1 的活跃度被刷新，它现在排在最末尾（最活跃）
        // 接下来我们再 set 一个 key_101
        apiCache.set('key_101', 'value_101')

        // 刚才最久未活跃的在没有 key_0 之后应该是 key_2
        expect(apiCache.get('key_2')).toBeNull()
        // key_1 因为被 get() 刷新了，不应该被删除
        expect(apiCache.get('key_1')).toBe('value_1')
        expect(apiCache.get('key_101')).toBe('value_101')
    })
})
