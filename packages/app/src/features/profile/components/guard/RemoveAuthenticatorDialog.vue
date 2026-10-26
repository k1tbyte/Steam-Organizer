<script setup lang="ts">
import { FpButton, FpCheckbox, FpIcon, FpModal } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useCopyFeedback } from '#core'

import type { AuthenticatorState } from '../../composables/guard/useAuthenticator'

defineProps<{ authenticator: AuthenticatorState; revocationCode: string | null }>()

const { t } = useI18n()
const { copied, copy } = useCopyFeedback()
</script>

<template>
    <FpModal
        v-model:open="authenticator.removeOpen"
        :title="t('Remove authenticator?')"
        :description="t('The maFile leaves this vault and codes stop showing. Steam keeps the authenticator active, so you\'ll need the revocation code to remove it there.')"
        width="min(92vw, 27rem)">
        <div class="flex flex-col gap-3.5">
            <div v-if="revocationCode" class="flex items-center gap-3 rounded bg-surface-hi py-2 pr-2 pl-3.5">
                <div class="flex min-w-0 flex-1 flex-col">
                    <span class="text-12 text-fg-3">{{ t('Revocation code') }}</span>
                    <span class="font-mono font-semibold text-16 text-fg-1">{{ revocationCode }}</span>
                </div>
                <FpButton size="sm" variant="soft" :class="copied && 'text-success!'" @click="copy(revocationCode)">
                    <FpIcon :name="copied ? 'icon-[lucide--check]' : 'icon-[lucide--copy]'" />
                    {{ t('Copy') }}
                </FpButton>
            </div>
            <FpCheckbox v-model="authenticator.saved" color="danger" :label="t('I saved the revocation code or have a copy of the maFile')" />
        </div>
        <template #footer>
            <FpButton size="lg" variant="ghost" :label="t('Cancel')" @click="authenticator.removeOpen = false" />
            <FpButton
                size="lg"
                color="danger"
                :disabled="!authenticator.canRemove"
                :loading="authenticator.saving"
                :label="t('Remove')"
                @click="authenticator.remove" />
        </template>
    </FpModal>
</template>
