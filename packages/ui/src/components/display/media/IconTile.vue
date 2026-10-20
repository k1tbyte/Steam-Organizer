<script setup lang="ts">
import type { SemanticColor } from '../../../color'
import FpIcon from './Icon.vue'

export type IconTileSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

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
    xs: 'size-7 text-sm',
    sm: 'size-9 text-base',
    md: 'size-10 text-lg',
    lg: 'size-12 text-xl',
    xl: 'size-16 text-3xl',
    '2xl': 'size-20 text-3xl',
}

const COLORS: Record<SemanticColor, string> = {
    neutral: 'bg-surface-hi text-fg-3',
    accent: 'bg-accent-soft text-accent',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
    info: 'bg-info-soft text-info',
}
</script>

<template>
    <span
        class="flex shrink-0 items-center justify-center"
        :class="[SIZES[size], COLORS[color], round ? 'rounded-full' : 'rounded']">
        <slot>
            <FpIcon v-if="name" :name="name" />
        </slot>
    </span>
</template>
