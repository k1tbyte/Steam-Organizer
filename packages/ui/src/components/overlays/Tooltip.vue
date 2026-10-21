<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed } from 'vue'
import { ARROW_PADDING, FLOAT_GAP, type Placement, splitPlacement } from '../../placement'
import Kbd from '../display/Kbd.vue'

const props = withDefaults(
    defineProps<{
        text?: string
        /** Shortcut chip after the text. */
        kbd?: string
        placement?: Placement
        sideOffset?: number
        delayDuration?: number
        disabled?: boolean
    }>(),
    { placement: 'top', sideOffset: FLOAT_GAP },
)

const anchor = computed(() => splitPlacement(props.placement))
</script>

<!-- Portaled popper motion uses the global fp-float styles. -->
<template>
    <TooltipRoot :delay-duration="delayDuration" :disabled="disabled || (!text && !$slots.content)">
        <TooltipTrigger as-child>
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
