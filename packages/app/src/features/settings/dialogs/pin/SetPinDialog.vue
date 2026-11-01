<script setup lang="ts">
import { FpButton, FpFormField, FpIcon, FpInput, FpModal, FpPinInput, FpShake } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useSetPin } from './useSetPin'

const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const view = useSetPin(open)
</script>

<template>
    <FpModal v-model:open="open" :title="view.title.value" width="min(92vw, 30rem)">
        <form id="set-pin" class="flex flex-col gap-4" @submit.prevent="view.submit">
            <p class="text-13 leading-snug text-fg-3">
                {{ t('6 digits to unlock on this device. The master password still works everywhere.') }}
            </p>
            <FpFormField :label="t('Master password')" :error="view.passwordError.value">
                <FpShake :trigger="view.failedAttempts.value">
                    <FpInput
                        v-model="view.password.value"
                        type="password"
                        autocomplete="current-password"
                        :placeholder="t('Master password')">
                        <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                    </FpInput>
                </FpShake>
            </FpFormField>
            <FpFormField :label="t('PIN')">
                <FpPinInput v-model="view.pin.value" masked size="lg" :length="view.PIN_LENGTH" />
            </FpFormField>
            <FpFormField :label="t('Repeat PIN')" :error="view.repeatError.value">
                <FpPinInput v-model="view.repeat.value" masked size="lg" :length="view.PIN_LENGTH" />
            </FpFormField>
        </form>
        <template #footer>
            <FpButton size="lg" variant="ghost" :label="t('Cancel')" @click="open = false" />
            <FpButton
                size="lg"
                type="submit"
                form="set-pin"
                color="accent"
                :disabled="!view.complete.value"
                :loading="view.saving.value"
                :label="view.title.value" />
        </template>
    </FpModal>
</template>
