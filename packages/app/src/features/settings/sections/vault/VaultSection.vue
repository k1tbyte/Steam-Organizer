<script setup lang="ts">
import { FpButton, FpFormRow, FpIcon, FpIconTile } from '@so/ui'
import { useI18n } from 'vue-i18n'

import IdentityCard from '../../components/IdentityCard.vue'
import ResetVaultDialog from '../../dialogs/reset/ResetVaultDialog.vue'
import { useVaultSection } from './useVaultSection'

const { t } = useI18n()
const view = useVaultSection()
</script>

<template>
    <div v-if="view.vault.value">
        <IdentityCard>
            <template #leading>
                <FpIconTile name="icon-[lucide--vault]" color="accent" />
            </template>
            <span class="font-semibold text-14 text-fg-1">{{ view.vault.value.name }}</span>
            <span class="text-12.5 text-fg-3">{{ view.details.value }}</span>
            <template #actions>
                <FpButton
                    size="sm"
                    variant="ghost"
                    :label="t('Rename')"
                    @click="view.rename" />
            </template>
        </IdentityCard>
        <FpFormRow
            plain
            inline
            class="mt-2.5"
            :label="t('Export')"
            :description="t('Whole vault to an encrypted file with its own password')">
            <FpButton size="sm" variant="soft" @click="view.exportVault">
                <FpIcon name="icon-[lucide--download]" class="text-14" />
                {{ t('Export…') }}
            </FpButton>
        </FpFormRow>
        <FpFormRow
            plain
            inline
            :label="t('Import')"
            :description="t('Replaces everything in this vault with the file\'s contents')">
            <FpButton size="sm" variant="soft" @click="view.importVault">
                <FpIcon name="icon-[lucide--upload]" class="text-14" />
                {{ t('Import…') }}
            </FpButton>
        </FpFormRow>
        <div class="mt-4.5 rounded px-4 py-1 ring-1 ring-danger/40 ring-inset">
            <div class="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:gap-6">
                <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span class="font-semibold text-14 text-danger">{{ t('Reset vault') }}</span>
                    <span class="text-12.5 text-fg-3">
                        {{ t('For a lost master password. Deletes every account here and, if you choose, the backups in Drive.') }}
                    </span>
                </div>
                <div>
                    <FpButton
                        size="sm"
                        variant="soft"
                        color="danger"
                        :label="t('Reset vault…')"
                        @click="view.resetOpen.value = true" />
                </div>
            </div>
        </div>
        <ResetVaultDialog v-model:open="view.resetOpen.value" />
    </div>
</template>
