<script setup lang="ts">
defineProps<{
    name: string
}>()
</script>

<template>
    <span :class="name" aria-hidden="true" />
</template>
