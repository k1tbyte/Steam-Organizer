<script setup lang="ts">
import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from 'reka-ui'
import { computed, ref } from 'vue'

withDefaults(
    defineProps<{
        type?: 'auto' | 'always' | 'scroll' | 'hover'
    }>(),
    { type: 'hover' },
)

const root = ref<InstanceType<typeof ScrollAreaRoot>>()

// The scrolling element, for virtualizers and scroll restoration.
defineExpose({ viewport: computed(() => root.value?.viewport) })
</script>

<!-- Flex sizing preserves scrolling under a max-height cap. -->
<!-- A compositing layer prevents Chromium from partially repainting backdrop blur. -->
<template>
    <ScrollAreaRoot
        ref="root"
        class="flex flex-col overflow-hidden"
        :type="type"
        :scroll-hide-delay="400">
        <ScrollAreaViewport class="relative min-h-0 w-full flex-auto transform-gpu overscroll-contain">
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
