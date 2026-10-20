<script setup lang="ts">
import type { SemanticColor } from '../../color'

export type DotSize = 'sm' | 'md' | 'lg'

withDefaults(
    defineProps<{
        color?: SemanticColor
        size?: DotSize
        pulse?: boolean
        /** Soft ring around the dot: reads as a live indicator standing still,
         *  where `pulse` reads as one asking for attention. */
        halo?: boolean
    }>(),
    { color: 'success', size: 'sm', pulse: false, halo: false },
)

const COLORS: Record<SemanticColor, string> = {
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
    neutral: 'bg-fg-faint',
}

const HALOS: Record<SemanticColor, string> = {
    accent: 'ring-3 ring-accent/20',
    success: 'ring-3 ring-success/20',
    warning: 'ring-3 ring-warning/20',
    danger: 'ring-3 ring-danger/20',
    info: 'ring-3 ring-info/20',
    neutral: 'ring-3 ring-fg-faint/20',
}

const SIZES: Record<DotSize, string> = {
    sm: 'size-1.5',
    md: 'size-2',
    lg: 'size-3',
}
</script>

<template>
    <span
        class="relative flex shrink-0 rounded-full"
        :class="[SIZES[size], halo && HALOS[color]]"
        aria-hidden="true">
        <span
            v-if="pulse"
            class="absolute inline-flex size-full animate-ping rounded-full opacity-60"
            :class="COLORS[color]" />
        <span
            class="relative inline-flex size-full rounded-full"
            :class="COLORS[color]" />
    </span>
</template>
