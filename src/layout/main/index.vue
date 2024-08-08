<template>
  <router-view :key="refreshStore.key" v-slot="{ Component }">
    <transition name="xl-main-slide-fade" class="animate__animated animate__faster" enter-active-class="animate__fadeIn" leave-active-class="animate__fadeOut" mode="out-in" appear>
      <component class="xl-main-inner" :is="Component" />
    </transition>
  </router-view>
</template>

<script setup>
import { useRefreshStore } from '@/stores/refresh'

const refreshStore = useRefreshStore()
</script>
