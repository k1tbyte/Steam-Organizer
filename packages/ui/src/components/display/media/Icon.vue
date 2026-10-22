<script setup lang="ts">
import { icons } from './icons'

defineProps<{ name: string }>()
</script>

<template>
    <svg class="fp-icon" :viewBox="icons[name]?.viewBox" aria-hidden="true" v-html="icons[name]?.body" />
</template>
