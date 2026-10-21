<script setup lang="ts">
import { FpButton, FpEmpty, FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

defineEmits<{ openApp: [] }>()

const { t } = useI18n()
</script>

<template>
    <FpEmpty
        class="flex-1"
        :title="t('No vault yet')"
        :description="t('Create one in Steam Organizer to keep your accounts here.')">
        <template #leading><FpIcon name="icon-[lucide--vault]" /></template>
        <template #actions>
            <FpButton color="accent" size="lg" @click="$emit('openApp')">{{ t('Open Steam Organizer') }}</FpButton>
        </template>
    </FpEmpty>
</template>
