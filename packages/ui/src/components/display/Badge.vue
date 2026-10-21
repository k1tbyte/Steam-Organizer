<script setup lang="ts">
import type { SemanticColor } from '../../color'
import { useBump } from '../../composables/useBump'
import FpIcon from './media/Icon.vue'

const props = withDefaults(
    defineProps<{
        label?: string | number
        icon?: string
        color?: SemanticColor
        /** A hairline ring instead of a fill, for a quiet tag that is not a status. */
        outline?: boolean
    }>(),
    { color: 'neutral' },
)

const { bumping, settle } = useBump(() => props.label)

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
        class="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-1.75 py-px text-11"
        :class="[outline ? 'font-medium text-fg-2 ring-1 ring-inset ring-stroke-2' : ['font-semibold', COLORS[color]], bumping && 'animate-bump']"
        @animationend="settle">
        <FpIcon v-if="icon" :name="icon" aria-hidden="true" />
        <slot>{{ label }}</slot>
    </span>
</template>
