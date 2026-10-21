<script setup lang="ts">
import { useDesktopLayout } from '@so/ui'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useTopbarOutlets } from '#core'

defineProps<{ title: string; count?: string }>()

const { targets } = useTopbarOutlets()
// Desktop has no back outlet: the back slot leads the title there.
const desktop = useDesktopLayout()
const backTarget = computed(() =>
    desktop.value ? targets.title.value : targets.back.value,
)
// A page leaving through the route transition still renders: only the current page fills the topbar.
const route = useRoute()
const ownPath = route.path
const owns = computed(() => route.path === ownPath)
</script>

<!-- Renders nothing in place: each part lands in the shell's topbar once the shell has mounted it. -->
<template>
    <Teleport v-if="owns && $slots.back && backTarget" :to="backTarget">
        <slot name="back" />
    </Teleport>
    <Teleport v-if="owns && targets.title.value" :to="targets.title.value">
        <h1
            v-if="title"
            class="font-bold text-26 text-fg-1 lg:font-semibold lg:text-15 lg:tracking-title">
            {{ title }}
        </h1>
        <span v-if="count" class="font-mono text-13 text-fg-3">
            {{ count }}
        </span>
    </Teleport>
    <Teleport
        v-if="owns && $slots.status && targets.status.value"
        :to="targets.status.value">
        <slot name="status" />
    </Teleport>
    <Teleport
        v-if="owns && $slots.center && targets.center.value"
        :to="targets.center.value">
        <slot name="center" />
    </Teleport>
    <Teleport
        v-if="owns && $slots.actions && targets.actions.value"
        :to="targets.actions.value">
        <slot name="actions" />
    </Teleport>
</template>
