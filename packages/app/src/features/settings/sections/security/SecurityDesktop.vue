<script setup lang="ts">
import {
    FpAlert,
    FpButton,
    FpEyebrow,
    FpFormRow,
    FpIconTile,
    FpSelect,
    FpSwitch,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useSecuritySection } from './useSecuritySection'

defineEmits<{ changePassword: [] }>()

const { t } = useI18n()
const view = useSecuritySection()
</script>

<template>
    <div>
        <FpEyebrow class="ml-0! pt-1.5 pb-2">{{ t('Auto-lock') }}</FpEyebrow>
        <FpFormRow
            :label="t('Lock after')"
            :description="t('Time without activity in the app, popup or autofill')">
            <div class="w-full sm:w-52.5">
                <FpSelect
                    size="sm"
                    icon="icon-[lucide--timer]"
                    :aria-label="t('Lock after')"
                    :items="view.lockItems.value"
                    :model-value="view.lockAfter.value"
                    @update:model-value="view.setLockAfter" />
            </div>
        </FpFormRow>
        <FpAlert
            v-if="view.neverLocks.value"
            color="warning"
            class="mb-3.5"
            :description="t('The vault stays open in this browser until you lock it yourself. Anyone with this browser profile can open it.')" />
        <FpFormRow
            plain
            :label="t('Master password after browser restart')"
            :description="t('PIN and biometrics work again once you\'ve unlocked with it')">
            <FpSwitch
                :model-value="view.masterAfterRestart.value"
                :aria-label="t('Master password after browser restart')"
                @update:model-value="view.setMasterAfterRestart" />
        </FpFormRow>

        <FpEyebrow class="ml-0! pt-5.5 pb-2">{{ t('Unlock with') }}</FpEyebrow>
        <FpFormRow
            plain
            :label="t('Master password')"
            :description="t('Works on every device. Can\'t be recovered.')">
            <template #leading>
                <FpIconTile name="icon-[lucide--key-round]" size="sm" />
            </template>
            <FpButton
                size="sm"
                variant="soft"
                :label="t('Change…')"
                @click="$emit('changePassword')" />
        </FpFormRow>
        <FpFormRow plain :label="t('PIN')" :description="view.pinDescription.value">
            <template #leading>
                <FpIconTile name="icon-[lucide--grid-3x3]" size="sm" />
            </template>
            <div v-if="view.pin.value" class="flex gap-1.5">
                <FpButton
                    size="sm"
                    variant="soft"
                    :label="t('Change')"
                    @click="view.changePin" />
                <FpButton
                    size="sm"
                    variant="ghost"
                    class="text-fg-3! hover:bg-danger-soft! hover:text-danger!"
                    :label="t('Remove')"
                    @click="view.setPin(false)" />
            </div>
            <FpButton
                v-else
                size="sm"
                color="accent"
                :label="t('Set PIN')"
                @click="view.setPin(true)" />
        </FpFormRow>
        <FpFormRow
            plain
            :label="t('Windows Hello')"
            :description="t('A passkey on this device opens the vault')">
            <template #leading>
                <FpIconTile name="icon-[lucide--fingerprint]" size="sm" />
            </template>
            <FpSwitch
                :model-value="view.biometrics.value"
                :aria-label="t('Windows Hello')"
                @update:model-value="view.setBiometrics" />
        </FpFormRow>
    </div>
</template>
