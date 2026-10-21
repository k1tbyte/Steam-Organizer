<script setup lang="ts">
import { ToastAction, ToastClose, ToastDescription, ToastRoot, ToastTitle } from 'reka-ui'
import { computed, onMounted, onUnmounted, useTemplateRef } from 'vue'
import Button from '../../buttons/Button.vue'
import FpIcon from '../../display/media/Icon.vue'
import type { ToastItem, ToastStack } from './toast'

const props = defineProps<{
    toast: ToastItem
    stack: ToastStack
    edge: 'top' | 'bottom'
    dismissLabel: string
}>()
const emit = defineEmits<{ dismiss: []; gone: []; mounted: []; resize: [height: number] }>()

// setTimeout's ceiling: Reka keeps a running timer when the duration turns Infinity.
const STICKY_MS = 2_147_483_647

// The store forgets a toast once its exit has played, so it never cuts the animation.
const EXIT_ANIMATIONS = new Set(['fp-toast-out', 'fp-toast-swipe-out'])

function onAnimationEnd(event: AnimationEvent) {
    if (EXIT_ANIMATIONS.has(event.animationName)) emit('gone')
}

// A neutral toast has no icon.
const TONES: Record<NonNullable<ToastItem['color']>, { icon?: string; text?: string; bar: string }> = {
    neutral: { bar: 'bg-fg-3' },
    success: { icon: 'icon-[lucide--circle-check]', text: 'text-success', bar: 'bg-success' },
    info: { icon: 'icon-[lucide--info]', text: 'text-accent-ink', bar: 'bg-accent' },
    warning: { icon: 'icon-[lucide--triangle-alert]', text: 'text-warning', bar: 'bg-warning' },
    danger: { icon: 'icon-[lucide--circle-x]', text: 'text-danger', bar: 'bg-danger' },
}
// `update()` mutates the toast in place, so both follow it.
const tone = computed(() => TONES[props.toast.color ?? 'neutral'])

// The bar drains from the time left when its deadline is set, on its own clock: hover pause never touches it.
const barMs = computed(() => Math.max(0, (props.toast.countdown?.until ?? 0) - Date.now()))

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
        :open="toast.open"
        :duration="toast.duration === 0 ? STICKY_MS : toast.duration"
        class="fp-toast pointer-events-auto absolute inset-x-4"
        :class="edge === 'top' ? 'top-4 origin-top' : 'bottom-4 origin-bottom'"
        :style="{
            '--stack-y': `${stack.y}px`,
            zIndex: stack.z,
            height: stack.height === undefined ? undefined : `${stack.height}px`,
        }"
        @animationend="onAnimationEnd"
        @update:open="(value) => !value && emit('dismiss')">
        <div class="fp-toast-panel surface-pop h-full overflow-hidden rounded-md">
            <div ref="content" class="fp-toast-body flex items-start gap-2.5 py-2.75 pr-2 pl-3">
                <FpIcon v-if="tone.icon" :name="tone.icon" class="fp-toast-icon mt-px shrink-0 text-17" :class="tone.text" />
                <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <ToastTitle class="font-semibold text-fg-1 text-13">{{ toast.title }}</ToastTitle>
                    <ToastDescription v-if="toast.description" class="text-12.5 text-fg-3 leading-[1.4]">
                        {{ toast.description }}
                    </ToastDescription>
                </div>
                <ToastAction v-if="toast.action" as-child :alt-text="toast.action.label">
                    <Button size="sm" variant="soft" class="shrink-0" :label="toast.action.label" @click="toast.action.onClick()" />
                </ToastAction>
                <ToastClose as-child>
                    <Button square size="sm" variant="ghost" class="shrink-0" :aria-label="dismissLabel">
                        <FpIcon name="icon-[lucide--x]" />
                    </Button>
                </ToastClose>
            </div>
            <span
                v-if="toast.countdown"
                :key="toast.countdown.until"
                class="fp-toast-bar absolute inset-x-0 bottom-0 h-0.5 origin-left motion-off:hidden"
                :class="tone.bar"
                :style="{ animationDuration: `${barMs}ms` }" />
        </div>
    </ToastRoot>
</template>

<!-- ToastRoot teleports from a fragment root, so scoped selectors cannot reach it. -->
<!-- Global classes remain fp-prefixed. -->
<style>
/* The outer item owns geometry; opacity stays on the glass panel. */
/* Opacity on the ancestor would isolate and disable its backdrop filter. */
.fp-toast {
    transform: translateY(var(--stack-y, 0px));
    transition:
        transform var(--dur-slow) var(--ease-spring),
        height var(--dur-base) var(--ease-out);
}
/* Gap bridges keep the viewport hovered (paused) while the pointer crosses between toasts. */
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
    box-shadow: var(--elev-float);
}
.fp-toast-bar {
    animation: fp-toast-countdown linear forwards;
}

/* Arrival is the authored moment: the card rises from its edge and overshoots,
   the text lands a beat later and the status icon pops in last. */
.fp-toast[data-state='open'] {
    animation: fp-toast-in var(--dur-slow) var(--ease-spring);
}
.fp-toast[data-state='open'] .fp-toast-panel {
    animation: fade-in var(--dur-fast) var(--ease-out);
}
.fp-toast[data-state='open'] .fp-toast-body {
    animation: fp-toast-land var(--dur-base) var(--ease-out) var(--dur-stagger) backwards;
}
.fp-toast[data-state='open'] .fp-toast-icon {
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
        translate(var(--reka-toast-swipe-move-x, 0px), var(--reka-toast-swipe-move-y, 0px));
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
        transform: translateY(var(--stack-y, 0px)) translateY(var(--toast-enter-y, 1rem)) scale(0.96);
    }
}

@keyframes fp-toast-out {
    to {
        transform: translateY(var(--stack-y, 0px)) translateY(var(--toast-exit-y, 0.5rem)) scale(0.96);
    }
}

@keyframes fp-toast-swipe-out {
    from {
        transform: translateY(var(--stack-y, 0px))
            translate(var(--reka-toast-swipe-end-x, 0px), var(--reka-toast-swipe-end-y, 0px));
    }
    to {
        transform: translateY(var(--stack-y, 0px))
            translate(
                calc(var(--reka-toast-swipe-end-x, 0px) + var(--toast-off-x, 0px)),
                calc(var(--reka-toast-swipe-end-y, 0px) + var(--toast-off-y, 0px))
            );
    }
}

@keyframes fp-toast-land {
    from {
        opacity: 0;
        translate: 0 0.25rem;
    }
}

@keyframes fp-toast-countdown {
    to {
        scale: 0 1;
    }
}
</style>
