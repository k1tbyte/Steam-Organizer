<script setup lang="ts">
defineProps<{ value?: string }>()
</script>

<template>
    <kbd
        class="key inline-flex h-5 min-w-5 items-center justify-center rounded-xs px-1.5 font-medium font-mono text-11 text-fg-3">
        <slot>{{ value }}</slot>
    </kbd>
</template>

<style scoped>
.key {
    box-shadow: inset 0 0 0 1px var(--stroke-2);
}
</style>
