<script setup lang="ts">
import { computed } from 'vue'
import type { StatusColor } from '../../color'
import FpIcon from '../display/media/Icon.vue'

const props = withDefaults(
    defineProps<{
        title?: string
        description?: string
        color?: StatusColor
        /** Overrides the default glyph of the color. */
        icon?: string
        closable?: boolean
    }>(),
    { color: 'neutral' },
)

const emit = defineEmits<{ close: [] }>()

const ICONS: Record<StatusColor, string> = {
    neutral: 'icon-[lucide--info]',
    success: 'icon-[lucide--circle-check]',
    warning: 'icon-[lucide--triangle-alert]',
    danger: 'icon-[lucide--circle-alert]',
    info: 'icon-[lucide--info]',
}
const glyph = computed(() => props.icon ?? ICONS[props.color])

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
        class="alert flex w-full gap-2.5 rounded-md px-3.5 py-3"
        :class="$slots.trailing ? 'items-center' : 'items-start'"
        :data-color="color"
        :role="ROLES[color]">
        <FpIcon :name="glyph" class="alert-icon mt-px shrink-0 text-15" />
        <div class="min-w-0 flex-1">
            <p v-if="title" class="font-semibold text-13.5 text-fg-1">{{ title }}</p>
            <div
                v-if="description || $slots.default"
                class="text-12.5"
                :class="title ? 'mt-0.5 text-fg-2' : 'text-13 text-fg-1'">
                <slot>{{ description }}</slot>
            </div>
            <div v-if="$slots.actions" class="mt-2.5 flex gap-2">
                <slot name="actions" />
            </div>
        </div>
        <div v-if="$slots.trailing" class="shrink-0">
            <slot name="trailing" />
        </div>
        <button
            v-if="closable"
            type="button"
            class="-m-1 flex shrink-0 cursor-pointer rounded-full p-1 text-fg-3 transition-colors duration-fast hover:text-fg-1"
            aria-label="Dismiss"
            @click="emit('close')">
            <FpIcon name="icon-[lucide--x]" class="text-13" />
        </button>
    </div>
</template>

<style scoped>
/* In-flow alpha tints cannot overlap siblings. */
.alert {
    background: var(--alert-soft);
}
.alert-icon {
    color: var(--alert-ink);
}
[data-color='neutral'] {
    --alert-soft: var(--surf-bg-hi);
    --alert-ink: var(--text-3);
}
[data-color='success'] {
    --alert-soft: var(--success-soft);
    --alert-ink: var(--success);
}
[data-color='warning'] {
    --alert-soft: var(--warning-soft);
    --alert-ink: var(--warning);
}
[data-color='danger'] {
    --alert-soft: var(--danger-soft);
    --alert-ink: var(--danger);
}
[data-color='info'] {
    --alert-soft: var(--info-soft);
    --alert-ink: var(--info);
}
</style>
