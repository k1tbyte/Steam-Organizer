<script setup lang="ts">
import { FpIcon } from '@so/ui'
import { useI18n } from 'vue-i18n'

import { useWelcome } from '../../../composables/useWelcome'
import OnboardingStep from '../OnboardingStep.vue'
import StartOption from './StartOption.vue'
import WebOnlyNotice from './WebOnlyNotice.vue'

const { t } = useI18n()
const { options, intro, assurance, webOnlyNotice, choose, getExtension } =
    useWelcome()
</script>

<template>
    <OnboardingStep
        brand
        :title="t('Your Steam accounts, encrypted on this device')"
        :description="intro">
        <div class="flex flex-col gap-2">
            <StartOption
                v-for="option in options"
                :key="option.key"
                :option
                @choose="choose(option.key)" />
        </div>
        <template #footer>
            <p class="flex items-center justify-center gap-2 text-12.5 text-fg-3 lg:justify-start">
                <FpIcon name="icon-[lucide--lock]" class="text-13" aria-hidden="true" />
                {{ assurance }}
            </p>
        </template>
    </OnboardingStep>
    <WebOnlyNotice v-if="webOnlyNotice" @get-extension="getExtension" />
</template>
