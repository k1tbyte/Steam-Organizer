<script setup lang="ts">
import FpIconTile from '../media/IconTile.vue'

defineProps<{ title: string; icon?: string | null }>()
</script>

<!-- A flat row: lists live inside cards, and a card inside a card reads as noise. -->
<template>
    <div class="flex items-center gap-3 rounded bg-surface-hi p-3">
        <slot name="leading">
            <FpIconTile v-if="icon" :name="icon" size="sm" />
        </slot>

        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
            <div class="flex flex-wrap items-center gap-2">
                <span class="truncate font-medium text-fg-1 text-sm">{{ title }}</span>
                <slot name="badge" />
            </div>
            <slot name="meta" />
        </div>

        <slot name="actions" />
    </div>
</template>
