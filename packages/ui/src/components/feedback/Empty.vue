<script setup lang="ts">
import FpIconTile from '../display/media/IconTile.vue'

defineProps<{
    title?: string
    description?: string
}>()
</script>

<template>
    <div class="flex flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <FpIconTile v-if="$slots.leading" size="lg">
            <slot name="leading" />
        </FpIconTile>
        <div v-if="title || description" class="space-y-1">
            <h3 v-if="title" class="font-medium text-15 text-fg-1">{{ title }}</h3>
            <p v-if="description" class="max-w-sm text-fg-3 text-13">{{ description }}</p>
        </div>
        <slot />
        <div v-if="$slots.actions" class="flex flex-wrap items-center justify-center gap-2">
            <slot name="actions" />
        </div>
    </div>
</template>
