<script setup lang="ts">
withDefaults(defineProps<{ value?: string; size?: 'sm' | 'md' }>(), { size: 'sm' })
</script>

<template>
    <kbd
        class="key inline-flex min-w-3.5 items-center justify-center rounded-xs font-medium font-mono text-11 text-fg-3"
        :class="size === 'sm' ? 'h-3.5 px-1.25' : 'h-4 px-1.5'">
        <slot>{{ value }}</slot>
    </kbd>
</template>

<style scoped>
.key {
    box-shadow: inset 0 0 0 1px var(--stroke-2);
}
</style>
