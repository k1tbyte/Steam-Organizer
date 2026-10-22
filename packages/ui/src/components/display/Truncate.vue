<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'

import { useClipped } from '../../composables/useClipped'
import { tip } from '../overlays/tip'

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
    <component :is="as" ref="el" v-bind="{ ...$attrs, ...tip(text, { disabled: !clipped }) }" class="truncate">
        <slot>{{ text }}</slot>
    </component>
</template>
