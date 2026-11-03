<script setup lang="ts">
import FpIcon from './media/Icon.vue'

// Dashed: a one-line footer inside a card; solid: a section note that wraps.
defineProps<{ icon?: string; dashed?: boolean }>()
</script>

<template>
    <p
        class="flex gap-2 border-stroke-1 border-t text-12.5 text-fg-3 text-pretty"
        :class="dashed ? 'items-center border-dashed pt-3' : 'items-start pt-3.5 leading-snug'">
        <FpIcon v-if="icon" :name="icon" class="text-14" :class="!dashed && 'mt-px'" />
        <slot />
    </p>
</template>
