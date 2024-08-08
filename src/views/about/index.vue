<template>
  <div>
    <h1>{{ str }}</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About</h1>
    <h1>About22</h1>
  </div>
</template>

<script setup>
import { randomStr } from "@/utils/helper";
const str = ref("");

onMounted(() => {
  str.value = randomStr();
});
</script>
