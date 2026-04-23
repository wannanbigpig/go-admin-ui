import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasPermission } from '@/utils/auth'

/**
 * 权限相关的组合式函数。
 *
 * @returns 提供按钮权限列表与权限判断方法
 */
export function usePermission() {
    const authStore = useAuthStore()
    const buttonInfoProxyCache = new Map<string, Record<string, unknown>>()

    const buttonPermissions = computed(() => authStore.buttonPermissions || [])

    const checkPermission = (permission: string | string[]) => {
        return hasPermission(permission)
    }

    const getButtonInfo = (code: string) => {
        return authStore.getButtonInfo(code)
    }

    const createLiveButtonInfoProxy = (code: string) => {
        return new Proxy<Record<string, unknown>>(
            {},
            {
                get: (_target, key) => {
                    const info = authStore.getButtonInfoFull(code) as Record<string, unknown> | null
                    if (!info) return undefined
                    return info[key as keyof typeof info]
                },
                has: (_target, key) => {
                    const info = authStore.getButtonInfoFull(code) as Record<string, unknown> | null
                    return !!info && key in info
                },
                ownKeys: () => {
                    const info = authStore.getButtonInfoFull(code) as Record<string, unknown> | null
                    return info ? Reflect.ownKeys(info) : []
                },
                getOwnPropertyDescriptor: (_target, key) => {
                    const info = authStore.getButtonInfoFull(code) as Record<string, unknown> | null
                    if (!info) return undefined
                    return {
                        configurable: true,
                        enumerable: true,
                        value: info[key as keyof typeof info],
                    }
                },
            }
        )
    }

    const getButtonInfoFull = (code: string) => {
        if (!buttonInfoProxyCache.has(code)) {
            buttonInfoProxyCache.set(code, createLiveButtonInfoProxy(code))
        }
        return buttonInfoProxyCache.get(code) || null
    }

    const shouldShowButton = (code: string) => {
        return authStore.shouldShowButton(code)
    }

    return {
        buttonPermissions,
        checkPermission,
        getButtonInfo,
        getButtonInfoFull,
        shouldShowButton,
    }
}
