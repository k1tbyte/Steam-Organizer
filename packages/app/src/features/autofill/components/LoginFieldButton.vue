<script setup lang="ts">
import { FpButton } from '@so/ui'
import logoUrl from '@so/ui/logo.svg'
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
        <img :src="logoUrl" alt="" class="size-4" />
    </FpButton>
</template>
