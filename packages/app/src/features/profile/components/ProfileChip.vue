<script setup lang="ts">
import { FpIcon } from '@so/ui'

withDefaults(
    defineProps<{
        tone?: 'neutral' | 'accent' | 'success' | 'danger'
        /** `md` closes the desktop header, `lg` is the phone's chip. */
        size?: 'sm' | 'md' | 'lg'
        icon?: string
    }>(),
    { tone: 'neutral', size: 'sm' },
)

const TONES = {
    neutral: 'bg-surface-hi font-medium text-fg-2',
    accent: 'bg-accent-soft font-semibold text-accent-ink',
    success: 'bg-success-soft font-medium text-success',
    danger: 'bg-danger-soft font-medium text-danger',
}
const SIZES = {
    sm: 'h-5.5 gap-1.25 px-2 text-12',
    md: 'h-7 gap-1.5 pr-2.75 pl-2.25 text-12.5',
    lg: 'h-6 gap-1.25 px-2.25 text-11.5',
}
</script>

<template>
    <span class="inline-flex shrink-0 items-center rounded-full" :class="[TONES[tone], SIZES[size]]">
        <FpIcon v-if="icon" :name="icon" :class="size === 'md' && 'text-14'" />
        <slot />
    </span>
</template>
