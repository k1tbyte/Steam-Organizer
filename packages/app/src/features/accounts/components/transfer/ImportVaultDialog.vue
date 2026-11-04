<script setup lang="ts">
import { FpAlert, FpButton, FpConfirmModal, FpFormField, FpIcon, FpInput, FpModal, FpShake } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { VaultImport } from '../../composables/transfer/useImportVault'

defineProps<{ importing: VaultImport }>()
const { t } = useI18n()
</script>

<!-- One import, three asks: replace this vault (a warning), the file's own password, a preview of what joins. -->
<template>
    <FpConfirmModal
        v-model:open="importing.replaceOpen"
        :title="importing.replaceTitle"
        :description="t('Every account here is replaced by the file\'s, and those it lacks are deleted. Other devices follow at their next sync.')"
        :confirm-label="t('Replace')"
        :cancel-label="t('Cancel')"
        confirm-color="danger"
        :error="importing.error"
        :pending="importing.pending"
        @confirm="importing.confirm" />
    <FpModal
        v-model:open="importing.passwordOpen"
        :title="importing.passwordTitle"
        :description="importing.passwordHint"
        width="min(92vw, 26rem)">
        <form id="import-password" @submit.prevent="importing.submitPassword">
            <FpFormField :label="t('File password')" :error="importing.passwordError">
                <FpShake :trigger="importing.failedAttempts">
                    <FpInput v-model="importing.password" type="password" autocomplete="off">
                        <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                    </FpInput>
                </FpShake>
            </FpFormField>
        </form>
        <template #footer>
            <FpButton size="lg" variant="ghost" :label="t('Cancel')" @click="importing.passwordOpen = false" />
            <FpButton
                size="lg"
                type="submit"
                form="import-password"
                color="accent"
                :disabled="!importing.canOpen"
                :loading="importing.pending"
                :label="t('Open')" />
        </template>
    </FpModal>
    <FpConfirmModal
        v-model:open="importing.previewOpen"
        :title="importing.previewTitle"
        :description="importing.previewHint"
        :confirm-label="t('Import')"
        :cancel-label="t('Cancel')"
        :error="importing.error"
        :pending="importing.pending"
        @confirm="importing.confirm">
        <FpAlert v-if="importing.lockedNote" color="warning" :description="importing.lockedNote" />
    </FpConfirmModal>
</template>
