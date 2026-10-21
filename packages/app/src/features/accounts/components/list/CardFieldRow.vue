<script setup lang="ts">
import { FpIcon, FpIconTile, FpSwitch, useDesktopLayout } from '@so/ui'

import type { FieldRow } from '../../composables/useCardFields'

defineProps<{ row: FieldRow; on: boolean }>()
defineEmits<{ toggle: [] }>()

const desktop = useDesktopLayout()
</script>

<!-- The whole row is the target: the label forwards its click to the switch. -->
<template>
    <!-- biome-ignore lint/a11y/noLabelWithoutControl: the switch inside is the labelled control -->
    <label
        class="flex cursor-pointer items-center gap-3.5 rounded px-3 py-1.5 transition-colors duration-fast hover:bg-hover lg:gap-3 lg:px-2.5 lg:py-2"
        :class="row.later ? 'pointer-events-none opacity-50' : 'min-h-14 lg:min-h-0'">
        <FpIconTile v-if="desktop" :name="row.icon" size="sm" class="size-7.5 text-15" />
        <FpIcon v-else :name="row.icon" class="shrink-0 text-17 text-fg-2" />
        <span class="flex min-w-0 flex-1 flex-col gap-px">
            <span class="font-medium text-13.5 text-fg-1">{{ row.label }}</span>
            <span class="truncate text-11.5 text-fg-3 lg:text-12">{{ row.description }}</span>
        </span>
        <FpSwitch
            :model-value="on"
            :disabled="row.later"
            :size="desktop ? 'md' : 'lg'"
            :aria-label="row.label"
            @update:model-value="$emit('toggle')" />
    </label>
</template>
