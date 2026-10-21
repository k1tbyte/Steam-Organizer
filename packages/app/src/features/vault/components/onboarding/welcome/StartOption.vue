<script setup lang="ts">
import { FpIcon, FpIconTile } from '@so/ui'

import type { StartOption } from '../../../composables/useWelcome'

defineProps<{ option: StartOption }>()
defineEmits<{ choose: [] }>()
</script>

<template>
    <button
        type="button"
        class="surface flex min-h-18 w-full items-center gap-3.5 rounded px-3.5 py-3 text-left transition-colors duration-fast hover:border-stroke-2 hover:bg-surface-hover"
        @click="$emit('choose')">
        <FpIconTile :name="option.icon" color="accent" />
        <span class="flex min-w-0 flex-1 flex-col gap-0.5">
            <span class="font-semibold text-14.5 text-fg-1">{{ option.title }}</span>
            <span class="text-13 text-fg-3 leading-[1.45]">{{ option.description }}</span>
        </span>
        <FpIcon name="icon-[lucide--chevron-right]" class="text-17 text-fg-3" aria-hidden="true" />
    </button>
</template>
