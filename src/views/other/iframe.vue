<template>
    <div class="xl-main-height"><xl-iframe :to="to"></xl-iframe></div>
</template>

<script setup lang="ts">
import XlIframe from '@/components/iframe/index.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { normalizeIframeURL } from '@/utils/iframe'

const route = useRoute()

const to = computed(() => {
    return normalizeIframeURL(route.query.to)
})
</script>
