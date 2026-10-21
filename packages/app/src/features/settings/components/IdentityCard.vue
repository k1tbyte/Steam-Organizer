<script setup lang="ts">
defineProps<{ outlined?: boolean }>()
</script>

<!-- Who or what a section is about: an avatar or tile, two lines, and the actions that wrap below on a phone. -->
<template>
    <div
        class="mt-0.5 mb-1.5 flex flex-wrap items-center gap-3.5 rounded p-3.5"
        :class="outlined ? 'ring-1 ring-stroke-2 ring-inset' : 'bg-surface-hi'">
        <slot name="leading" />
        <div class="flex min-w-0 flex-1 basis-36 flex-col gap-0.5">
            <slot />
        </div>
        <div v-if="$slots.actions" class="ml-auto flex items-center gap-1.5">
            <slot name="actions" />
        </div>
    </div>
</template>
