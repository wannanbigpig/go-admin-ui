<template>
    <div class="xl-main-height"><xl-iframe :to="to"></xl-iframe></div>
</template>

<script setup lang="ts">
import XlIframe from '@/components/iframe/index.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const to = computed(() => {
    const raw = route.query.to
    if (typeof raw !== 'string' || !raw) return ''
    try {
        const url = new URL(raw, window.location.origin)
        if (url.origin === window.location.origin) return raw
        return raw
    } catch {
        return ''
    }
})
</script>
