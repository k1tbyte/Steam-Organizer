<script setup lang="ts">
import {
    FpAlert,
    FpButton,
    FpCheckbox,
    FpHoldButton,
    FpIcon,
    FpInput,
    FpModal,
    FpSegmentedMeter,
} from '@so/ui'
import { toRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { useResetVault } from '../../composables/useResetVault'

const props = defineProps<{ vault?: { id: string; name: string } }>()
const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const view = useResetVault(open, toRef(props, 'vault'))
</script>

<template>
    <FpModal
        v-model:open="open"
        :dismissible="!view.resetting.value"
        :title="t('Reset vault')"
        width="min(92vw, 30rem)">
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
                    <span class="text-13.5 leading-snug text-fg-1">{{ view.accountsLabel.value }}</span>
                </li>
                <li v-if="view.authenticatorsLabel.value" class="flex items-start gap-2.5 p-2">
                    <FpIcon name="icon-[lucide--shield-alert]" class="mt-px text-16 text-danger" />
                    <span class="flex flex-col gap-0.5">
                        <span class="text-13.5 leading-snug text-fg-1">{{ view.authenticatorsLabel.value }}</span>
                        <span class="text-12.5 leading-snug text-fg-3">
                            {{ t('Without their revocation codes or maFiles you can lose access to those Steam accounts.') }}
                        </span>
                    </span>
                </li>
                <li v-if="view.hasCopy.value" class="flex items-start gap-2.5 p-2">
                    <FpIcon name="icon-[simple-icons--googledrive]" class="mt-px text-16 text-fg-3" />
                    <span class="flex flex-col gap-0.5">
                        <span class="text-13.5 leading-snug text-fg-1">{{ t('Its synced copy in Google Drive') }}</span>
                        <span class="text-12.5 leading-snug text-fg-3">
                            {{ t('Other devices keep the vault, on their own.') }}
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
            <span v-else-if="view.backupsUnknown.value" class="text-12.5 leading-snug text-fg-3">
                {{ t("Couldn't check Google Drive for its backups. Any there stay.") }}
            </span>
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
            <FpHoldButton block :disabled="view.resetting.value" @confirm="view.reset">
                <FpIcon name="icon-[lucide--trash-2]" />
                {{ view.resetting.value ? t('Resetting…') : t('Hold to reset vault') }}
            </FpHoldButton>
            <FpAlert
                v-if="view.problem.value"
                color="danger"
                :title="view.problem.value.title"
                :description="view.problem.value.description" />
            <span v-else class="text-center text-12 text-fg-3">{{ t('Release to cancel') }}</span>
        </div>

        <template v-if="view.hasBack.value" #footer-start>
            <FpButton size="lg" variant="ghost" :disabled="view.resetting.value" @click="view.back">
                <FpIcon name="icon-[lucide--chevron-left]" class="text-16" />
                {{ t('Back') }}
            </FpButton>
        </template>
        <template #footer>
            <FpButton
                size="lg"
                variant="ghost"
                :disabled="view.resetting.value"
                :label="t('Cancel')"
                @click="open = false" />
            <FpButton
                v-if="!view.isLastStep.value"
                size="lg"
                color="danger"
                :disabled="!view.canContinue.value"
                :label="t('Continue')"
                @click="view.next" />
        </template>
    </FpModal>
</template>
