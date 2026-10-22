<script setup lang="ts">
import { FpScrollArea, provideOverlayGate, useDesktopLayout } from '@so/ui'
import { computed, shallowRef, useTemplateRef, watch, watchEffect } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { type PageContext, providePage } from '#core'

import type { LayerState } from '../composables/useShellLayers'

const props = defineProps<{
    route: RouteLocationNormalizedLoaded
    state: LayerState
}>()
const emit = defineEmits<{ page: [page: Pick<PageContext, 'scroller' | 'top'>] }>()

const desktop = useDesktopLayout()
const area = useTemplateRef('area')
const native = useTemplateRef('native')
const scroller = computed(
    () => (desktop.value ? area.value?.viewport : native.value) ?? null,
)
const active = computed(
    () => props.state === 'active' || props.state === 'enter',
)
const padsDock = computed(() => props.route.meta.tabBar !== false)

// Capture: runs before the page's own scroll handlers re-render it, so the read forces no layout.
const top = shallowRef(0)
watchEffect((onCleanup) => {
    const el = scroller.value
    top.value = 0
    if (!el) return
    const read = () => (top.value = el.scrollTop)
    el.addEventListener('scroll', read, { passive: true, capture: true })
    onCleanup(() => el.removeEventListener('scroll', read, true))
})

providePage({ scroller, top, active })
provideOverlayGate(active)
watch(
    active,
    (on) => {
        if (on) emit('page', { scroller, top })
    },
    { immediate: true },
)
</script>

<!-- One page in its own scroller: a resident section root keeps it, offset and all, while hidden.
     The route's `header` view sits above it: nothing scrolls under it, so its blur stays cheap. -->
<template>
    <div class="absolute inset-0 flex flex-col" :data-layer="state" :inert="!active">
        <RouterView name="header" :route="route" />
        <FpScrollArea v-if="desktop" ref="area" class="min-h-0 flex-1">
            <RouterView :route="route" />
        </FpScrollArea>
        <div
            v-else
            ref="native"
            class="min-h-0 flex-1 overflow-y-auto"
            :class="padsDock && 'pb-(--dock-clear)'">
            <RouterView :route="route" />
        </div>
    </div>
</template>
