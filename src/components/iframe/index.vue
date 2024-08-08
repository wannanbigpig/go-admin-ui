<template>
  <iframe :src="to" frameborder="0" width="100%" height="100%"></iframe>
</template>
<script setup>
defineProps({
  to: {
    type: String,
    required: true,
  },
})
</script>
