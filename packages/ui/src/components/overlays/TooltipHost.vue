<script setup lang="ts">
import { TooltipArrow, TooltipContent, TooltipPortal, TooltipProvider, TooltipRoot } from 'reka-ui'
import { computed, ref, shallowRef } from 'vue'
import { ARROW_PADDING, FLOAT_GAP, type Placement, splitPlacement } from '../../placement'
import TooltipHostTrigger from './TooltipHostTrigger.vue'

withDefaults(defineProps<{ delay?: number }>(), { delay: 400 })

const target = shallowRef<HTMLElement>()
const text = ref('')
const anchor = computed(() =>
    splitPlacement((target.value?.dataset.tipPlacement as Placement | undefined) ?? 'top'),
)
</script>

<!-- The app's one tooltip, mounted once per root. Portaled popper motion uses the global fp-float styles. -->
<template>
    <TooltipProvider :delay-duration="delay">
        <TooltipRoot>
            <TooltipHostTrigger v-model:target="target" v-model:text="text" />
            <TooltipPortal>
                <TooltipContent
                    :side="anchor.side"
                    :align="anchor.align"
                    :side-offset="FLOAT_GAP"
                    :collision-padding="8"
                    :arrow-padding="ARROW_PADDING"
                    hide-when-detached
                    :aria-label="text"
                    class="fp-float fp-tip surface-pop layer-float rounded-sm px-2.5 py-1.5 text-12.5 text-fg-1">
                    {{ text }}
                    <TooltipArrow as-child><span class="fp-arrow" /></TooltipArrow>
                </TooltipContent>
            </TooltipPortal>
        </TooltipRoot>
    </TooltipProvider>
</template>
