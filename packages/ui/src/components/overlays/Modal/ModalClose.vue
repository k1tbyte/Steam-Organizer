<script setup lang="ts">
import { DialogClose } from 'reka-ui'
import FpIcon from '../../display/media/Icon.vue'

defineProps<{ label?: string }>()
</script>

<template>
    <DialogClose
        class="touch-target flex shrink-0 rounded bg-surface-hi p-1.5 text-fg-3 hover:bg-hover hover:text-fg-1"
        :aria-label="label ?? 'Close'">
        <FpIcon name="icon-[lucide--x]" class="text-base" />
    </DialogClose>
</template>
