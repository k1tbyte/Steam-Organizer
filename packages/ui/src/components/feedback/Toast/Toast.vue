<script setup lang="ts">
import { ToastAction, ToastClose, ToastDescription, ToastRoot, ToastTitle } from 'reka-ui'
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import Button from '../../buttons/Button.vue'
import FpIcon from '../../display/media/Icon.vue'
import type { ToastItem, ToastStack } from './toast'

defineProps<{
    toast: ToastItem
    stack: ToastStack
    edge: 'top' | 'bottom'
}>()
const emit = defineEmits<{ dismiss: []; gone: []; mounted: []; resize: [height: number] }>()

// setTimeout's ceiling: Reka keeps a running timer when the duration turns Infinity.
const STICKY_MS = 2_147_483_647

// The store forgets a toast once its exit has played, so it never cuts the animation.
const EXIT_ANIMATIONS = new Set(['fp-toast-out', 'fp-toast-swipe-out'])
const paused = ref(false)

function onAnimationEnd(event: AnimationEvent) {
    if (EXIT_ANIMATIONS.has(event.animationName)) emit('gone')
}

const DOT_COLORS: Record<NonNullable<ToastItem['color']>, string> = {
    neutral: 'bg-fg-3',
    success: 'bg-success',
    warning: 'bg-warning',
    danger: 'bg-danger',
    info: 'bg-info',
}

// Measure inner content because the stack forces the outer height.
const content = useTemplateRef('content')
onMounted(() => {
    const el = content.value
    if (!el) return
    emit('mounted')
    const report = () => emit('resize', el.offsetHeight)
    report()
    const observer = new ResizeObserver(report)
    observer.observe(el)
    onUnmounted(() => observer.disconnect())
})
</script>

<template>
    <!-- CSS variables compose stack, entrance, exit, and swipe transforms. -->
    <ToastRoot
        v-slot="{ remaining, duration: totalDuration }"
        :open="toast.open"
        :duration="toast.duration === 0 ? STICKY_MS : toast.duration"
        class="fp-toast pointer-events-auto absolute inset-x-4"
        :class="edge === 'top' ? 'top-4 origin-top' : 'bottom-4 origin-bottom'"
        :style="{
            '--stack-y': `${stack.y}px`,
            '--stack-scale': String(stack.scale),
            '--stack-opacity': String(stack.opacity),
            zIndex: stack.z,
            height: stack.height === undefined ? undefined : `${stack.height}px`,
            pointerEvents: stack.opacity === 0 ? 'none' : undefined,
        }"
        @pause="paused = true"
        @resume="paused = false"
        @animationend="onAnimationEnd"
        @update:open="(value) => !value && emit('dismiss')">
        <!-- Cards hidden deep in the stack must not take focus or clicks. -->
        <div class="fp-toast-panel surface h-full overflow-hidden rounded" :inert="stack.opacity === 0 || undefined">
            <div ref="content" class="fp-toast-body flex flex-col gap-2 p-4">
                <div class="flex items-start gap-2.5">
                    <span class="fp-toast-dot mt-1.5 size-2 shrink-0 rounded-full" :class="DOT_COLORS[toast.color ?? 'neutral']" />
                    <div class="min-w-0 flex-1">
                        <ToastTitle class="font-medium text-fg-1 text-sm">{{ toast.title }}</ToastTitle>
                        <ToastDescription v-if="toast.description" class="mt-0.5 text-fg-3 text-xs">
                            {{ toast.description }}
                        </ToastDescription>
                    </div>
                    <ToastClose
                        class="touch-target -m-1 shrink-0 cursor-pointer rounded-full p-1 text-fg-3 transition-colors duration-fast hover:text-fg-1"
                        aria-label="Dismiss">
                        <FpIcon name="icon-[lucide--x]" class="text-sm" />
                    </ToastClose>
                </div>
                <div v-if="toast.actions?.length" class="flex justify-end gap-2 ps-4.5">
                    <ToastAction v-for="action in toast.actions" :key="action.label" as-child :alt-text="action.label">
                        <Button size="sm" variant="soft" :label="action.label" @click="action.onClick()" />
                    </ToastAction>
                </div>
            </div>
            <!-- ToastViewport already pauses this countdown on hover or focus. -->
            <div
                v-if="toast.duration !== 0 && totalDuration"
                class="fp-toast-timer absolute inset-x-0 bottom-0 h-0.5 origin-left"
                :class="DOT_COLORS[toast.color ?? 'neutral']"
                :data-paused="paused || undefined"
                :style="{ transform: `scaleX(${remaining / totalDuration})` }" />
        </div>
    </ToastRoot>
