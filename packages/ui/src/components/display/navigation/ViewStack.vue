<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue'

const props = withDefaults(
    defineProps<{
        view: string | number
        /** Navigation depth or tab order: higher slides forward, lower back, equal swaps instantly. */
        depth: number
        /** `y` slides vertically, matching a vertical tab rail. */
        axis?: 'x' | 'y'
        /** Off snaps the height, so a tall page animates on translate and opacity only. */
        morph?: boolean
    }>(),
    { axis: 'x', morph: true },
)

const box = useTemplateRef<HTMLElement>('box')
const back = ref(false)
const moving = ref(false)
const swapping = ref(false)

// Resolve direction before the keyed transition starts.
watch(
    () => [props.depth, props.view] as const,
    ([depth], [previous]) => {
        back.value = depth < previous
        moving.value = depth !== previous
    },
)

/** Preserve height before the leaving page drops out of flow. */
function hold(el: Element) {
    const page = el as HTMLElement
    // Keep keyboard focus out of a page that is on its way out.
    page.inert = true
    if (box.value === null || !moving.value) return
    if (props.morph) box.value.style.height = `${box.value.offsetHeight}px`
    page.style.height = `${page.offsetHeight}px`
    swapping.value = true
}

/** Resolve `auto` to pixels so CSS can animate the height. */
function animateHeight() {
    const frame = box.value
    if (frame === null || frame.style.height === '') return
    const from = frame.style.height
    frame.style.height = 'auto'
    const to = frame.offsetHeight
    frame.style.height = from
    // Force the browser to commit the start height before setting the target.
    void frame.offsetHeight
    frame.style.height = `${to}px`
}

/** Interrupted enters are re-held by the next swap. */
function release() {
    if (box.value !== null) box.value.style.height = ''
    swapping.value = false
}
</script>

<template>
    <!-- Avoid clipping focus rings and poppers once the swap finishes. -->
    <div
        ref="box"
        class="relative flex min-h-0 flex-auto flex-col transition-[height] duration-base ease-out [--fp-view-travel:100%] motion-simple:[--fp-view-travel:var(--shift-travel)]"
        :class="[
            swapping && 'overflow-clip',
            axis === 'y' && 'fp-view-y',
            morph && 'fp-view-morph',
        ]"
        :data-fp-view-swapping="swapping || undefined">
        <Transition
            :name="back ? 'fp-view-back' : 'fp-view-fwd'"
            :css="moving"
            @before-leave="hold"
            @enter="animateHeight"
            @after-enter="release">
            <div :key="view" class="flex min-h-0 flex-auto flex-col">
                <slot />
            </div>
        </Transition>
    </div>
</template>

<style scoped>
.fp-view-fwd-enter-active,
.fp-view-fwd-leave-active,
.fp-view-back-enter-active,
.fp-view-back-leave-active {
    transition:
        translate var(--dur-base) var(--ease-out),
        opacity var(--dur-base) var(--ease-out);
}
/* The leaving page drops out of layout after its height is pinned. */
.fp-view-fwd-leave-active,
.fp-view-back-leave-active {
    position: absolute;
    inset-inline: 0;
    top: 0;
}
/* The tweening box clips the entering page; squeezing it would give a scrolling page a scrollbar. */
.fp-view-morph > .fp-view-fwd-enter-active,
.fp-view-morph > .fp-view-back-enter-active {
    flex-shrink: 0;
}
/* Gamify carries the whole page; Simple only hints the direction (--shift-travel). */
.fp-view-fwd-enter-from,
.fp-view-back-leave-to {
    opacity: 0;
    translate: var(--fp-view-travel) 0;
}
.fp-view-fwd-leave-to,
.fp-view-back-enter-from {
    opacity: 0;
    translate: calc(var(--fp-view-travel) * -1) 0;
}
.fp-view-y > .fp-view-fwd-enter-from,
.fp-view-y > .fp-view-back-leave-to {
    translate: 0 var(--fp-view-travel);
}
.fp-view-y > .fp-view-fwd-leave-to,
.fp-view-y > .fp-view-back-enter-from {
    translate: 0 calc(var(--fp-view-travel) * -1);
}
</style>
