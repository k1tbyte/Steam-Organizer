<script setup lang="ts">
import { FpButton, FpCard, FpDot, FpFormField, FpIcon, FpIconTile, FpInput } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useOnboardingFrame } from '../../composables/useOnboardingFrame'
import { useSteamAccess } from '../../composables/useSteamAccess'
import OnboardingStep from './OnboardingStep.vue'

const { t } = useI18n()
const { buttonSize } = useOnboardingFrame()
const { granted, apiKey, keyError, creating, grant, finish } = useSteamAccess()
</script>

<template>
    <OnboardingStep
        :title="t('Connect to Steam')"
        :description="t('Needed for profiles, bans, games and prices. Both can be changed later in Settings.')">
        <FpCard>
            <div class="flex items-start gap-3">
                <FpIconTile name="icon-[lucide--globe-lock]" size="sm" />
                <div class="flex flex-1 flex-col gap-0.75">
                    <span class="font-semibold text-14.5 text-fg-1">{{ t('Access to Steam sites') }}</span>
                    <span class="text-13 text-fg-3 leading-[1.45]">
                        {{ t('Lets the extension read Steam data and fill sign-in forms on steampowered.com and steamcommunity.com.') }}
                    </span>
                </div>
            </div>
            <div class="flex items-center gap-2.5 pl-11">
                <template v-if="!granted">
                    <span class="flex items-center gap-1.5 text-12.5 text-warning">
                        <FpDot color="warning" />
                        {{ t('Not granted') }}
                    </span>
                    <span class="flex-1" />
                    <FpButton color="accent" @click="grant">{{ t('Grant access') }}</FpButton>
                </template>
                <span v-else class="flex items-center gap-1.5 text-12.5 text-success">
                    <FpIcon name="icon-[lucide--check]" class="text-14" aria-hidden="true" />
                    {{ t('Granted') }}
                </span>
            </div>
        </FpCard>

        <FpCard>
            <div class="flex items-start gap-3">
                <FpIconTile name="icon-[lucide--key-square]" size="sm" />
                <div class="flex flex-1 flex-col gap-0.75">
                    <span class="flex items-baseline gap-1.5 font-semibold text-14.5 text-fg-1">
                        {{ t('Steam Web API key') }}
                        <span class="font-normal text-12.5 text-fg-3">{{ t('Optional') }}</span>
                    </span>
                    <span class="text-13 text-fg-3 leading-[1.45]">
                        {{ t('Stored inside the encrypted vault.') }}
                        <FpButton
                            as="a"
                            variant="link"
                            color="accent"
                            href="https://steamcommunity.com/dev/apikey"
                            target="_blank"
                            rel="noopener">
                            {{ t('Get a key on Steam') }}
                        </FpButton>
                    </span>
                </div>
            </div>
            <FpFormField class="pl-11" :error="keyError">
                <FpInput
                    v-model="apiKey"
                    class="font-mono"
                    :aria-label="t('Steam Web API key')"
                    :placeholder="t('32 characters, A–F and 0–9')" />
            </FpFormField>
        </FpCard>

        <template #cta>
            <div class="flex gap-2">
                <FpButton variant="ghost" :size="buttonSize" :disabled="creating" @click="finish(false)">{{ t('Skip for now') }}</FpButton>
                <FpButton color="accent" class="flex-1" :size="buttonSize" :loading="creating" @click="finish(true)">
                    {{ t('Open accounts') }}
                </FpButton>
            </div>
        </template>
    </OnboardingStep>
</template>
