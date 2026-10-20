<script setup lang="ts">
import { ToastPortal, ToastProvider, ToastViewport } from 'reka-ui'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'

import Toast from './Toast.vue'
import { type ToastStack, useToast } from './toast'

export type ToasterPosition = `${Edge}-${Align}`

type Edge = 'top' | 'bottom'
type Align = 'left' | 'center' | 'right'
type Swipe = 'up' | 'down' | 'left' | 'right'

const props = withDefaults(
    defineProps<{
        duration?: number
        /** Placement from the `md` breakpoint up. */
        position?: ToasterPosition
        /** Placement on narrow screens, where toasts span the width. */
        compactPosition?: ToasterPosition
        expand?: boolean
    }>(),
    { duration: 5000, position: 'bottom-right', compactPosition: 'bottom-center', expand: false },
)

const WIDE_QUERY = '(min-width: 48rem)'
const WIDE_ALIGN: Record<Align, string> = {
    left: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    right: 'right-0',
}
const EDGE_SWIPE: Record<Edge, Swipe> = { top: 'up', bottom: 'down' }
// A swiped toast travels a whole viewport, so it clears the edge from any lift or stack slot.
const SWIPE_OFF: Record<Swipe, { x: string; y: string }> = {
    up: { x: '0px', y: '-100dvh' },
    down: { x: '0px', y: '100dvh' },
    left: { x: '-100vw', y: '0px' },
    right: { x: '100vw', y: '0px' },
}

const GAP_PX = 8
const PEEK_PX = 12
const SCALE_STEP = 0.05
const MAX_VISIBLE_BEHIND = 2

const { toasts, remove, forget, markMounted } = useToast()

const wide = ref(true)
onMounted(() => {
    const media = matchMedia(WIDE_QUERY)
    const update = () => {
        wide.value = media.matches
    }
    update()
    media.addEventListener('change', update)
    onUnmounted(() => media.removeEventListener('change', update))
})

// One resolved position drives edge, swipe, entrance and exit together.
const placement = computed(() => {
    const [edge, align] = (wide.value ? props.position : props.compactPosition).split('-') as [Edge, Align]
    const swipe: Swipe = wide.value && align !== 'center' ? align : EDGE_SWIPE[edge]
    const toward = edge === 'top' ? -1 : 1
    return {
        edge,
        swipe,
        viewport: [edge === 'top' ? 'top-0' : 'bottom-0', wide.value ? `w-96 ${WIDE_ALIGN[align]}` : 'inset-x-0'],
        vars: {
            '--toast-enter-y': `calc(${toward} * (100% + 1rem))`,
            '--toast-exit-y': `calc(${toward} * 0.5rem)`,
            '--toast-off-x': SWIPE_OFF[swipe].x,
            '--toast-off-y': SWIPE_OFF[swipe].y,
            // The app raises toasts above whatever docks at the bottom (the mini player).
            margin: 'var(--safe-top) var(--safe-right) calc(var(--safe-bottom) + var(--toast-offset-bottom, 0px)) var(--safe-left)',
        },
    }
})

// Expanded offsets and collapsed height need measured pixels.
const heights = reactive(new Map<number, number>())
watch(toasts, (list) => {
    const alive = new Set(list.map((toast) => toast.id))
    for (const id of heights.keys()) if (!alive.has(id)) heights.delete(id)
})

const engaged = ref(false)
const expanded = computed(() => props.expand || engaged.value)
watch(
    () => toasts.value.length,
    (length) => {
        if (length === 0) engaged.value = false
    },
)

const frontHeight = computed(() => {
    const front = toasts.value.at(-1)
    return front ? (heights.get(front.id) ?? 0) : 0
})

const stacks = computed<ToastStack[]>(() => {
    const list = toasts.value
    const dir = placement.value.edge === 'top' ? 1 : -1
    return list.map((toast, index) => {
        const own = heights.get(toast.id) ?? 0
        if (expanded.value) {
            let y = 0
            for (let j = index + 1; j < list.length; j++) {
                y += (heights.get(list[j]?.id ?? -1) ?? 0) + GAP_PX
            }
            return { y: dir * y, scale: 1, opacity: 1, height: own || undefined, z: index }
        }
        const depth = Math.min(list.length - 1 - index, MAX_VISIBLE_BEHIND)
        return {
            y: dir * PEEK_PX * depth,
            scale: 1 - SCALE_STEP * depth,
            opacity: list.length - 1 - index > MAX_VISIBLE_BEHIND ? 0 : 1,
            height: index === list.length - 1 ? own || undefined : frontHeight.value || undefined,
            z: index,
        }
    })
})

// Explicit height so the (transparent) viewport's hover area tracks the stack
const stackHeight = computed(() => {
    const list = toasts.value
    if (list.length === 0) return 0
    if (!expanded.value) return frontHeight.value + PEEK_PX * Math.min(list.length - 1, MAX_VISIBLE_BEHIND)
    let total = GAP_PX * (list.length - 1)
    for (const toast of list) total += heights.get(toast.id) ?? 0
    return total
})
</script>

<template>
    <ToastProvider :swipe-direction="placement.swipe" :duration="duration">
        <slot />
        <Toast
            v-for="(toast, index) in toasts"
            :key="toast.id"
            :toast="toast"
            :stack="stacks[index] ?? { y: 0, scale: 1, opacity: 1, z: index }"
            :edge="placement.edge"
            @dismiss="remove(toast.id)"
            @gone="forget(toast.id)"
            @mounted="markMounted(toast.id)"
            @resize="(height) => heights.set(toast.id, height)" />
        <ToastPortal>
            <ToastViewport
                class="pointer-events-none fixed layer-toast max-w-[100vw] list-none outline-none"
                :class="placement.viewport"
                :style="{ ...placement.vars, height: `calc(${stackHeight}px + var(--spacing) * 8)` }"
                @mouseenter="engaged = true"
                @mouseleave="engaged = false"
                @focusin="engaged = true"
                @focusout="engaged = false" />
        </ToastPortal>
    </ToastProvider>
</template>
