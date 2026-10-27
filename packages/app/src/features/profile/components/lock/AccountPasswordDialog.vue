<script setup lang="ts">
import { FpAlert, FpButton, FpFormField, FpIcon, FpInput, FpModal, FpSegmentedMeter, FpShake } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { type Account, LevelAvatar } from '#features/accounts'
import type { AccountPasswordDialogState } from '../../composables/lock/useAccountPasswordDialog'

defineProps<{ account: Account; dialog: AccountPasswordDialogState }>()

const { t } = useI18n()
</script>

<template>
    <FpModal v-model:open="dialog.open" :title="t('Change account password')" width="min(92vw, 30rem)">
        <form id="account-password" class="flex flex-col gap-4" @submit.prevent="dialog.change">
            <div class="flex items-center gap-3 rounded bg-surface-hi px-3 py-2.5">
                <LevelAvatar size="sm" :name="account.nickname" :hue="account.hue" :level="account.level" :anonymous="account.anonymous" />
                <span class="min-w-0 flex-1 truncate font-semibold text-14 text-fg-1">{{ account.nickname }}</span>
                <FpIcon name="icon-[lucide--lock]" class="text-fg-3" />
            </div>
            <FpFormField :label="t('Current password')" :error="dialog.currentError">
                <template v-if="dialog.recovery" #hint>
                    <FpButton variant="link" color="accent" size="xs" :label="dialog.switchLabel" @click="dialog.switchMode" />
                </template>
                <FpShake :trigger="dialog.failedAttempts">
                    <FpInput
                        v-model="dialog.current"
                        type="password"
                        autocomplete="current-password"
                        :placeholder="dialog.currentPlaceholder">
                        <template #leading>
                            <FpIcon v-if="dialog.usesMaster" name="icon-[lucide--lock-keyhole]" />
                            <FpIcon v-else name="icon-[lucide--key-round]" />
                        </template>
                    </FpInput>
                </FpShake>
            </FpFormField>
            <div class="flex flex-col gap-2.5">
                <FpFormField :label="t('New password')">
                    <FpInput v-model="dialog.next" type="password" autocomplete="new-password" :placeholder="t('PIN or passphrase')">
                        <template #leading><FpIcon name="icon-[lucide--lock-keyhole]" /></template>
                    </FpInput>
                </FpFormField>
                <FpSegmentedMeter :value="dialog.strength.level" :tone="dialog.strength.tone" :label="dialog.strength.label" />
                <FpFormField :error="dialog.repeatError">
                    <FpInput
                        v-model="dialog.repeat"
                        type="password"
                        autocomplete="new-password"
                        :aria-label="t('Repeat new password')"
                        :placeholder="t('Repeat new password')"
                        :valid="dialog.repeatMatches">
                        <template #leading><FpIcon name="icon-[lucide--repeat-2]" /></template>
                    </FpInput>
                </FpFormField>
            </div>
            <FpAlert :description="dialog.note" />
        </form>
        <template #footer-start>
            <FpButton
                size="lg"
                variant="ghost"
                color="danger"
                :disabled="!dialog.canRemove"
                :loading="dialog.saving === 'remove'"
                :label="t('Remove lock')"
                @click="dialog.remove" />
        </template>
        <template #footer>
            <FpButton size="lg" variant="ghost" :label="t('Cancel')" @click="dialog.open = false" />
            <FpButton
                size="lg"
                type="submit"
                form="account-password"
                color="accent"
                :disabled="!dialog.canChange"
                :loading="dialog.saving === 'change'"
                :label="t('Change')" />
        </template>
    </FpModal>
</template>
