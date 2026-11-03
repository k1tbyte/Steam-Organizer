<script setup lang="ts">
withDefaults(defineProps<{ as?: 'button' | 'label' }>(), { as: 'button' })
</script>

<template>
    <component
        :is="as"
        :type="as === 'button' ? 'button' : undefined"
        class="touch-row flex h-8 cursor-pointer items-center gap-2.5 rounded px-2 text-left text-13 text-fg-1 hover:bg-hover">
        <slot />
    </component>
</template>
