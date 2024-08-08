<template>
  <router-link class="linkStyle" v-if="!isExternal(to)" :to="to">
    <slot />
  </router-link>
  <a v-else-if="isNewWindow" class="linkStyle" rel="noopener noreferrer" target="_blank" :href="to">
    <slot />
  </a>
  <a v-else class="linkStyle" @click="toIframe(to)">
    <slot />
  </a>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { isExternal } from '@/utils/helper'
import router from '@/router'

defineProps({
  to: {
    type: String,
    required: true,
  },
  isNewWindow: {
    type: Boolean,
    default: true,
  },
})
function toIframe(to) {
  router.push({
    path: '/iframe',
    query: {
      to,
    },
  })
}
</script>
