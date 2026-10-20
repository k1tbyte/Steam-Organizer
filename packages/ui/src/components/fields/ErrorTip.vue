<script setup lang="ts">
import {
    PopoverAnchor,
    PopoverArrow,
    PopoverContent,
    PopoverPortal,
    PopoverRoot,
} from 'reka-ui'
import { computed, ref, useId, watch } from 'vue'
import { useTimer } from '../../composables/useTimer'
import { type Placement, splitPlacement } from '../../placement'
import { provideFormField, useFormField } from './FormField/form-field'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        error?: string
        placement?: Placement
        sideOffset?: number
        persistent?: boolean
        duration?: number
    }>(),
    { placement: 'top-start', sideOffset: 2, persistent: true },
)

const anchor = computed(() => splitPlacement(props.placement))

if (!useFormField()) {
    provideFormField({ id: useId(), invalid: computed(() => Boolean(props.error)) })
}

const settled = ref(false)
const hovered = ref(false)
const focused = ref(false)
const timedOut = ref(false)

const visible = computed(() => {
    if (!props.error) return false
    if (hovered.value || focused.value) return true
    if (props.duration) return !timedOut.value
    if (props.persistent) return true
    return !settled.value
})

const timer = useTimer()
function armTimer() {
    timer.cancel()
    if (!props.duration || !props.error) return
    timedOut.value = false
    timer.arm(props.duration, () => {
        timedOut.value = true
    })
}

watch(
    () => props.error,
    (error, previous) => {
        if (!error || error === previous) return
        if (!focused.value) settled.value = false
        armTimer()
    },
    { immediate: true },
)

function onPointerLeave() {
    hovered.value = false
    armTimer()
}

function onFocusOut(event: FocusEvent) {
    const next = event.relatedTarget
    if (
        next instanceof Node &&
        event.currentTarget instanceof HTMLElement &&
        event.currentTarget.contains(next)
    ) {
        return
    }
    focused.value = false
    settled.value = true
    armTimer()
}

function keepFocus(event: Event) {
    event.preventDefault()
}
</script>

<template>
    <PopoverRoot :open="visible">
        <PopoverAnchor
            as-child
            @pointerenter="hovered = true"
            @pointerleave="onPointerLeave"
            @focusin="focused = true"
            @focusout="onFocusOut">
            <slot />
        </PopoverAnchor>
        <PopoverPortal>
            <PopoverContent
                :side="anchor.side"
                :align="anchor.align"
                :side-offset="sideOffset"
                :collision-padding="8"
                :arrow-padding="8"
                :hide-shifted-arrow="false"
                class="fp-float fp-tip fp-error-tip layer-float flex items-center rounded bg-danger px-2.5 py-1 font-medium text-danger-fg text-xs shadow-lg"
                @open-auto-focus="keepFocus"
                @close-auto-focus="keepFocus">
                {{ error }}
                <PopoverArrow class="fill-danger" />
            </PopoverContent>
        </PopoverPortal>
    </PopoverRoot>
</template>

<style>
.fp-error-tip {
    --arrow-inset: calc(var(--radius) + 2px);
}

.fp-error-tip[data-side="top"][data-align="start"] > span,
.fp-error-tip[data-side="bottom"][data-align="start"] > span {
    left: var(--arrow-inset) !important;
}
.fp-error-tip[data-side="top"][data-align="end"] > span,
.fp-error-tip[data-side="bottom"][data-align="end"] > span {
    left: auto !important;
    right: var(--arrow-inset) !important;
}
.fp-error-tip[data-side="left"][data-align="start"] > span,
.fp-error-tip[data-side="right"][data-align="start"] > span {
    top: calc(var(--arrow-inset) + 2.5px) !important;
}
.fp-error-tip[data-side="left"][data-align="end"] > span,
.fp-error-tip[data-side="right"][data-align="end"] > span {
    top: auto !important;
    bottom: calc(var(--arrow-inset) + 2.5px) !important;
}
</style>
