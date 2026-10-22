<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed, ref } from 'vue'
import { useOverlayGate } from '../../composables/useOverlayGate'
import { ARROW_PADDING, FLOAT_GAP, type Placement, splitPlacement } from '../../placement'
import Kbd from '../display/Kbd.vue'

// The trigger takes the attrs, so a tooltip can sit inside another as-child trigger (a menu, a popover).
defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        text?: string
        /** Shortcut chip after the text. */
        kbd?: string
        /** The text also names the trigger: an icon-only control loses its name with `title`. */
        label?: boolean
        placement?: Placement
        sideOffset?: number
        delayDuration?: number
        disabled?: boolean
    }>(),
    { placement: 'top', sideOffset: FLOAT_GAP },
)

const anchor = computed(() => splitPlacement(props.placement))
const open = ref(false)
useOverlayGate(open)
</script>

<!-- Portaled popper motion uses the global fp-float styles. -->
<template>
    <TooltipRoot v-model:open="open" :delay-duration="delayDuration" :disabled="disabled || (!text && !$slots.content)">
        <TooltipTrigger as-child v-bind="$attrs" :aria-label="label ? text : undefined">
            <slot />
        </TooltipTrigger>
        <TooltipPortal>
            <TooltipContent
                :side="anchor.side"
                :align="anchor.align"
                :side-offset="sideOffset"
                :collision-padding="8"
                :arrow-padding="ARROW_PADDING"
                class="fp-float fp-tip surface-pop layer-float rounded-sm py-1.5 pl-2.5 text-12.5 text-fg-1"
                :class="kbd ? 'flex items-center gap-2 pr-1.75' : 'pr-2.5'">
                <slot name="content">{{ text }}</slot>
                <Kbd v-if="kbd" :value="kbd" class="shrink-0" />
                <TooltipArrow as-child><span class="fp-arrow" /></TooltipArrow>
            </TooltipContent>
        </TooltipPortal>
    </TooltipRoot>
</template>
