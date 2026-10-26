<script setup lang="ts">
import type { AccountTag } from '../../model'

withDefaults(
    defineProps<{
        tag: AccountTag
        /** `lg` is the phone profile's chip. */
        size?: 'sm' | 'lg'
    }>(),
    { size: 'sm' },
)
</script>

<template>
    <span
        class="inline-flex shrink-0 items-center rounded-full bg-surface-hi font-medium text-fg-2"
        :class="size === 'lg' ? 'h-7.5 gap-1.5 pr-2.75 pl-2.25 text-12' : 'h-5.5 gap-1.25 pr-2 pl-1.75 text-12'">
        <span class="tag-dot rounded-full" :class="size === 'lg' ? 'size-1.75' : 'size-1.5'" :style="{ '--hue': tag.hue }" />
        {{ tag.label }}
    </span>
</template>
