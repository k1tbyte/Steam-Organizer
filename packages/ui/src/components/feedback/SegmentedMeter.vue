<script setup lang="ts">
type Tone = 'accent' | 'success' | 'warning' | 'danger'

withDefaults(
    defineProps<{
        /** Filled segments. */
        value: number
        max?: number
        tone?: Tone
        label?: string
    }>(),
    { max: 4, tone: 'accent' },
)

const FILL: Record<Tone, string> = {
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
}
const INK: Record<Tone, string> = {
    accent: 'text-accent-ink',
    success: 'text-success',
    warning: 'text-warning',
    danger: 'text-danger',
}
</script>

<template>
    <!-- biome-ignore lint/a11y/useSemanticElements: <meter> cannot paint segments -->
    <div
        class="flex items-center gap-2.5"
        role="meter"
        :aria-label="label"
        aria-valuemin="0"
        :aria-valuemax="max"
        :aria-valuenow="value">
        <div class="grid flex-1 gap-1" :style="{ gridTemplateColumns: `repeat(${max}, minmax(0, 1fr))` }">
            <span
                v-for="segment in max"
                :key="segment"
                class="h-1 rounded-full transition-colors duration-fast"
                :class="segment <= value ? FILL[tone] : 'bg-surface-hi'" />
        </div>
        <span v-if="label" class="min-w-30 text-right text-12" :class="INK[tone]">{{ label }}</span>
    </div>
</template>
