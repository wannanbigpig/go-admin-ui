import { translate } from '@/locales'

interface RouteTitleSource {
    title?: string
    titleKey?: string
    title_key?: string
    componentPath?: string
    name?: string
    path?: string
}

const normalizeText = (value?: string) => value?.trim() || ''

export function resolveRouteTitleKey(source: RouteTitleSource): string | undefined {
    const explicitKey = normalizeText(source.titleKey || source.title_key)
    if (explicitKey) return explicitKey
    return undefined
}

export function resolveRouteTitle(source: RouteTitleSource) {
    const titleKey = resolveRouteTitleKey(source)
    if (titleKey) {
        return translate(titleKey)
    }
    return normalizeText(source.title)
}
