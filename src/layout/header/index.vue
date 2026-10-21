<template>
    <div class="xl-header-content">
        <div class="xl-header-left">
            <xl-left :mobile-nav-open="mobileNavOpen" @toggle-navigation="$emit('toggle-navigation')" />
        </div>
        <div class="xl-header-right">
            <xl-right />
        </div>
    </div>
</template>

<script setup lang="ts">
import XlLeft from './left.vue'
import XlRight from './right.vue'

defineProps<{ mobileNavOpen?: boolean }>()
defineEmits<{ 'toggle-navigation': [] }>()
</script>

<style scoped lang="scss">
@use '@/assets/styles/layout/header.scss' as *;

.xl-header-left {
    min-width: 0;
}
@media (max-width: 768px) {
    .xl-header-left {
        flex: 1;
        overflow: hidden;
    }
    .xl-header-right {
        flex: 0 0 auto;
    }
}
</style>
