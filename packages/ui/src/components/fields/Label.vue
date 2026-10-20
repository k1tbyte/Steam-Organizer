<script setup lang="ts">
const props = defineProps<{
    for?: string
    required?: boolean
}>()
</script>

<template>
    <label :for="props.for" class="font-medium text-fg-1 text-sm">
        <slot />
        <span v-if="required" class="text-danger" aria-hidden="true"> *</span>
    </label>
</template>
