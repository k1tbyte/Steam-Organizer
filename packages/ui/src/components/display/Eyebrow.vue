<script setup lang="ts">
import type { SemanticColor } from '../../color'

withDefaults(
    defineProps<{
        as?: string
        color?: Extract<SemanticColor, 'neutral' | 'accent'>
    }>(),
    { as: 'h3', color: 'neutral' },
)
</script>

<template>
    <component
        :is="as"
        class="eyebrow ml-1 mb-0.5"
        :class="color === 'accent' && 'text-accent'">
        <slot />
    </component>
</template>
