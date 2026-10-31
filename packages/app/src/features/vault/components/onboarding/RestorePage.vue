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

import { useOnboardingFrame } from '../../composables/onboarding/useOnboardingFrame'
import { useRestore } from '../../composables/onboarding/useRestore'
import FieldNote from '../FieldNote.vue'
import OnboardingStep from './OnboardingStep.vue'

const { t } = useI18n()
const { fieldSize, buttonSize } = useOnboardingFrame()
const {
    account,
    signedIn,
    expired,
    connecting,
    status,
    failure,
    latest,
    heading,
    pickedCopy,
    others,
    listOpen,
    restoreLabel,
    password,
    problem,
    failedAttempts,
    restoring,
    restore,
    retry,
    signIn,
    switchAccount,
    pick,
} = useRestore()
</script>

<template>
    <OnboardingStep
        :title="t('Restore from Google Drive')"
        :description="t('The backup is decrypted on this device with the password it was made with.')"
        back="/welcome">
        <FpCard v-if="!signedIn">
            <div class="flex flex-col items-center gap-3 py-2 text-center">
                <span class="text-13.5 text-fg-2">
                    {{ t('Sign in to the Google account your backups are on.') }}
                </span>
                <FpButton variant="soft" :size="buttonSize" :loading="connecting" @click="signIn">
                    <FpIcon name="icon-[simple-icons--google]" aria-hidden="true" />
                    {{ t('Sign in with Google') }}
                </FpButton>
            </div>
        </FpCard>
        <template v-else>
            <FpCard>
                <div class="flex items-center gap-3">
                    <FpAvatar round size="lg" :alt="account?.name" />
                    <div class="flex min-w-0 flex-1 flex-col">
                        <span class="font-semibold text-14 text-fg-1">{{ account?.name }}</span>
                        <span class="truncate text-12.5 text-fg-3">{{ account?.email }}</span>
                    </div>
                    <FpButton
                        v-if="expired"
                        color="accent"
                        variant="soft"
                        size="sm"
                        :loading="connecting"
                        @click="signIn">
                        {{ t('Sign in again') }}
                    </FpButton>
                    <FpButton variant="soft" size="sm" @click="switchAccount">{{ t('Switch') }}</FpButton>
                </div>
            </FpCard>

            <FpAsyncView
                :status="status"
                :error-title="failure?.title"
                :error-description="failure?.description"
                :retry-label="failure?.kind === 'unauthorized' ? undefined : t('Retry')"
                @retry="retry">
                <FpCard>
                    <div class="flex items-center gap-2">
                        <span class="eyebrow flex-1">{{ heading }}</span>
                        <FpButton
                            v-if="others.length > 1"
                            variant="ghost"
                            size="sm"
                            class="text-fg-3!"
                            :aria-expanded="listOpen"
                            @click="listOpen = !listOpen">
                            {{ listOpen ? t('Hide') : t('Other backups ({count})', { count: others.length - 1 }) }}
                        </FpButton>
                    </div>
                    <div v-if="listOpen" class="-mx-2 flex flex-col">
                        <button
                            v-for="row in others"
                            :key="row.id"
                            type="button"
                            class="flex cursor-pointer flex-col gap-0.5 rounded px-2 py-2 text-left transition-colors duration-fast hover:bg-hover"
                            :class="row.picked && 'bg-accent-soft'"
                            :aria-pressed="row.picked"
                            @click="pick(row.id)">
                            <span class="font-semibold text-13.5 text-fg-1">{{ row.date }}</span>
                            <span class="font-mono text-12 text-fg-3">{{ row.meta }}</span>
                        </button>
                    </div>
                    <div v-else-if="latest" class="flex items-center gap-3">
                        <FpIconTile :name="latest.icon" color="accent" />
                        <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span class="font-semibold text-14.5 text-fg-1">{{ latest.date }}</span>
                            <span class="truncate font-mono text-12.5 text-fg-3">{{ latest.meta }}</span>
                        </div>
                    </div>
                </FpCard>

                <div class="flex flex-col gap-2">
                    <FpFormField
                        :label="pickedCopy ? t('Master password') : t('Backup password')"
                        :error="problem !== null">
                        <FpShake :trigger="failedAttempts">
                            <FpInput
                                v-model="password"
                                type="password"
                                no-reveal
                                :size="fieldSize"
                                :placeholder="
                                    pickedCopy
                                        ? t('The vault\'s master password')
                                        : t('Password used when the backup was made')
                                "
                                @submit="restore">
                                <template #leading><FpIcon name="icon-[lucide--key-round]" /></template>
                            </FpInput>
                        </FpShake>
                    </FpFormField>
                    <FieldNote v-if="problem">{{ problem }}</FieldNote>
                </div>

                <template #empty>
                    <FpEmpty
                        :title="t('Nothing to restore on this Drive')"
                        :description="t('Make a backup in Steam Organizer first, or create a new vault.')">
                        <template #leading><FpIcon name="icon-[lucide--cloud-off]" /></template>
                    </FpEmpty>
                </template>
            </FpAsyncView>
        </template>

        <template v-if="signedIn && status === 'ready'" #cta>
            <FpButton block color="accent" :size="buttonSize" :loading="restoring" @click="restore">
                {{ restoreLabel }}
            </FpButton>
        </template>
    </OnboardingStep>
</template>
