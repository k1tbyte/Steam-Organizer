<script setup lang="ts">
import FpButton from '../../buttons/Button.vue'

withDefaults(
    defineProps<{
        confirmLabel: string
        cancelLabel: string
        confirmColor?: 'accent' | 'danger'
        /** Let the surrounding form own the confirm click. */
        submit?: boolean
        pending?: boolean
    }>(),
    { confirmColor: 'accent' },
)
const emit = defineEmits<{ cancel: []; confirm: [] }>()
</script>

<template>
    <div class="mt-2 flex justify-end gap-2">
        <FpButton
            variant="ghost"
            color="neutral"
            :disabled="pending"
            :label="cancelLabel"
            @click="emit('cancel')" />
        <FpButton
            :type="submit ? 'submit' : 'button'"
            :color="confirmColor"
            :loading="pending"
            :label="confirmLabel"
            @click="emit('confirm')" />
    </div>
</template>
