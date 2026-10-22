<script setup lang="ts">
import {
    DropdownMenuArrow,
    DropdownMenuContent,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuTrigger,
    Slot,
} from 'reka-ui'
import { computed, useId } from 'vue'
import { useOpenedOnce } from '../../composables/useOpenedOnce'
import { useOverlayGate } from '../../composables/useOverlayGate'
import { ARROW_PADDING, FLOAT_GAP, type Placement, splitPlacement } from '../../placement'
import FpScrollArea from '../display/layout/ScrollArea.vue'
import MenuItems from './MenuItems.vue'
import { type MenuEntries, menuGroups } from './menu'

const props = withDefaults(
    defineProps<{
        items: MenuEntries
        placement?: Placement
        sideOffset?: number
        alignOffset?: number
        /** A fixed width (`14.5rem`); by default the menu fits its items. */
        width?: string
        disabled?: boolean
    }>(),
    { placement: 'bottom-start', sideOffset: FLOAT_GAP, alignOffset: 0 },
)

const anchor = computed(() => splitPlacement(props.placement))

const open = defineModel<boolean>('open', { default: false })
useOverlayGate(open)
const opened = useOpenedOnce(open)
// Reka names the menu as its content mounts: after the trigger renders, on the first open.
const menuId = useId()

const groups = computed(() => menuGroups(props.items))
</script>

<!-- Portaled menu chrome and motion use global styles. -->
<template>
    <DropdownMenuRoot v-model:open="open">
        <DropdownMenuTrigger as-child :disabled="disabled">
            <Slot :aria-controls="open ? menuId : undefined"><slot /></Slot>
        </DropdownMenuTrigger>
        <DropdownMenuPortal v-if="opened">
            <DropdownMenuContent
                :id="menuId"
                :side="anchor.side"
                :align="anchor.align"
                :side-offset="sideOffset"
                :align-offset="alignOffset"
                :collision-padding="8"
                :arrow-padding="ARROW_PADDING"
                class="fp-float fp-menu surface-pop layer-float min-w-44 rounded-md"
                :style="{ width }">
                <FpScrollArea class="min-h-0"><MenuItems :groups /></FpScrollArea>
                <DropdownMenuArrow as-child><span class="fp-arrow" /></DropdownMenuArrow>
            </DropdownMenuContent>
        </DropdownMenuPortal>
    </DropdownMenuRoot>
</template>
