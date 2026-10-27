<script setup lang="ts">
import { FpButton, FpFormField, FpIcon, FpIconTile, FpInput, FpModal } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { UnlockDialogState } from '../../composables/list/useUnlockDialog'
import LevelAvatar from '../card/LevelAvatar.vue'

defineProps<{ dialog: UnlockDialogState }>()

const { t } = useI18n()
</script>

<template>
    <FpModal
        v-model:open="dialog.open"
        :title="t('Unlock account')"
        bare
        width="min(92vw, 25rem)">
        <div v-if="dialog.done" class="flex flex-col items-center gap-2.5 px-6 py-10 text-center">
            <FpIconTile name="icon-[lucide--lock-open]" size="lg" color="success" />
            <span class="font-semibold text-16 text-fg-1">{{ t('Unlocked') }}</span>
            <span class="text-13 text-fg-3">{{ t('Locks again when you leave this page.') }}</span>
        </div>
        <form v-else-if="dialog.account" class="flex flex-col items-center gap-4 px-6 pt-7 pb-5.5" @submit.prevent="dialog.unlock">
            <div class="relative flex">
                <LevelAvatar
                    size="md"
                    :name="dialog.account.nickname"
                    :hue="dialog.account.hue"
                    :level="dialog.account.level"
                    :anonymous="dialog.account.anonymous" />
                <span class="absolute -right-1.5 -bottom-1.5 grid size-6 place-items-center rounded-full bg-surface-pop text-13 text-fg-2 ring-2 ring-surface-pop">
                    <FpIcon name="icon-[lucide--lock]" />
                </span>
            </div>
            <div class="flex flex-col items-center gap-1 text-center">
                <span class="font-semibold text-17 text-fg-1">{{ t('{name} is locked', { name: dialog.account.nickname }) }}</span>
                <span class="text-13 text-fg-3 leading-snug text-pretty">{{ dialog.note }}</span>
            </div>
            <template v-if="dialog.recoveryOff">
                <div class="flex items-start gap-2.5 rounded bg-danger-soft p-3.5 text-left">
                    <FpIcon name="icon-[lucide--circle-alert]" class="mt-0.5 text-18 text-danger" />
                    <span class="text-13 text-fg-2 leading-snug text-pretty">
                        {{ t("Recovery is off for this account: the master password can't open it.") }}
                    </span>
                </div>
            </template>
            <template v-else>
                <FpFormField :error="dialog.error">
                    <FpInput
                        v-model="dialog.password"
                        type="password"
                        no-reveal
                        size="lg"
                        :placeholder="dialog.placeholder"
                        :aria-label="dialog.placeholder"
                        @input="dialog.clearError">
                        <template #leading>
                            <FpIcon v-if="dialog.usesMaster" name="icon-[lucide--lock-keyhole]" />
                            <FpIcon v-else name="icon-[lucide--key-round]" />
                        </template>
                    </FpInput>
                </FpFormField>
                <FpButton type="submit" color="accent" size="xl" block :loading="dialog.busy" :label="t('Unlock')" />
            </template>
            <FpButton variant="link" color="accent" size="sm" :label="dialog.switchLabel" @click="dialog.switchMode" />
        </form>
    </FpModal>
</template>
