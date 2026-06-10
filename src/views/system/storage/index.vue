<template>
    <div />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

onMounted(() => {
    router.replace({ path: '/system/config', query: { tab: 'storage' } })
})
</script>
