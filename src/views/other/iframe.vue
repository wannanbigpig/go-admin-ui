<template>
  <div class="xl-main-height"><xl-iframe :to="to"></xl-iframe></div>
</template>

<script setup>
import XlIframe from '@/components/iframe/index.vue'
import { ref } from 'vue'
import { useRoute } from 'vue-router'

const to = ref('')
const route = useRoute()
to.value = route.query.to
</script>
