<script setup lang="ts">
import { FpButton, FpFormField, FpIcon, FpInput, FpModal, FpShake } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useEnableHello } from './useEnableHello'

const open = defineModel<boolean>('open', { default: false })
const { t } = useI18n()
const view = useEnableHello(open)
</script>

<template>
    <FpModal
        v-model:open="open"
        :title="t('Turn on {hello}', { hello: view.label.value })"
        width="min(92vw, 30rem)">
        <form id="enable-hello" class="flex flex-col gap-4" @submit.prevent="view.submit">
            <p class="text-13 leading-snug text-fg-3">
                {{ t('Confirm your master password, then {hello} asks once to make a passkey on this device. The master password still works everywhere.', { hello: view.label.value }) }}
            </p>
            <FpFormField :label="t('Master password')" :error="view.error.value">
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
        </form>
        <template #footer>
            <FpButton size="lg" variant="ghost" :label="t('Cancel')" @click="open = false" />
            <FpButton
                size="lg"
                type="submit"
                form="enable-hello"
                color="accent"
                :disabled="view.password.value === ''"
                :loading="view.saving.value"
                :label="t('Turn on')" />
        </template>
    </FpModal>
</template>
