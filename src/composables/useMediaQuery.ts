import { onBeforeUnmount, ref } from 'vue'

export function useMediaQuery(query: string) {
    const media = typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(query) : null
    const matches = ref(media?.matches ?? false)
    const update = (event: MediaQueryListEvent) => {
        matches.value = event.matches
    }
    media?.addEventListener('change', update)
    onBeforeUnmount(() => media?.removeEventListener('change', update))
    return matches
}
