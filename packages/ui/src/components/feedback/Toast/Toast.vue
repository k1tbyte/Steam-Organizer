<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import Button from '../../buttons/Button.vue'
import FpIcon from '../../display/media/Icon.vue'
import type { ToastItem } from './toast'
import { pausableTimer } from './toast-timer'

const props = defineProps<{
    toast: ToastItem
    /** The toaster's default for a toast without its own. */
    duration: number
    /** The page is in the background: every toast waits. */
    hidden: boolean
    dismissLabel: string
}>()
const emit = defineEmits<{ dismiss: [] }>()

// A neutral toast has no icon of its own.
const TONES: Record<NonNullable<ToastItem['color']>, { icon?: string; text: string; bar: string }> = {
    neutral: { text: 'text-fg-3', bar: 'bg-accent' },
    success: { icon: 'icon-[lucide--circle-check]', text: 'text-success', bar: 'bg-success' },
    info: { icon: 'icon-[lucide--info]', text: 'text-accent-ink', bar: 'bg-accent' },
    warning: { icon: 'icon-[lucide--triangle-alert]', text: 'text-warning', bar: 'bg-warning' },
    danger: { icon: 'icon-[lucide--circle-x]', text: 'text-danger', bar: 'bg-danger' },
}
const tone = computed(() => TONES[props.toast.color ?? 'neutral'])
const icon = computed(() => props.toast.icon ?? tone.value.icon)

const ms = props.toast.duration ?? props.duration
const hovered = ref(false)
const focused = ref(false)
const paused = computed(() => hovered.value || focused.value || props.hidden)

const describe = props.toast.description
const seconds = ref(Math.ceil(ms / 1000))
const description = computed(() => (typeof describe === 'function' ? describe(seconds.value) : describe))

if (ms > 0) {
    const counts = typeof describe === 'function'
    const timer = pausableTimer(
        ms,
        () => emit('dismiss'),
        counts ? (left) => (seconds.value = left) : undefined,
    )
    watch(paused, (on) => (on ? timer.pause() : timer.resume()), { immediate: true })
    onBeforeUnmount(timer.pause)
}

function onFocusOut(event: FocusEvent) {
    const self = event.currentTarget as Element
    focused.value = event.relatedTarget instanceof Node && self.contains(event.relatedTarget)
}

function act() {
    props.toast.action?.onClick()
    emit('dismiss')
}
</script>

<template>
    <li
        class="toast surface-pop pointer-events-auto relative flex items-start gap-2.5 overflow-hidden rounded-md py-2.75 pr-2 pl-3"
        :role="toast.color === 'danger' ? 'alert' : 'status'"
        @pointerenter="hovered = true"
        @pointerleave="hovered = false"
        @focusin="focused = true"
        @focusout="onFocusOut">
        <FpIcon v-if="icon" :name="icon" class="mt-px shrink-0 text-16" :class="tone.text" />
        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="font-semibold text-13 text-fg-1">{{ toast.title }}</span>
            <span v-if="description" class="text-12.5 text-fg-3 leading-[1.4]">{{ description }}</span>
        </div>
        <Button v-if="toast.action" size="xs" variant="soft" class="shrink-0" :label="toast.action.label" @click="act" />
        <Button square size="xs" variant="ghost" class="shrink-0 text-fg-3!" :aria-label="dismissLabel" @click="emit('dismiss')">
            <FpIcon name="icon-[lucide--x]" />
        </Button>
        <!-- Functional progress: the time it shows still runs under motion Off, so it outranks that clamp (base.css). -->
        <span
            v-if="toast.progress && ms > 0"
            class="bar absolute inset-x-0 bottom-0 h-0.5 origin-left motion-off:[animation-duration:var(--bar-ms)]!"
            :class="tone.bar"
            :style="{ '--bar-ms': `${ms}ms`, animationPlayState: paused ? 'paused' : 'running' }" />
    </li>
</template>

<style scoped>
.toast {
    box-shadow: var(--elev-float);
}
.bar {
    animation: toast-drain var(--bar-ms) linear forwards;
}
@keyframes toast-drain {
    to {
        scale: 0 1;
    }
}
</style>
