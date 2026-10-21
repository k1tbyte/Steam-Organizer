<script setup lang="ts">
import {
    FpButton,
    FpCheckbox,
    FpHoldButton,
    FpIcon,
    FpIconTile,
    FpInput,
    FpModal,
    FpSegmentedMeter,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useResetVault } from './useResetVault'

const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const view = useResetVault(open)
</script>

<template>
    <FpModal v-model:open="open" :title="t('Reset vault')" width="min(92vw, 30rem)">
        <template v-if="!view.done.value">
            <div class="-mt-1 mb-4.5 flex items-center gap-3">
                <FpSegmentedMeter
                    class="flex-1"
                    tone="danger"
                    :max="view.steps"
                    :value="view.step.value"
                    :aria-label="t('Reset progress')" />
                <span class="font-medium font-mono text-12 text-fg-3">
                    {{ t('{step} / {total}', { step: view.step.value, total: view.steps }) }}
                </span>
            </div>

            <div v-if="view.step.value === 1" class="flex flex-col gap-3.5">
                <div class="flex flex-col gap-1">
                    <span class="font-semibold text-15 text-fg-1">{{ t('This deletes the vault for good') }}</span>
                    <span class="text-13 leading-snug text-fg-3">
                        {{ t('Use it only when the master password is lost. Nothing below can be restored afterwards.') }}
                    </span>
                </div>
                <ul class="flex flex-col gap-0.5 rounded bg-surface-hi p-1.5">
                    <li class="flex items-start gap-2.5 p-2">
                        <FpIcon name="icon-[lucide--users]" class="mt-px text-16 text-fg-3" />
                        <span class="text-13.5 leading-snug text-fg-1">
                            {{ t('{count} account with logins, passwords, linked services and notes | {count} accounts with logins, passwords, linked services and notes', view.accounts.value) }}
                        </span>
                    </li>
                    <li v-if="view.hasAuthenticators.value" class="flex items-start gap-2.5 p-2">
                        <FpIcon name="icon-[lucide--shield-alert]" class="mt-px text-16 text-danger" />
                        <span class="flex flex-col gap-0.5">
                            <span class="text-13.5 leading-snug text-fg-1">
                                {{ t('{count} Steam Guard authenticator | {count} Steam Guard authenticators', view.authenticators.value) }}
                            </span>
                            <span class="text-12.5 leading-snug text-fg-3">
                                {{ t('Without their revocation codes or maFiles you can lose access to those Steam accounts.') }}
                            </span>
                        </span>
                    </li>
                    <li class="flex items-start gap-2.5 p-2">
                        <FpIcon name="icon-[lucide--fingerprint]" class="mt-px text-16 text-fg-3" />
                        <span class="text-13.5 leading-snug text-fg-1">
                            {{ t('PIN and Windows Hello unlock on this device') }}
                        </span>
                    </li>
                </ul>
                <FpCheckbox
                    v-if="view.hasBackups.value"
                    v-model="view.alsoDeleteBackups.value"
                    color="danger"
                    :label="t('Also delete {count} backup from Google Drive | Also delete {count} backups from Google Drive', view.backupCount.value)"
                    :description="t('They\'re sealed with the same lost password')" />
            </div>

            <div v-else-if="view.step.value === 2" class="flex flex-col gap-3.5">
                <div class="flex flex-col gap-1">
                    <span class="font-semibold text-15 text-fg-1">{{ t('Type the vault name') }}</span>
                    <span class="flex flex-wrap items-center gap-1.5 text-13 text-fg-3">
                        {{ t('To continue, type') }}
                        <span class="rounded bg-surface-hi px-1.75 py-px font-medium font-mono text-12.5 text-fg-1">
                            {{ view.vaultName.value }}
                        </span>
                    </span>
                </div>
                <FpInput
                    v-model="view.typedName.value"
                    spellcheck="false"
                    :aria-label="t('Vault name')"
                    :placeholder="t('Vault name')"
                    :valid="view.nameMatches.value"
                    @keydown.enter.prevent="view.next">
                    <template #leading><FpIcon name="icon-[lucide--vault]" /></template>
                </FpInput>
            </div>

            <div v-else class="flex flex-col gap-3.5">
                <div class="flex flex-col gap-1">
                    <span class="font-semibold text-15 text-fg-1">{{ t('Last step') }}</span>
                    <span class="text-13 leading-snug text-fg-3">{{ view.lastStepSummary.value }}</span>
                </div>
                <FpHoldButton block @confirm="view.reset">
                    <FpIcon name="icon-[lucide--trash-2]" />
                    {{ t('Hold to reset vault') }}
                </FpHoldButton>
                <span class="text-center text-12 text-fg-3">{{ t('Release to cancel') }}</span>
            </div>
        </template>

        <div v-else class="flex flex-col items-center gap-2.5 px-3 pt-4 text-center">
            <FpIconTile name="icon-[lucide--circle-check]" size="lg" />
            <span class="font-semibold text-16 text-fg-1">{{ t('Vault reset') }}</span>
            <span class="text-13 leading-snug text-fg-3">
                {{ t('Everything was deleted. Create a new vault or restore one from an encrypted file.') }}
            </span>
        </div>

        <template v-if="view.hasBack.value && !view.done.value" #footer-start>
            <FpButton size="lg" variant="ghost" @click="view.back">
                <FpIcon name="icon-[lucide--chevron-left]" class="text-16" />
                {{ t('Back') }}
            </FpButton>
        </template>
        <template #footer>
            <template v-if="view.done.value">
                <FpButton size="lg" variant="ghost" :label="t('Import a file')" @click="open = false" />
                <FpButton size="lg" color="accent" :label="t('Create new vault')" @click="open = false" />
            </template>
            <template v-else>
                <FpButton size="lg" variant="ghost" :label="t('Cancel')" @click="open = false" />
                <FpButton
                    v-if="!view.isLastStep.value"
                    size="lg"
                    color="danger"
                    :disabled="!view.canContinue.value"
                    :label="t('Continue')"
                    @click="view.next" />
            </template>
        </template>
    </FpModal>
</template>
