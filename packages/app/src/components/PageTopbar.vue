<script setup lang="ts">
import { useDesktopLayout } from '@so/ui'
import { computed } from 'vue'

import { usePageActive, useTopbarOutlets } from '#core'

defineProps<{ title: string; count?: string }>()

const { targets } = useTopbarOutlets()
// Desktop has no back outlet: the back slot leads the title there.
const desktop = useDesktopLayout()
const backTarget = computed(() =>
    desktop.value ? targets.title.value : targets.back.value,
)
// Pages kept behind the current one or leaving still render: only the current page fills the topbar.
const owns = usePageActive()
</script>

<!-- Each part sits in the shell's topbar while the page is current, and waits mounted in the hidden
     holder otherwise: a switch moves it instead of mounting it again. -->
<template>
    <div hidden>
        <Teleport v-if="$slots.back" :to="backTarget" :disabled="!owns || !backTarget">
            <slot name="back" />
        </Teleport>
        <Teleport :to="targets.title.value" :disabled="!owns || !targets.title.value">
            <h1
                v-if="title"
                class="font-bold text-26 text-fg-1 lg:font-semibold lg:text-15 lg:tracking-title">
                {{ title }}
            </h1>
            <span v-if="count" class="font-mono text-13 text-fg-3">
                {{ count }}
            </span>
        </Teleport>
        <Teleport v-if="$slots.status" :to="targets.status.value" :disabled="!owns || !targets.status.value">
            <slot name="status" />
        </Teleport>
        <Teleport v-if="$slots.center" :to="targets.center.value" :disabled="!owns || !targets.center.value">
            <slot name="center" />
        </Teleport>
        <Teleport v-if="$slots.actions" :to="targets.actions.value" :disabled="!owns || !targets.actions.value">
            <slot name="actions" />
        </Teleport>
    </div>
</template>
