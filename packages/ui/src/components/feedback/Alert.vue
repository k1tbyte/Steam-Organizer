<script setup lang="ts">
import type { StatusColor } from '../../color'
import FpIcon from '../display/media/Icon.vue'

withDefaults(
    defineProps<{
        title: string
        description?: string
        color?: StatusColor
        closable?: boolean
    }>(),
    { color: 'neutral' },
)

const emit = defineEmits<{ close: [] }>()

const DOT_COLORS: Record<StatusColor, string> = {
    neutral: 'bg-fg-3',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
}

// Only problems interrupt the screen reader; the rest announce politely.
const ROLES: Record<StatusColor, string> = {
    neutral: 'status',
    success: 'status',
    info: 'status',
    warning: 'alert',
    danger: 'alert',
}
</script>

<template>
    <div
        class="alert w-full rounded px-3 py-2"
        :data-color="color"
        :role="ROLES[color]">
        <div class="flex items-start gap-2.5">
            <span class="mt-1.5 size-2 shrink-0 rounded-full" :class="DOT_COLORS[color]" />
            <div class="min-w-0 flex-1">
                <p class="font-medium text-fg-1 text-sm">{{ title }}</p>
                <div v-if="description || $slots.default" class="mt-0.5 text-fg-3 text-xs">
                    <slot>{{ description }}</slot>
                </div>
                <div v-if="$slots.actions" class="mt-2.5 flex gap-2">
                    <slot name="actions" />
                </div>
            </div>
            <button
                v-if="closable"
                type="button"
                class="-m-1 flex shrink-0 cursor-pointer rounded-full p-1 text-fg-3 transition-colors duration-fast hover:text-fg-1"
                aria-label="Dismiss"
                @click="emit('close')">
                <FpIcon name="icon-[lucide--x]" class="text-sm" />
            </button>
        </div>
    </div>
</template>

<style scoped>
/* In-flow alpha tints cannot overlap siblings. */
.alert {
    background: var(--alert-soft);
    box-shadow: inset 0 0 0 1px var(--alert-ring);
}
[data-color='neutral'] {
    --alert-soft: var(--surf-bg-hi);
    --alert-ring: var(--stroke-2);
}
[data-color='success'] {
    --alert-soft: var(--success-soft);
    --alert-ring: color-mix(in oklch, var(--success) 30%, transparent);
}
[data-color='warning'] {
    --alert-soft: var(--warning-soft);
    --alert-ring: color-mix(in oklch, var(--warning) 30%, transparent);
}
[data-color='danger'] {
    --alert-soft: var(--danger-soft);
    --alert-ring: color-mix(in oklch, var(--danger) 30%, transparent);
}
[data-color='info'] {
    --alert-soft: var(--info-soft);
    --alert-ring: color-mix(in oklch, var(--info) 30%, transparent);
}
</style>
