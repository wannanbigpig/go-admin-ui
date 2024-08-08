<template>
  <div>
    <h1>home</h1>
    <h1>{{ str }}</h1>
    <router-view></router-view>
  </div>
</template>

<script setup>
import { randomStr } from '@/utils/helper'
import { ref, onMounted } from 'vue'
const str = ref('')

onMounted(() => {
  str.value = randomStr()
})
</script>
