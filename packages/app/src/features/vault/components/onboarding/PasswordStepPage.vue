<script setup lang="ts">
import {
    FpAlert,
    FpButton,
    FpCheckbox,
    FpFormField,
    FpIcon,
    FpInput,
    FpSegmentedMeter,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useMasterPassword } from '../../composables/useMasterPassword'
import { useOnboardingFrame } from '../../composables/useOnboardingFrame'
import FieldNote from '../FieldNote.vue'
import OnboardingStep from './OnboardingStep.vue'

const { t } = useI18n()
const { fieldSize, buttonSize } = useOnboardingFrame()
const {
    password,
    repeat,
    acknowledged,
    strength,
    matches,
    mismatches,
    canCreate,
    create,
} = useMasterPassword()
</script>

<template>
    <OnboardingStep
        :title="t('Set a master password')"
        :description="t('It encrypts everything in the vault. Later you can also unlock this device with a PIN or Windows Hello.')"
        back="/welcome/vault">
        <div class="flex flex-col gap-2">
            <FpFormField :label="t('Master password')">
                <FpInput
                    v-model="password"
                    type="password"
                    :size="fieldSize"
                    :placeholder="t('At least 8 characters')">
                    <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                </FpInput>
            </FpFormField>
            <FpSegmentedMeter
                :value="strength.level"
                :tone="strength.tone"
                :label="strength.label" />
        </div>

        <div class="flex flex-col gap-2">
            <FpFormField :label="t('Repeat password')" :error="mismatches">
                <FpInput
                    v-model="repeat"
                    type="password"
                    :size="fieldSize"
                    :placeholder="t('Same password again')">
                    <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                </FpInput>
            </FpFormField>
            <FieldNote v-if="mismatches">{{ t("Passwords don't match") }}</FieldNote>
            <FieldNote v-else-if="matches" tone="success">{{ t('Passwords match') }}</FieldNote>
        </div>

        <FpAlert color="warning">
            <p class="text-13.5 leading-normal">
                {{ t('There is no way to recover this password. Without it, nobody can open the vault, not even from a backup.') }}
            </p>
            <FpCheckbox
                v-model="acknowledged"
                class="mt-2.5"
                :label="t('I understand and saved it somewhere safe')" />
        </FpAlert>

        <template #cta>
            <FpButton block color="accent" :size="buttonSize" :disabled="!canCreate" @click="create">
                {{ t('Create vault') }}
            </FpButton>
        </template>
    </OnboardingStep>
</template>
