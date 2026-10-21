<script setup lang="ts">
import {
    FpAsyncView,
    FpAvatar,
    FpButton,
    FpCard,
    FpEmpty,
    FpFormField,
    FpIcon,
    FpIconTile,
    FpInput,
    FpShake,
} from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useOnboardingFrame } from '../../composables/useOnboardingFrame'
import { useRestore } from '../../composables/useRestore'
import FieldNote from '../FieldNote.vue'
import OnboardingStep from './OnboardingStep.vue'

const { t } = useI18n()
const { fieldSize, buttonSize } = useOnboardingFrame()
const {
    account,
    backups,
    status,
    restoreLabel,
    password,
    wrong,
    failedAttempts,
    restore,
    switchAccount,
    showOtherBackups,
} = useRestore()
</script>

<template>
    <OnboardingStep
        :title="t('Restore from Google Drive')"
        :description="t('The backup is decrypted on this device with the password it was made with.')"
        back="/welcome">
        <FpAsyncView :status>
            <FpCard>
                <div class="flex items-center gap-3">
                    <FpAvatar round size="lg" :alt="account?.name" />
                    <div class="flex min-w-0 flex-1 flex-col">
                        <span class="font-semibold text-14 text-fg-1">{{ account?.name }}</span>
                        <span class="truncate text-12.5 text-fg-3">{{ account?.email }}</span>
                    </div>
                    <FpButton variant="soft" size="sm" @click="switchAccount">{{ t('Switch') }}</FpButton>
                </div>
            </FpCard>

            <FpCard>
                <div class="flex items-center gap-2">
                    <span class="eyebrow flex-1">{{ t('Latest backup') }}</span>
                    <FpButton
                        v-if="backups?.others"
                        variant="ghost"
                        size="sm"
                        class="text-fg-3!"
                        @click="showOtherBackups">
                        {{ t('Other backups ({count})', { count: backups.others }) }}
                    </FpButton>
                </div>
                <div class="flex items-center gap-3">
                    <FpIconTile name="icon-[lucide--archive]" color="accent" />
                    <div class="flex flex-1 flex-col gap-0.5">
                        <span class="font-semibold text-14.5 text-fg-1">{{ backups?.latest.date }}</span>
                        <span class="font-mono text-12.5 text-fg-3">{{ backups?.latest.meta }}</span>
                    </div>
                </div>
            </FpCard>

            <div class="flex flex-col gap-2">
                <FpFormField :label="t('Backup password')" :error="wrong">
                    <FpShake :trigger="failedAttempts">
                        <FpInput
                            v-model="password"
                            type="password"
                            no-reveal
                            :size="fieldSize"
                            :placeholder="t('Password used when the backup was made')"
                            @keydown.enter="restore">
                            <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                        </FpInput>
                    </FpShake>
                </FpFormField>
                <FieldNote v-if="wrong">{{ t('Wrong password for this backup. Try “demo”.') }}</FieldNote>
            </div>

            <template #empty>
                <FpEmpty
                    :title="t('No backups on this Drive')"
                    :description="t('Make a backup in Steam Organizer first, or create a new vault.')">
                    <template #leading><FpIcon name="icon-[lucide--cloud-off]" /></template>
                </FpEmpty>
            </template>
        </FpAsyncView>

        <template v-if="status === 'ready'" #cta>
            <FpButton block color="accent" :size="buttonSize" @click="restore">
                {{ restoreLabel }}
            </FpButton>
        </template>
    </OnboardingStep>
</template>
