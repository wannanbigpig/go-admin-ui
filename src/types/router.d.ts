import 'vue-router'

declare module 'vue-router' {
    interface RouteMeta {
        title?: string
        titleKey?: string
        activeMenu?: string
        show?: boolean
        isDynamic?: boolean
        icon?: string
        isAuth?: boolean
        isNewWindow?: boolean
        isExternalLinks?: boolean
        animate_duration?: string | number
        animate_enter?: string
        animate_leave?: string
    }
}

export {}
