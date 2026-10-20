<script setup lang="ts">
defineProps<{ value?: string }>()
</script>

<template>
    <kbd
        class="key inline-flex h-5 min-w-5 items-center justify-center rounded-xs bg-surface-hi px-1 font-mono text-xs text-fg-2">
        <slot>{{ value }}</slot>
    </kbd>
</template>

<style scoped>
.key {
    box-shadow:
        inset 0 0 0 1px var(--stroke-2),
        inset 0 -1.5px 0 var(--stroke-2);
}
</style>
