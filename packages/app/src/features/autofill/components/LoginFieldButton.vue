<script setup lang="ts">
import { FpButton, FpLogo } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineProps<{ open: boolean }>()
defineEmits<{ toggle: [] }>()

const { t } = useI18n()
</script>

<template>
    <FpButton
        square
        size="sm"
        variant="outline"
        class="pointer-events-auto fixed bg-surface-pop! backdrop-pop hover:bg-surface-hi!"
        :aria-label="t('Steam Organizer')"
        :aria-expanded="open"
        @click="$emit('toggle')">
        <FpLogo class="size-4" />
    </FpButton>
</template>
