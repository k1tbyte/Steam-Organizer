<script setup lang="ts">
import { CheckboxRoot, Label } from 'reka-ui'
import { useId } from 'vue'

type Size = 'sm' | 'md' | 'lg'

withDefaults(
    defineProps<{
        label?: string
        description?: string
        /** Name for a checkbox with no visible `label` (a table row). */
        ariaLabel?: string
        size?: Size
        disabled?: boolean
    }>(),
    { size: 'md' },
)

const checked = defineModel<boolean | 'indeterminate'>({ default: false })
const id = useId()

const SIZES: Record<Size, { box: string; label: string; hint: string }> = {
    sm: { box: 'size-4', label: 'text-13', hint: 'text-12' },
    md: { box: 'size-4.5', label: 'text-13.5', hint: 'text-12.5' },
    lg: { box: 'size-5', label: 'text-15', hint: 'text-13' },
}
</script>

<template>
    <div class="flex items-start gap-2.5">
        <CheckboxRoot
            :id="id"
            v-model="checked"
            :aria-label="ariaLabel"
            :disabled="disabled"
            class="box touch-target relative flex shrink-0 items-center justify-center rounded-xs text-accent-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-50"
            :class="SIZES[size].box">
            <svg
                viewBox="0 0 24 24"
                class="relative size-3/4"
                fill="none"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true">
                <path class="mark" pathLength="1" d="m4.5 12.5 5 5 10-11" />
                <path class="dash" pathLength="1" d="M5 12h14" />
            </svg>
        </CheckboxRoot>
        <div v-if="label || description" class="flex flex-col gap-0.5">
            <Label :for="id" class="font-medium text-fg-1" :class="SIZES[size].label">{{ label }}</Label>
            <p v-if="description" class="text-fg-3" :class="SIZES[size].hint">{{ description }}</p>
        </div>
    </div>
</template>

<style scoped>
.box {
    background: transparent;
    box-shadow: inset 0 0 0 1.5px var(--stroke-2);
    transition:
        box-shadow var(--dur-base) var(--ease-out),
        scale var(--dur-fast) var(--ease-out);
}
.box[data-state='unchecked']:hover {
    box-shadow: inset 0 0 0 1.5px var(--stroke-3);
}
.box:active {
    scale: 0.92;
}
.box[data-state='checked'],
.box[data-state='indeterminate'] {
    box-shadow: none;
}

.box::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--accent);
    opacity: 0;
    scale: 0.6;
    transition:
        scale var(--dur-press) var(--ease-out),
        opacity var(--dur-fast) var(--ease-out),
        background-color var(--dur-fast) var(--ease-out);
}
.box[data-state='checked']::before,
.box[data-state='indeterminate']::before {
    opacity: 1;
    scale: 1;
}
.box[data-state='checked']:hover::before,
.box[data-state='indeterminate']:hover::before {
    background: var(--accent-hover);
}

.mark {
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    transition: stroke-dashoffset var(--dur-press) var(--ease-out);
}
.box[data-state='checked'] .mark {
    stroke-dashoffset: 0;
    transition: stroke-dashoffset var(--dur-fast) linear var(--dur-stagger);
}

.dash {
    opacity: 0;
    scale: 0;
    transform-origin: center;
    transition:
        scale var(--dur-fast) var(--ease-spring),
        opacity var(--dur-press) linear;
}
.box[data-state='indeterminate'] .dash {
    opacity: 1;
    scale: 1;
}
</style>
