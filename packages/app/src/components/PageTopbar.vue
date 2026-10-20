<script setup lang="ts">
import { useTopbarOutlets } from '#core'

defineProps<{ title: string; count?: string }>()

const { targets } = useTopbarOutlets()
</script>

<!-- Renders nothing in place: each part lands in the shell's topbar once the shell has mounted it. -->
<template>
    <Teleport v-if="targets.title.value" :to="targets.title.value">
        <h1
            class="font-bold text-26 text-fg-1 lg:font-semibold lg:text-15 lg:tracking-title">
            {{ title }}
        </h1>
        <span v-if="count" class="font-mono text-13 text-fg-3">
            {{ count }}
        </span>
    </Teleport>
    <Teleport
        v-if="$slots.back && targets.back.value"
        :to="targets.back.value">
        <slot name="back" />
    </Teleport>
    <Teleport
        v-if="$slots.status && targets.status.value"
        :to="targets.status.value">
        <slot name="status" />
    </Teleport>
    <Teleport
        v-if="$slots.center && targets.center.value"
        :to="targets.center.value">
        <slot name="center" />
    </Teleport>
    <Teleport
        v-if="$slots.actions && targets.actions.value"
        :to="targets.actions.value">
        <slot name="actions" />
    </Teleport>
</template>
