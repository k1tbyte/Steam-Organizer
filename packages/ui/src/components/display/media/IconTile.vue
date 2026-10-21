<script setup lang="ts">
import type { SemanticColor } from '../../../color'
import FpIcon from './Icon.vue'

export type IconTileSize = 'xs' | 'sm' | 'base' | 'md' | 'lg' | 'xl' | '2xl'

withDefaults(
    defineProps<{
        name?: string
        size?: IconTileSize
        color?: SemanticColor
        round?: boolean
    }>(),
    { size: 'md', color: 'neutral' },
)

// The tile's font size is the glyph size (FpIcon is a 1em box).
const SIZES: Record<IconTileSize, string> = {
    xs: 'size-7 text-14',
    sm: 'size-8 text-16',
    base: 'size-9 text-16',
    md: 'size-11 text-20',
    lg: 'size-12 text-22',
    xl: 'size-16 text-28',
    '2xl': 'size-20 text-28',
}

const COLORS: Record<SemanticColor, string> = {
    neutral: 'bg-surface-hi text-fg-2',
    accent: 'bg-accent-soft text-accent-ink',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
}
</script>

<template>
    <span
        class="flex shrink-0 items-center justify-center"
        :class="[SIZES[size], COLORS[color], round ? 'rounded-full' : ['xs', 'sm', 'base'].includes(size) ? 'rounded' : 'rounded-md']">
        <slot>
            <FpIcon v-if="name" :name="name" />
        </slot>
    </span>
</template>
