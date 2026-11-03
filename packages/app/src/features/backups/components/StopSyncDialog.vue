<script setup lang="ts">
import { FpConfirmModal } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { StopSync } from '../composables/useStopSync'

defineProps<{ stopping: StopSync }>()
const { t } = useI18n()
</script>

<template>
    <FpConfirmModal
        v-model:open="stopping.open"
        :title="stopping.title"
        :description="t('The vault stays on this device as a vault of its own. Its copy and backups stay in Google Drive, and other devices synced to it keep their own copy.')"
        :confirm-label="t('Stop syncing')"
        :cancel-label="t('Cancel')"
        :error="stopping.error"
        :pending="stopping.pending"
        @confirm="stopping.confirm" />
</template>
