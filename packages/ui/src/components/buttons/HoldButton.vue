<script setup lang="ts">
import { useHold } from '../../composables/useHold'

const props = withDefaults(
    defineProps<{
        label?: string
        /** Hold time in ms. */
        duration?: number
        color?: 'danger' | 'accent'
        block?: boolean
        disabled?: boolean
    }>(),
    { duration: 1600, color: 'danger' },
)

const emit = defineEmits<{ confirm: [] }>()

const { holding, handlers } = useHold({
    duration: () => props.duration,
    onComplete: () => emit('confirm'),
    disabled: () => props.disabled,
})
</script>

<!-- The fill is the progress: letting go before it ends drains it and confirms nothing. -->
<template>
    <button
        type="button"
        class="hold relative inline-flex h-12 touch-none items-center justify-center overflow-hidden rounded px-5 font-semibold text-14.5 whitespace-nowrap select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
        :class="block && 'w-full'"
        :data-color="color"
        :data-holding="holding || undefined"
        :disabled="disabled"
        :style="{ '--hold-ms': `${duration}ms` }"
        v-bind="handlers">
        <span class="hold-fill absolute inset-0" aria-hidden="true" />
        <span class="relative inline-flex items-center gap-2">
            <slot>{{ label }}</slot>
        </span>
    </button>
</template>

<style scoped>
.hold {
    background: var(--hold-soft);
    color: var(--hold-ink);
    cursor: pointer;
}
/* The face flips to its on-fill color halfway, when the fill passes under the text. */
.hold[data-holding] {
    color: var(--hold-fg);
    transition: color 0s linear calc(var(--hold-ms) / 2);
}
.hold-fill {
    background: var(--hold-tone);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform var(--dur-fast) var(--ease-out);
}
.hold[data-holding] .hold-fill {
    transform: scaleX(1);
    transition: transform var(--hold-ms) linear;
}

[data-color='danger'] {
    --hold-tone: var(--danger);
    --hold-soft: var(--danger-soft);
    --hold-ink: var(--danger);
    --hold-fg: var(--danger-fg);
}
[data-color='accent'] {
    --hold-tone: var(--accent);
    --hold-soft: var(--accent-soft);
    --hold-ink: var(--accent-ink);
    --hold-fg: var(--accent-fg);
}
</style>
