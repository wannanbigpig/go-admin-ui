<template>
    <div class="xl-header-content">
        <div class="xl-header-left">
            <xl-left />
        </div>
        <div class="xl-header-right">
            <xl-right />
        </div>
    </div>
</template>

<script setup lang="ts">
import XlLeft from './left.vue'
import XlRight from './right.vue'
</script>

<style scoped lang="scss">
@import '@/assets/styles/layout/header.scss';
</style>
