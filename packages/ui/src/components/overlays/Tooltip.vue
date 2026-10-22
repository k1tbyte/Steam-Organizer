<script setup lang="ts">
import { Slot } from 'reka-ui'
import type { Placement } from '../../placement'

// The trigger takes the attrs, so a tooltip can sit inside another as-child trigger (a menu, a popover).
defineOptions({ inheritAttrs: false })

withDefaults(
    defineProps<{
        text?: string
        /** The text also names the trigger: an icon-only control loses its name with `title`. */
        label?: boolean
        placement?: Placement
        disabled?: boolean
    }>(),
    { placement: 'top' },
)
</script>

<!-- Only marks the trigger: `FpTooltipHost` shows the one bubble for whichever `data-tip` is hovered or focused.
     `data-grace-area-trigger` is reka's own trigger mark: its hover grace area treats the element as a trigger. -->
<template>
    <Slot
        v-bind="$attrs"
        :data-tip="disabled ? undefined : text || undefined"
        :data-tip-placement="placement === 'top' ? undefined : placement"
        :data-grace-area-trigger="disabled || !text ? undefined : ''"
        :aria-label="label ? text : undefined">
        <slot />
    </Slot>
</template>
