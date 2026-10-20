<script setup lang="ts">
import FpIconTile from '../media/IconTile.vue'

defineProps<{ title: string; icon?: string | null }>()
</script>

<!-- A flat row divided by hairlines: lists live inside cards, and a card inside a card reads as noise. -->
<template>
    <div class="flex min-h-16 items-center gap-3.5 border-stroke-1 border-t py-2.5 pr-2.5 pl-4">
        <slot name="leading">
            <FpIconTile v-if="icon" :name="icon" size="sm" />
        </slot>

        <div class="flex min-w-0 flex-1 flex-col gap-[3px]">
            <div class="flex flex-wrap items-center gap-2">
                <span class="truncate font-medium text-14 text-fg-1">{{ title }}</span>
                <slot name="badge" />
            </div>
            <slot name="meta" />
        </div>

        <slot name="actions" />
    </div>
</template>
