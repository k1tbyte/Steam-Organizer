<script setup lang="ts">
type Size = 'sm' | 'md' | 'lg'

withDefaults(defineProps<{ size?: Size }>(), { size: 'md' })

const SIZES: Record<Size, string> = {
    sm: 'size-3.5',
    md: 'size-4.5',
    lg: 'size-6',
}
</script>

<template>
    <svg
        class="animate-spin motion-off:animate-pulse!"
        :class="SIZES[size]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
        role="status"
        aria-label="Loading">
        <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
</template>
