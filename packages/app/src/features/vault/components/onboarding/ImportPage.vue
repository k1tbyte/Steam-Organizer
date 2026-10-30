<script setup lang="ts">
import { FpButton, FpCard, FpFormField, FpIcon, FpIconTile, FpInput, FpShake } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useImportFile } from '../../composables/onboarding/useImportFile'
import { useOnboardingFrame } from '../../composables/onboarding/useOnboardingFrame'
import FieldNote from '../FieldNote.vue'
import OnboardingStep from './OnboardingStep.vue'

const { t } = useI18n()
const { fieldSize, buttonSize } = useOnboardingFrame()
const { picked, fileProblem, password, problem, failedAttempts, importing, canImport, pick, submit } =
    useImportFile()
</script>

<template>
    <OnboardingStep
        :title="t('Import encrypted file')"
        :description="t('The file is decrypted on this device with the password it was exported with.')"
        back="/welcome">
        <div class="flex flex-col gap-2">
            <FpCard>
                <div v-if="picked" class="flex items-center gap-3">
                    <FpIconTile name="icon-[lucide--file-lock-2]" color="accent" />
                    <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span class="truncate font-semibold text-14.5 text-fg-1">{{ picked.name }}</span>
                        <span class="font-mono text-12.5 text-fg-3">{{ picked.size }}</span>
                    </div>
                    <FpButton variant="soft" size="sm" @click="pick">{{ t('Change') }}</FpButton>
                </div>
                <div v-else class="flex flex-col items-center gap-3 py-2 text-center">
                    <span class="text-13.5 text-fg-2">
                        {{ t('Pick a .sovault file exported from Steam Organizer.') }}
                    </span>
                    <FpButton variant="soft" :size="buttonSize" @click="pick">
                        <FpIcon name="icon-[lucide--file-up]" aria-hidden="true" />
                        {{ t('Choose file') }}
                    </FpButton>
                </div>
            </FpCard>
            <FieldNote v-if="fileProblem">{{ fileProblem }}</FieldNote>
        </div>

        <div v-if="canImport" class="flex flex-col gap-2">
            <FpFormField :label="t('File password')" :error="problem !== null">
                <FpShake :trigger="failedAttempts">
                    <FpInput
                        v-model="password"
                        type="password"
                        no-reveal
                        :size="fieldSize"
                        :placeholder="t('Password used when the file was exported')"
                        @submit="submit">
                        <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                    </FpInput>
                </FpShake>
            </FpFormField>
            <FieldNote v-if="problem">{{ problem }}</FieldNote>
        </div>

        <template v-if="canImport" #cta>
            <FpButton block color="accent" :size="buttonSize" :loading="importing" @click="submit">
                {{ t('Import vault') }}
            </FpButton>
        </template>
    </OnboardingStep>
</template>
