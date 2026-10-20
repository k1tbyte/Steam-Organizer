<script setup lang="ts">
import { Separator } from 'reka-ui'

withDefaults(
    defineProps<{
        label?: string
        orientation?: 'horizontal' | 'vertical'
    }>(),
    { orientation: 'horizontal' },
)
</script>

<template>
    <Separator v-if="orientation === 'vertical'" orientation="vertical" class="w-px self-stretch bg-stroke-2" />
    <Separator v-else-if="label || $slots.default" class="flex w-full items-center">
        <div class="h-px flex-1 bg-stroke-2" />
        <span class="px-3 text-xs text-fg-3">
            <slot>{{ label }}</slot>
        </span>
        <div class="h-px flex-1 bg-stroke-2" />
    </Separator>
    <Separator v-else class="h-px w-full bg-stroke-2" />
</template>
