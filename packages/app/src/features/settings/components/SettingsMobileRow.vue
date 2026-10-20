<script setup lang="ts">
import { FpIcon, FpIconTile } from '@so/ui'
import { RouterLink } from 'vue-router'

defineProps<{ title: string; icon: string; value: string; to?: string }>()
</script>

<template>
    <component
        :is="to ? RouterLink : 'div'"
        v-bind="to ? { to } : {}"
        class="flex min-h-13 items-center gap-3 border-stroke-1 border-t pr-3 text-fg-1"
        :class="!to && 'opacity-50'">
        <FpIconTile :name="icon" size="xs" />
        <span class="min-w-0 flex-1 text-14">{{ title }}</span>
        <span class="whitespace-nowrap text-13 text-fg-3">{{ value }}</span>
        <FpIcon name="icon-[lucide--chevron-right]" class="text-16 text-fg-faint" />
    </component>
</template>
