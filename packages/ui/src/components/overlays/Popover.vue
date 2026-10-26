<script setup lang="ts">
import { PopoverAnchor, PopoverArrow, PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useDesktopLayout } from '../../composables/useDesktopLayout'
import { useOpenedOnce } from '../../composables/useOpenedOnce'
import { useOverlayGate } from '../../composables/useOverlayGate'
import { ARROW_PADDING, FLOAT_GAP, type Placement, splitPlacement } from '../../placement'
import FpScrollArea from '../display/layout/ScrollArea.vue'
import FpDrawer from './Drawer.vue'

const props = withDefaults(
    defineProps<{
        placement?: Placement
        sideOffset?: number
        alignOffset?: number
        width?: string
        maxHeight?: string
        padded?: boolean
        /** Opens as a bottom sheet below `lg`. */
        sheet?: boolean
        /** Names the dialog; the content brings its own visible heading. */
        label?: string
        /** Floats at this element instead of a trigger: one popover for many targets (a list). */
        anchor?: HTMLElement
    }>(),
    {
        placement: 'bottom',
        sideOffset: FLOAT_GAP,
        alignOffset: 0,
        width: '16rem',
        padded: true,
    },
)

const sides = computed(() => splitPlacement(props.placement))
// Never taller than the space Reka measured, whatever the caller asks for.
const maxHeight = computed(() =>
    props.maxHeight
        ? `min(${props.maxHeight}, var(--reka-popper-available-height))`
        : 'var(--reka-popper-available-height)',
)

const open = defineModel<boolean>('open', { default: false })
useOverlayGate(open)
const opened = useOpenedOnce(open)

// Hydration renders the popover (the server has no layout); a later change waits
// for close, so crossing `lg` never remounts a live panel.
const desktop = useDesktopLayout()
const asSheet = ref(false)
function syncMode() {
    asSheet.value = props.sheet && !desktop.value
}
onMounted(syncMode)
watch([desktop, open, () => props.sheet], () => {
    if (!open.value) syncMode()
})

function close() {
    open.value = false
}

// Without a trigger, reka would close on a press of the anchor or focus landing there and return focus nowhere.
// Closing hands focus back to what held it (the menu button that opened a picker), else the anchor; a press outside keeps its own.
let back: HTMLElement | undefined
let outside = false
function keepOnAnchor(event: Event) {
    if (event.target instanceof Node && props.anchor?.contains(event.target)) event.preventDefault()
    else outside = true
}
// Reka focuses the first tabbable, the scroll area's viewport: a field marked `data-autofocus` (a picker's search) goes first.
function focusField(event: Event) {
    const held = document.activeElement
    back = held instanceof HTMLElement && held !== document.body ? held : props.anchor
    outside = false
    const field = event.target instanceof Element && event.target.querySelector<HTMLElement>('[data-autofocus]')
    if (!field) return
    event.preventDefault()
    field.focus()
}
function focusBack(event: Event) {
    if (!props.anchor) return
    event.preventDefault()
    if (!outside && back?.isConnected) back.focus()
}
</script>

<!-- Portaled popper motion uses the global fp-float styles. -->
<template>
    <FpDrawer v-if="asSheet" v-model:open="open" :title="label ?? ''" bare>
        <template v-if="$slots.default" #trigger>
            <slot />
        </template>
        <div :class="{ 'p-4': padded }">
            <slot name="content" :close="close" />
        </div>
    </FpDrawer>
    <PopoverRoot v-else v-model:open="open">
        <PopoverAnchor v-if="anchor" :reference="anchor" as-child />
        <PopoverTrigger v-else-if="$slots.default" as-child>
            <slot />
        </PopoverTrigger>
        <PopoverPortal v-if="opened">
            <PopoverContent
                :side="sides.side"
                :align="sides.align"
                :side-offset="sideOffset"
                :align-offset="alignOffset"
                :collision-padding="8"
                :arrow-padding="ARROW_PADDING"
                :aria-label="label"
                @pointer-down-outside="keepOnAnchor"
                @focus-outside="keepOnAnchor"
                @open-auto-focus="focusField"
                @close-auto-focus="focusBack"
                class="fp-float surface-pop layer-float flex flex-col rounded-md"
                :style="{ width, maxHeight }">
                <FpScrollArea class="min-h-0">
                    <div :class="{ 'p-3.5': padded }">
                        <slot name="content" :close="close" />
                    </div>
                </FpScrollArea>
                <PopoverArrow as-child><span class="fp-arrow" /></PopoverArrow>
            </PopoverContent>
        </PopoverPortal>
    </PopoverRoot>
</template>
