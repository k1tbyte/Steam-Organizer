<script setup lang="ts">
import type { SemanticColor } from '../../color'
import { useBump } from '../../composables/useBump'

type Size = 'sm' | 'md' | 'lg'
type Position = 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left'

const props = withDefaults(
    defineProps<{
        text?: string | number
        color?: SemanticColor
        size?: Size
        position?: Position
        inset?: boolean
        standalone?: boolean
    }>(),
    { color: 'accent', size: 'md', position: 'top-right' },
)

const show = defineModel<boolean>('show', { default: true })
const { bumping, settle } = useBump(() => props.text)

const COLORS: Record<SemanticColor, string> = {
    accent: 'bg-accent text-accent-fg',
    neutral: 'bg-surface-hi text-fg-2',
    success: 'bg-success text-success-fg',
    warning: 'bg-warning text-warning-fg',
    danger: 'bg-danger text-danger-fg',
    info: 'bg-info text-info-fg',
}

const DOT_SIZES: Record<Size, string> = {
    sm: 'size-1.5',
    md: 'size-2',
    lg: 'size-2.5',
}
const TEXT_SIZES: Record<Size, string> = {
    sm: 'h-3.5 min-w-3.5 px-1 text-2xs',
    md: 'h-4 min-w-4 px-1 text-xs',
    lg: 'h-5 min-w-5 px-1.5 text-xs',
}

const POSITIONS: Record<Position, { edge: string; out: string }> = {
    'top-right': { edge: 'top-0 right-0', out: 'translate-x-1/2 -translate-y-1/2' },
    'bottom-right': { edge: 'bottom-0 right-0', out: 'translate-x-1/2 translate-y-1/2' },
    'top-left': { edge: 'top-0 left-0', out: '-translate-x-1/2 -translate-y-1/2' },
    'bottom-left': { edge: 'bottom-0 left-0', out: '-translate-x-1/2 translate-y-1/2' },
}
</script>

<template>
    <div class="inline-flex shrink-0" :class="!standalone && 'relative'">
        <slot v-if="!standalone" />
        <Transition name="fp-chip">
            <span
                v-if="show"
                class="inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap"
                :class="[
                    COLORS[color],
                    text === undefined ? DOT_SIZES[size] : TEXT_SIZES[size],
                    bumping && 'animate-bump',
                    !standalone && [
                        'absolute',
                        POSITIONS[position].edge,
                        !inset && POSITIONS[position].out,
                    ],
                ]"
                @animationend="settle">
                {{ text }}
            </span>
        </Transition>
    </div>
</template>

<style scoped>
/* Preserve the position transform while transitioning. */
.fp-chip-enter-active,
.fp-chip-leave-active {
    transition: opacity var(--dur-fast) var(--ease-out);
}
.fp-chip-enter-from,
.fp-chip-leave-to {
    opacity: 0;
}
</style>
