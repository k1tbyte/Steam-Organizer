<script setup lang="ts">
import { FpButton, FpDrawer, FpIcon, FpModal, useDesktopLayout } from '@so/ui'
import { useI18n } from 'vue-i18n'

import type { Account } from '#features/accounts'

import type { LockDialogState } from '../../composables/useLockDialog'
import LockAccountForm from './LockAccountForm.vue'

defineProps<{ account: Account; dialog: LockDialogState }>()

const { t } = useI18n()
const desktop = useDesktopLayout()
</script>

<template>
    <FpModal
        v-if="desktop"
        v-model:open="dialog.open"
        :title="t('Lock account')"
        width="min(92vw, 32.5rem)">
        <LockAccountForm :account="account" :dialog="dialog" />
        <template #footer-start>
            <span class="text-12 text-fg-3">{{ t('Re-locks when you leave the account') }}</span>
        </template>
        <template #footer>
            <FpButton variant="ghost" :label="t('Cancel')" @click="dialog.open = false" />
            <FpButton type="submit" form="lock-account" color="accent" :disabled="!dialog.canLock">
                <FpIcon name="icon-[lucide--lock-keyhole]" />
                {{ t('Lock account') }}
            </FpButton>
        </template>
    </FpModal>
    <FpDrawer v-else v-model:open="dialog.open" bare :title="t('Lock account')">
        <div class="grid grid-cols-[1fr_auto_1fr] items-center px-2 pb-2">
            <FpButton
                variant="ghost"
                size="lg"
                class="justify-self-start text-fg-2!"
                :label="t('Cancel')"
                @click="dialog.open = false" />
            <span class="font-semibold text-16 text-fg-1">{{ t('Lock account') }}</span>
            <FpButton
                type="submit"
                form="lock-account"
                variant="ghost"
                color="accent"
                size="lg"
                class="justify-self-end font-semibold!"
                :disabled="!dialog.canLock"
                :label="t('Lock')" />
        </div>
        <div class="px-4 pt-2 pb-6">
            <LockAccountForm :account="account" :dialog="dialog" />
        </div>
    </FpDrawer>
</template>
