<script setup lang="ts">
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import { computed, ref, watch } from 'vue'
import { useMotionLevel } from '../../../motion'

const props = withDefaults(
    defineProps<{
        disabled?: boolean
        /** Off snaps the height, for a measured parent (`FpModal`) or tall content. */
        morph?: boolean
    }>(),
    { morph: true },
)

const open = defineModel<boolean>('open', { default: false })

// Simple snaps the height: its tween lays the subtree out every frame.
const level = useMotionLevel()
const sliding = computed(() => props.morph && level.value !== 'simple')

// Clip during height animation without cutting focus rings at rest.
const clipped = ref(!open.value)

watch(open, (isOpen) => {
    if (!isOpen) clipped.value = true
})

// Animations bubble: only this element's own slide decides the clipping.
function onAnimation(event: AnimationEvent, done: boolean) {
    if (event.target !== event.currentTarget) return
    clipped.value = done ? !open.value : true
}
</script>

<template>
    <!-- Triggerless roots stay out of layout to avoid an empty flex item. -->
    <CollapsibleRoot
        v-model:open="open"
        :disabled="disabled"
        :class="$slots.trigger ? 'w-full' : 'contents'">
        <CollapsibleTrigger v-if="$slots.trigger" as-child>
            <slot name="trigger" :open="open" />
        </CollapsibleTrigger>
        <CollapsibleContent
            class="body"
            :class="[sliding && 'slide', sliding && clipped && 'overflow-hidden']"
            @animationstart="onAnimation($event, false)"
            @animationend="onAnimation($event, true)">
            <slot />
        </CollapsibleContent>
    </CollapsibleRoot>
</template>

<style scoped>
.slide[data-state='open'] {
    animation: slide-down var(--dur-base) var(--ease-out);
}
.body[data-state='open'] > * {
    animation: var(--animate-settle);
}
.slide[data-state='closed'] {
    animation: slide-up var(--dur-fast) var(--ease-out);
}
@keyframes slide-down {
    from {
        height: 0;
    }
    to {
        height: var(--reka-collapsible-content-height);
    }
}
@keyframes slide-up {
    from {
        height: var(--reka-collapsible-content-height);
    }
    to {
        height: 0;
    }
}
</style>
