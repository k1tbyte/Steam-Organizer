<script setup lang="ts">
import { FpAlert, FpButton, FpCheckbox, FpModal } from '@so/ui'
import { useI18n } from 'vue-i18n'

import PasswordFields from '../password/PasswordFields.vue'
import { useExportVault } from './useExportVault'

const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const view = useExportVault(open)
</script>

<template>
    <FpModal
        v-model:open="open"
        :title="t('Export vault')"
        :description="t('Every account, sealed in one file. Import it on another device, or here to bring this vault back to it.')"
        width="min(92vw, 30rem)">
        <form id="export-vault" class="flex flex-col gap-4" @submit.prevent="view.submit">
            <FpCheckbox
                v-model="view.ownPassword.value"
                :label="t('Protect the file with its own password')"
                :description="t('Otherwise it opens with the master password')" />
            <template v-if="view.ownPassword.value">
                <PasswordFields
                    :fields="view.fields"
                    :next-label="t('File password')"
                    :repeat-label="t('Repeat file password')" />
                <FpAlert :description="t('Keep this password: without it the file can\'t be opened.')" />
            </template>
        </form>
        <template #footer>
            <FpButton size="lg" variant="ghost" :label="t('Cancel')" @click="open = false" />
            <FpButton
                size="lg"
                type="submit"
                form="export-vault"
                color="accent"
                :disabled="!view.canSubmit.value"
                :loading="view.saving.value"
                :label="t('Export')" />
        </template>
    </FpModal>
</template>
