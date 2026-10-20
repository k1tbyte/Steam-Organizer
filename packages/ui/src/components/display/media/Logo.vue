<script setup lang="ts">
import logoUrl from '../../../assets/logo.svg'

// Vite's data URI contains single-quoted attributes.
const logo = `url("${logoUrl}")`
</script>

<template>
    <span
        class="logo inline-block shrink-0"
        :style="{ '--logo': logo }"
        aria-hidden="true" />
</template>

<style scoped>
.logo {
    background: currentColor;
    -webkit-mask: var(--logo) center / contain no-repeat;
    mask: var(--logo) center / contain no-repeat;
}
</style>
