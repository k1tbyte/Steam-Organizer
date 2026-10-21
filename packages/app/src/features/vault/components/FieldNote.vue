<script setup lang="ts">
import { FpIcon } from '@so/ui'

withDefaults(defineProps<{ tone?: 'danger' | 'success' }>(), {
    tone: 'danger',
})
</script>

<template>
    <p
        class="flex items-center gap-1.5 text-12"
        :class="tone === 'success' ? 'text-success' : 'text-danger'">
        <FpIcon
            :name="tone === 'success' ? 'icon-[lucide--check]' : 'icon-[lucide--circle-alert]'"
            class="shrink-0 text-13"
            aria-hidden="true" />
        <slot />
    </p>
</template>
