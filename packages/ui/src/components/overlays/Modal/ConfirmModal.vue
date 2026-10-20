<script setup lang="ts">
import FpAlert from '../../feedback/Alert.vue'
import FpModal from './Modal.vue'
import FpModalActions from './ModalActions.vue'

withDefaults(
    defineProps<{
        title: string
        description?: string
        confirmLabel: string
        cancelLabel: string
        confirmColor?: 'accent' | 'danger'
        /** Shown inside the modal: a failure the confirm caused is unreadable behind it. */
        error?: string | null
        pending?: boolean
    }>(),
    { confirmColor: 'accent' },
)
const emit = defineEmits<{ confirm: [] }>()

const open = defineModel<boolean>('open', { default: false })

function dismiss() {
    open.value = false
}
</script>

<template>
    <FpModal
        v-model:open="open"
        :dismissible="!pending"
        :title="title"
        :description="description">
        <slot />
        <FpAlert v-if="error" color="danger" class="mt-3" :title="error" />
        <FpModalActions
            :confirm-label="confirmLabel"
            :cancel-label="cancelLabel"
            :confirm-color="confirmColor"
            :pending="pending"
            @cancel="dismiss"
            @confirm="emit('confirm')" />
    </FpModal>
</template>
