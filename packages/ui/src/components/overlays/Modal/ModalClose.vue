<script setup lang="ts">
import { DialogClose } from 'reka-ui'
import FpIcon from '../../display/media/Icon.vue'

defineProps<{ label?: string }>()
</script>

<template>
    <DialogClose
        class="touch-target flex size-7.5 shrink-0 items-center justify-center rounded-sm text-15 text-fg-3 hover:bg-hover hover:text-fg-1"
        :aria-label="label ?? 'Close'">
        <FpIcon name="icon-[lucide--x]" />
    </DialogClose>
</template>
