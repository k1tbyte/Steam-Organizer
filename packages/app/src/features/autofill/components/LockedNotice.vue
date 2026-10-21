<script setup lang="ts">
import { FpButton, FpIcon, FpIconTile } from '@so/ui'

defineProps<{ title: string; hint: string; action: string }>()
defineEmits<{ open: [] }>()
</script>

<template>
    <div class="flex flex-col items-center gap-3 px-6 py-7 text-center">
        <FpIconTile size="base" name="icon-[lucide--lock-keyhole]" class="text-fg-1" />
        <div class="flex flex-col gap-1">
            <span class="font-semibold text-13.5 text-fg-1">{{ title }}</span>
            <span class="text-12.5 leading-snug text-fg-3 text-pretty">{{ hint }}</span>
        </div>
        <FpButton color="accent" size="sm" @click="$emit('open')">
            {{ action }}
            <FpIcon name="icon-[lucide--arrow-up-right]" />
        </FpButton>
    </div>
</template>
