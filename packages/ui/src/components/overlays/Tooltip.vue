<script setup lang="ts">
import { TooltipContent, TooltipPortal, TooltipRoot, TooltipTrigger } from 'reka-ui'
import { computed } from 'vue'
import { type Placement, splitPlacement } from '../../placement'

const props = withDefaults(
    defineProps<{
        text?: string
        placement?: Placement
        sideOffset?: number
        delayDuration?: number
        disabled?: boolean
    }>(),
    { placement: 'top', sideOffset: 8 },
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
                class="fp-float fp-tip surface layer-float rounded px-2.5 py-1 text-fg-1 text-xs">
                <slot name="content">{{ text }}</slot>
            </TooltipContent>
        </TooltipPortal>
    </TooltipRoot>
</template>
