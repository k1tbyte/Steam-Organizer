<script setup lang="ts">
import { FpButton, FpIcon, FpKbd } from '@so/ui'

defineProps<{
    icon: string
    title: string
    address: string
    label: string
    filled: boolean
    disabled: boolean
}>()

defineEmits<{ fill: [] }>()
</script>

<template>
    <div class="mx-2.5 mb-1.5 flex shrink-0 items-center gap-2.5 rounded bg-accent-soft py-2 pr-2 pl-3">
        <FpIcon :name="icon" class="text-16 text-accent-ink" />
        <div class="flex min-w-0 flex-1 flex-col gap-px">
            <span class="font-semibold text-12.5 text-fg-1">{{ title }}</span>
            <span class="truncate font-mono text-11.5 text-fg-3">{{ address }}</span>
        </div>
        <FpButton size="xs" color="accent" class="max-w-37.5 shrink-0" :disabled @click="$emit('fill')">
            <FpIcon v-if="filled" name="icon-[lucide--check]" />
            <span class="truncate">{{ label }}</span>
            <FpKbd v-if="!filled" class="h-4! min-w-4! bg-accent-fg/15 px-1! text-accent-fg!" value="↵" />
        </FpButton>
    </div>
</template>
