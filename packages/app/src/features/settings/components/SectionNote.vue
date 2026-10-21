<script setup lang="ts">
import { FpIcon } from '@so/ui'

defineProps<{ icon: string }>()
</script>

<template>
    <p class="flex items-start gap-2 border-stroke-1 border-t pt-3.5 text-12.5 leading-snug text-fg-3">
        <FpIcon :name="icon" class="mt-px text-14" />
        <span class="text-pretty"><slot /></span>
    </p>
</template>
