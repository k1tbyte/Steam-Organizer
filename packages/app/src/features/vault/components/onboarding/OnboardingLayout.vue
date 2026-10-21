<script setup lang="ts">
import { provideOnboardingDraft } from '../../composables/useOnboardingDraft'
import { useOnboardingFrame } from '../../composables/useOnboardingFrame'
import BrandFrame from '../BrandFrame.vue'
import LanguageMenu from './welcome/LanguageMenu.vue'

provideOnboardingDraft()
const { onWelcome, headerLabel } = useOnboardingFrame()
</script>

<template>
    <BrandFrame>
        <template #aside>
            <LanguageMenu v-if="onWelcome" />
            <span
                v-else-if="headerLabel"
                class="font-medium font-mono text-12 text-fg-3">
                {{ headerLabel }}
            </span>
        </template>
        <RouterView />
    </BrandFrame>
</template>