</template>

<!-- ToastRoot teleports from a fragment root, so scoped selectors cannot reach it. -->
<!-- Global classes remain fp-prefixed. -->
<style>
/* The outer item owns geometry; opacity stays on the glass panel. */
/* Opacity on the ancestor would isolate and disable its backdrop filter. */
.fp-toast {
    transform: translateY(var(--stack-y, 0px)) scale(var(--stack-scale, 1));
    transition:
        transform var(--dur-slow) var(--ease-spring),
        height var(--dur-base) var(--ease-out);
}
/* Gap bridges keep the stack expanded while the pointer crosses between toasts. */
.fp-toast::before,
.fp-toast::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 8px;
}
.fp-toast::before {
    bottom: 100%;
}
.fp-toast::after {
    top: 100%;
}
.fp-toast-panel {
    box-shadow: 0 12px 32px -12px color-mix(in oklch, black 50%, transparent);
    opacity: var(--stack-opacity, 1);
    transition: opacity var(--dur-base) var(--ease-out);
}
.fp-toast-timer {
    opacity: 0.6;
    transition: opacity var(--dur-fast) var(--ease-out);
}
.fp-toast-timer[data-paused] {
    opacity: 1;
}

/* Arrival is the authored moment: the card rises from its edge and overshoots,
   the text lands a beat later and the status dot pops in last. */
.fp-toast[data-state='open'] {
    animation: fp-toast-in var(--dur-slow) var(--ease-spring);
}
.fp-toast[data-state='open'] .fp-toast-panel {
    animation: fade-in var(--dur-fast) var(--ease-out);
}
.fp-toast[data-state='open'] .fp-toast-body {
    animation: fp-toast-land var(--dur-base) var(--ease-out) var(--dur-stagger) backwards;
}
.fp-toast[data-state='open'] .fp-toast-dot {
    animation: pop var(--dur-slow) var(--ease-spring) var(--dur-fast) backwards;
}

/* Departure is shorter and accelerates away. */
.fp-toast[data-state='closed'] {
    animation: fp-toast-out var(--dur-fast) var(--ease-in) forwards;
}
.fp-toast[data-state='closed'] .fp-toast-panel {
    animation: fade-out var(--dur-fast) var(--ease-in) forwards;
}

/* A cancelled swipe springs home through the transform transition above. */
.fp-toast[data-swipe='move'] {
    transform: translateY(var(--stack-y, 0px))
        translate(var(--reka-toast-swipe-move-x, 0px), var(--reka-toast-swipe-move-y, 0px))
        scale(var(--stack-scale, 1));
    transition: none;
}
/* A released swipe keeps travelling until it clears the screen edge. */
.fp-toast[data-swipe='end'] {
    animation: fp-toast-swipe-out var(--dur-base) var(--ease-out) forwards;
}
.fp-toast[data-swipe='end'] .fp-toast-panel {
    animation: fade-out var(--dur-base) var(--ease-in) forwards;
}

@keyframes fp-toast-in {
    from {
        transform: translateY(var(--stack-y, 0px)) translateY(var(--toast-enter-y, 1rem))
            scale(calc(var(--stack-scale, 1) * 0.96));
    }
}

@keyframes fp-toast-out {
    to {
        transform: translateY(var(--stack-y, 0px)) translateY(var(--toast-exit-y, 0.5rem))
            scale(calc(var(--stack-scale, 1) * 0.96));
    }
}

@keyframes fp-toast-swipe-out {
    from {
        transform: translateY(var(--stack-y, 0px))
            translate(var(--reka-toast-swipe-end-x, 0px), var(--reka-toast-swipe-end-y, 0px))
            scale(var(--stack-scale, 1));
    }
    to {
        transform: translateY(var(--stack-y, 0px))
            translate(
                calc(var(--reka-toast-swipe-end-x, 0px) + var(--toast-off-x, 0px)),
                calc(var(--reka-toast-swipe-end-y, 0px) + var(--toast-off-y, 0px))
            )
            scale(var(--stack-scale, 1));
    }
}

@keyframes fp-toast-land {
    from {
        opacity: 0;
        translate: 0 0.25rem;
    }
}

</style>
