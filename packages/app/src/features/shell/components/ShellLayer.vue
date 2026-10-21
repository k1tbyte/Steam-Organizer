<script setup lang="ts">
import { FpScrollArea, provideOverlayGate, useDesktopLayout } from '@so/ui'
import { computed, useTemplateRef, watchEffect } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'

import { providePage } from '#core'

import type { LayerState } from '../composables/useShellLayers'

const props = defineProps<{
    route: RouteLocationNormalizedLoaded
    state: LayerState
}>()
const emit = defineEmits<{ scroller: [el: HTMLElement | null] }>()

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

providePage({ scroller, active })
provideOverlayGate(active)
watchEffect(() => {
    if (active.value) emit('scroller', scroller.value)
})
</script>

<!-- One page in its own scroller: a resident section root keeps it, offset and all, while hidden. -->
<template>
    <div class="absolute inset-0" :data-layer="state" :inert="!active">
        <FpScrollArea v-if="desktop" ref="area" class="h-full">
            <RouterView :route="route" />
        </FpScrollArea>
        <div
            v-else
            ref="native"
            class="h-full overflow-y-auto"
            :class="padsDock && 'pb-(--dock-clear)'">
            <RouterView :route="route" />
        </div>
    </div>
</template>
