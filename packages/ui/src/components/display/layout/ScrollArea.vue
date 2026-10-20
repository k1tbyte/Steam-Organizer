<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'

withDefaults(
    defineProps<{
        type?: 'auto' | 'always' | 'scroll' | 'hover'
    }>(),
    { type: 'hover' },
)
</script>

<!-- Flex sizing preserves scrolling under a max-height cap. -->
<!-- A compositing layer prevents Chromium from partially repainting backdrop blur. -->
<template>
    <ScrollAreaRoot
        class="flex flex-col overflow-hidden"
        :type="type"
        :scroll-hide-delay="400">
        <ScrollAreaViewport class="min-h-0 w-full flex-auto transform-gpu">
            <slot />
        </ScrollAreaViewport>
        <ScrollAreaScrollbar
            orientation="vertical"
            class="flex w-1.5 touch-none p-px select-none">
            <ScrollAreaThumb
                class="relative flex-1 rounded-full bg-stroke-2 transition-colors hover:bg-stroke-3" />
        </ScrollAreaScrollbar>
    </ScrollAreaRoot>
</template>
