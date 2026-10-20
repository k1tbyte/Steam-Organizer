<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'

import { useClipped } from '../../composables/useClipped'
import FpTooltip from '../overlays/Tooltip.vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
    defineProps<{
        /** The full text: shown as a tooltip only while it is cut off. */
        text: string
        as?: string
    }>(),
    { as: 'span' },
)

const el = useTemplateRef<HTMLElement>('el')
const { clipped, check } = useClipped(el)
watch(
    () => props.text,
    () => nextTick(check),
)
</script>

<template>
    <FpTooltip :text="text" :disabled="!clipped">
        <component :is="as" ref="el" v-bind="$attrs" class="truncate">
            <slot>{{ text }}</slot>
        </component>
    </FpTooltip>
</template>
