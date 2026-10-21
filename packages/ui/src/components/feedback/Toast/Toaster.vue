<script setup lang="ts">
import { ToastPortal, ToastProvider, ToastViewport } from 'reka-ui'
import { computed, reactive, watch } from 'vue'

import { useDesktopLayout } from '../../../composables/useDesktopLayout'
import Toast from './Toast.vue'
import { forget, markMounted, type ToastStack, toasts, useToast } from './toast'

export type ToasterPosition = `${Edge}-${Align}`

type Edge = 'top' | 'bottom'
type Align = 'left' | 'center' | 'right'
type Swipe = 'up' | 'down' | 'left' | 'right'

const props = withDefaults(
    defineProps<{
        duration?: number
        /** Placement from the `lg` breakpoint up. */
        position?: ToasterPosition
        /** Placement on narrow screens, where toasts span the width. */
        compactPosition?: ToasterPosition
        /** Names the close button of each toast. */
        dismissLabel?: string
    }>(),
    { duration: 5000, position: 'bottom-right', compactPosition: 'bottom-center', dismissLabel: 'Dismiss' },
)

// 380px toasts plus their 16px side insets.
const WIDE_WIDTH = 'w-103'
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

const { remove } = useToast()
const wide = useDesktopLayout()

// One resolved position drives edge, swipe, entrance and exit together.
const placement = computed(() => {
    const [edge, align] = (wide.value ? props.position : props.compactPosition).split('-') as [Edge, Align]
    const swipe: Swipe = wide.value && align !== 'center' ? align : EDGE_SWIPE[edge]
    const toward = edge === 'top' ? -1 : 1
    return {
        edge,
        swipe,
        viewport: [edge === 'top' ? 'top-0' : 'bottom-0', wide.value ? `${WIDE_WIDTH} ${WIDE_ALIGN[align]}` : 'inset-x-0'],
        vars: {
            '--toast-enter-y': `calc(${toward} * (100% + 1rem))`,
            '--toast-exit-y': `calc(${toward} * 0.5rem)`,
            '--toast-off-x': SWIPE_OFF[swipe].x,
            '--toast-off-y': SWIPE_OFF[swipe].y,
            // The shell raises toasts above whatever docks at the bottom (the phone tab bar).
            margin: 'var(--safe-top) var(--safe-right) calc(var(--safe-bottom) + var(--toast-offset-bottom, 0px)) var(--safe-left)',
        },
    }
})

// Offsets and the viewport's height need measured pixels.
const heights = reactive(new Map<number, number>())
watch(toasts, (list) => {
    const alive = new Set(list.map((toast) => toast.id))
    for (const id of heights.keys()) if (!alive.has(id)) heights.delete(id)
})

// The newest toast sits at the edge; older ones stack away from it.
const stacks = computed<ToastStack[]>(() => {
    const list = toasts.value
    const dir = placement.value.edge === 'top' ? 1 : -1
    return list.map((toast, index) => {
        let y = 0
        for (let j = index + 1; j < list.length; j++) {
            y += (heights.get(list[j]?.id ?? -1) ?? 0) + GAP_PX
        }
        return { y: dir * y, height: heights.get(toast.id) || undefined, z: index }
    })
})

// Explicit height so the (transparent) viewport's hover area tracks the stack.
const stackHeight = computed(() => {
    const list = toasts.value
    if (list.length === 0) return 0
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
            :stack="stacks[index] ?? { y: 0, z: index }"
            :edge="placement.edge"
            :dismiss-label="dismissLabel"
            @dismiss="remove(toast.id)"
            @gone="forget(toast.id)"
            @mounted="markMounted(toast.id)"
            @resize="(height) => heights.set(toast.id, height)" />
        <ToastPortal>
            <ToastViewport
                class="pointer-events-none fixed layer-toast max-w-[100vw] list-none outline-none"
                :class="placement.viewport"
                :style="{ ...placement.vars, height: `calc(${stackHeight}px + var(--spacing) * 8)` }" />
        </ToastPortal>
    </ToastProvider>
</template>
