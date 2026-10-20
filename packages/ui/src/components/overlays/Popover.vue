<script setup lang="ts">
import { PopoverContent, PopoverPortal, PopoverRoot, PopoverTrigger } from 'reka-ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useDesktopLayout } from '../../composables/useDesktopLayout'
import { type Placement, splitPlacement } from '../../placement'
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
    }>(),
    {
        placement: 'bottom',
        sideOffset: 8,
        alignOffset: 0,
        width: '18rem',
        padded: true,
    },
)

const anchor = computed(() => splitPlacement(props.placement))
// Never taller than the space Reka measured, whatever the caller asks for.
const maxHeight = computed(() =>
    props.maxHeight
        ? `min(${props.maxHeight}, var(--reka-popper-available-height))`
        : 'var(--reka-popper-available-height)',
)

const open = defineModel<boolean>('open', { default: false })

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
</script>

<!-- Portaled popper motion uses the global fp-float styles. -->
<template>
    <FpDrawer v-if="asSheet" v-model:open="open" :title="label ?? ''" bare>
        <template #trigger>
            <slot />
        </template>
        <div :class="{ 'p-4': padded }">
            <slot name="content" :close="close" />
        </div>
    </FpDrawer>
    <PopoverRoot v-else v-model:open="open">
        <PopoverTrigger as-child>
            <slot />
        </PopoverTrigger>
        <PopoverPortal>
            <PopoverContent
                :side="anchor.side"
                :align="anchor.align"
                :side-offset="sideOffset"
                :align-offset="alignOffset"
                :collision-padding="8"
                :aria-label="label"
                class="fp-float surface-pop layer-float flex flex-col overflow-hidden rounded-lg"
                :style="{ width, maxHeight }">
                <div class="fp-scroll" :class="{ 'p-2.5': padded }">
                    <slot name="content" :close="close" />
                </div>
            </PopoverContent>
        </PopoverPortal>
    </PopoverRoot>
</template>
