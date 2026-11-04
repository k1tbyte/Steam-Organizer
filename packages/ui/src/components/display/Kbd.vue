<script setup lang="ts">
import FpIcon from './media/Icon.vue'

withDefaults(defineProps<{ value?: string; size?: 'sm' | 'md' }>(), { size: 'sm' })
</script>

<template>
    <kbd
        class="key inline-flex min-w-3.5 items-center justify-center rounded-xs font-medium font-mono text-11 text-fg-3"
        :class="size === 'sm' ? 'h-3.5 px-1.25' : 'h-4 px-1.5'">
        <!-- The mono font has no ↵: a fallback font drew it off centre. -->
        <template v-if="value === 'Enter'">
            <FpIcon name="icon-[lucide--corner-down-left]" />
            <span class="sr-only">Enter</span>
        </template>
        <slot v-else>{{ value }}</slot>
    </kbd>
</template>

<style scoped>
.key {
    box-shadow: inset 0 0 0 1px var(--stroke-2);
}
</style>
