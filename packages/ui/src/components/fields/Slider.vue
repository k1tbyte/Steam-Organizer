<script setup lang="ts">
import { SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'
import { computed } from 'vue'

import { useFormField } from './FormField/form-field'

type Size = 'xs' | 'sm' | 'md' | 'lg'

const props = withDefaults(
    defineProps<{
        min?: number
        max?: number
        step?: number
        size?: Size
        /** Names the grip when the slider stands outside a form field. */
        label?: string
        discrete?: boolean
        bubble?: boolean
        focusRing?: boolean
        round?: boolean
        disabled?: boolean
    }>(),
    { min: 0, max: 100, step: 1, size: 'md' },
)

// Avoid turning dense stop marks into a dashed line.
const MAX_MARKS = 20

const SIZES: Record<Size, string> = { xs: '1', sm: '3', md: '4.5', lg: '6.5' }

// Keep reka's thumb array internal while preserving the caller's model shape.
const model = defineModel<number | number[]>({ default: 0 })
const values = computed({
    get: () => (Array.isArray(model.value) ? model.value : [model.value]),
    set: (value) => {
        model.value = Array.isArray(model.value) ? value : (value[0] ?? props.min)
    },
})
const field = useFormField()

const range = computed(() => values.value.length > 1)
const from = computed(() => (range.value ? fraction(values.value[0] ?? props.min) : 0))
const to = computed(() => fraction(values.value.at(-1) ?? props.min))
const split = computed(() => props.discrete && !range.value)

// Keep held marks mounted so they fade back in after the grip moves.
const marks = computed(() => {
    const count = (props.max - props.min) / props.step
    if (!props.discrete || !Number.isInteger(count) || count < 1 || count > MAX_MARKS) return []
    return Array.from({ length: count + 1 }, (_, i) => props.min + i * props.step).map((mark) => ({
        mark,
        at: fraction(mark),
        on: covered(fraction(mark)),
        held: values.value.some((value) => Math.abs(value - mark) < props.step / 2),
    }))
})

const rootStyle = computed(() => ({
    '--sl-h': `calc(var(--spacing) * ${SIZES[props.size]})`,
    '--sl-from': from.value,
    '--sl-to': to.value,
}))

function fraction(value: number) {
    const span = props.max - props.min
    if (span <= 0) return 0
    return Math.min(1, Math.max(0, (value - props.min) / span))
}

function covered(at: number) {
    return at < to.value && (!range.value || at > from.value)
}

function thumbId(index: number) {
    if (!field) return undefined
    return index === 0 ? field.id : `${field.id}-${index}`
}
</script>

<template>
    <SliderRoot
        v-model="values"
        as="fieldset"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :aria-labelledby="field?.labelledBy?.value"
        :data-discrete="split || undefined"
        :data-range="range || undefined"
        :data-size="size"
        :data-focus-ring="focusRing || undefined"
        :data-round="round || undefined"
        :style="rootStyle"
        class="slider relative m-0 flex w-full min-w-0 touch-none select-none items-center border-0 data-disabled:pointer-events-none data-disabled:opacity-50">
        <SliderTrack class="track relative grow overflow-hidden">
            <span class="rest" />
            <span class="fill" />
            <span
                v-for="mark in marks"
                :key="mark.mark"
                class="mark"
                :class="[mark.on && 'mark-on', mark.held && 'mark-held']"
                :style="{ '--sl-at': mark.at }" />
        </SliderTrack>
        <span
            v-if="bubble && !range"
            class="bubble surface-pop rounded-sm px-2.5 py-1 text-12 text-fg-1"
            aria-hidden="true">
            <slot name="value" :value="values[0] ?? min">{{ values[0] ?? min }}</slot>
        </span>
        <!-- The grip is the control a reader lands on, so a slider outside a form
             field names it here rather than on the fieldset around it. -->
        <SliderThumb
            v-for="(_, index) in values"
            :key="index"
            :id="thumbId(index)"
            :aria-label="values.length === 1 ? label : undefined"
            :aria-labelledby="values.length === 1 ? field?.labelledBy?.value : undefined"
            :aria-invalid="field?.invalid.value || undefined"
            :aria-describedby="field?.describedBy?.value"
            class="grip" />
    </SliderRoot>
</template>

<style scoped>
.slider {
    --sl-r: calc(var(--sl-h) / 4);
    --sl-grip-w: max(3px, calc(var(--sl-h) / 6));
    --sl-gap: calc(var(--sl-h) / 3.5);
    --sl-mark: var(--sl-grip-w);
    --sl-thumb-w: var(--sl-grip-w);
    /* Align marks and breaks to reka's inset thumb span. */
    --sl-x: calc(var(--sl-to) * (100% - var(--sl-thumb-w)) + var(--sl-thumb-w) / 2);
    /* Animate snapped stops without adding lag to continuous dragging. */
    --sl-move: 0s;
    padding: calc(var(--sl-h) / 3) 0;
}
.slider[data-round] {
    --sl-r: calc(infinity * 1px);
}
/* The wider thumb box supplies both the break and a usable pointer target. */
.slider[data-discrete] {
    --sl-thumb-w: calc(var(--sl-grip-w) + 2 * var(--sl-gap));
    --sl-move: var(--dur-fast);
}
.track {
    height: var(--sl-h);
    border-radius: var(--sl-r);
}
.rest,
.fill {
    position: absolute;
    inset-block: 0;
    border-radius: var(--sl-r);
    transition: inset var(--sl-move) var(--ease-spring);
}
.rest {
    inset-inline: 0;
    background: var(--surf-bg-hi);
    box-shadow: inset 0 0 0 1px var(--stroke-2);
}
/* Use the full span so the fill is empty at minimum and complete at maximum. */
.fill {
    inset-inline-start: 0;
    inset-inline-end: calc(100% - var(--sl-to) * 100%);
    background: var(--accent);
    border-start-end-radius: 0;
    border-end-end-radius: 0;
}
.slider[data-range] .fill {
    inset-inline-start: calc(var(--sl-from) * 100%);
    border-start-start-radius: 0;
    border-end-start-radius: 0;
}
.slider[data-discrete] .fill {
    inset-inline-end: calc(100% - var(--sl-x) + var(--sl-thumb-w) / 2);
    border-radius: var(--sl-r);
}
.slider[data-discrete] .rest {
    inset-inline-start: calc(var(--sl-x) + var(--sl-thumb-w) / 2);
}
.mark {
    position: absolute;
    top: 50%;
    inset-inline-start: calc(var(--sl-at) * (100% - var(--sl-thumb-w)) + var(--sl-thumb-w) / 2);
    width: var(--sl-mark);
    height: var(--sl-mark);
    translate: -50% -50%;
    border-radius: 999px;
    background: var(--text-3);
    transition:
        background-color var(--dur-fast) var(--ease-out),
        opacity var(--dur-fast) var(--ease-out);
}
.mark-on {
    background: var(--accent-fg);
    opacity: 0.45;
}
.mark-held {
    opacity: 0;
}
/* Flex centers the taller discrete grip on the track. */
.grip {
    top: 50%;
    translate: 0 -50%;
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--sl-thumb-w);
    height: var(--sl-h);
    cursor: grab;
    outline: none;
    transition: inset var(--sl-move) var(--ease-spring);
}
.grip:active {
    cursor: grabbing;
}
.grip::before {
    content: '';
    width: var(--sl-grip-w);
    /* Preserve a lozenge shape on the thinnest track. */
    height: max(5px, calc(var(--sl-h) * 0.58));
    border-radius: 999px;
    background: var(--text-1);
    box-shadow: 0 1px 3px color-mix(in oklch, black 30%, transparent);
    transition: scale var(--dur-fast) var(--ease-out);
}
.slider[data-discrete] .grip::before {
    height: calc(var(--sl-h) * 1.26);
    background: var(--accent);
    box-shadow: none;
}
.grip:hover::before,
.grip:focus-visible::before {
    scale: 1.3 1.08;
}
.slider[data-focus-ring]:has(.grip:focus-visible) .track {
    outline: 2px solid var(--accent);
    outline-offset: 3px;
}
/* Keep the bubble usable in fullscreen and synchronized during dragging. */
.bubble {
    position: absolute;
    bottom: 100%;
    inset-inline-start: var(--sl-x);
    translate: -50% 0;
    scale: 0.92;
    transform-origin: bottom center;
    opacity: 0;
    white-space: nowrap;
    pointer-events: none;
    transition:
        inset var(--sl-move) var(--ease-spring),
        opacity var(--dur-fast) var(--ease-out),
        scale var(--dur-fast) var(--ease-out);
}
.slider:hover .bubble,
.slider:active .bubble,
.slider:has(.grip:focus-visible) .bubble {
    opacity: 1;
    scale: 1;
}

/* xs is the plain range control: a hairline track and a round grip. */
.slider[data-size='xs'] {
    --sl-r: calc(infinity * 1px);
    --sl-grip-w: 1rem;
    padding: 0.5rem 0;
}
.slider[data-size='xs'] .rest {
    background: var(--stroke-2);
    box-shadow: none;
}
.slider[data-size='xs'] .grip {
    height: 1rem;
}
.slider[data-size='xs'] .grip::before {
    height: 1rem;
    background: var(--accent);
    box-shadow: none;
}
.slider[data-size='xs'] .grip:hover::before,
.slider[data-size='xs'] .grip:focus-visible::before {
    scale: 1.15;
}
</style>
