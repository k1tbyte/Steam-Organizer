<script setup lang="ts">
import {
    FpButton,
    FpEyebrow,
    FpFormRow,
    FpIcon,
    FpInput,
    FpLabel,
} from '@so/ui'
import { useId } from 'vue'
import { useI18n } from 'vue-i18n'

import SectionNote from '../../components/SectionNote.vue'
import { useSteamSection } from './useSteamSection'

const { t } = useI18n()
const view = useSteamSection()
const keyId = useId()
</script>

<template>
    <div>
        <div class="flex flex-col gap-2.5 border-stroke-1 border-t py-3.5">
            <div class="flex flex-wrap items-end gap-x-3 gap-y-1">
                <div class="flex min-w-0 flex-1 basis-48 flex-col gap-0.5">
                    <FpLabel :for="keyId" class="text-14! text-fg-1!">{{ t('Steam Web API key') }}</FpLabel>
                    <p class="text-12.5 text-fg-3">
                        {{ t('Needed for profiles, bans, games and prices. Stored inside the vault.') }}
                    </p>
                </div>
                <FpButton
                    as="a"
                    size="sm"
                    variant="ghost"
                    color="accent"
                    target="_blank"
                    rel="noopener noreferrer"
                    :href="view.apiKeyUrl">
                    {{ t('Get a key') }}
                    <FpIcon name="icon-[lucide--arrow-up-right]" class="text-13" />
                </FpButton>
            </div>
            <FpInput
                :id="keyId"
                type="password"
                spellcheck="false"
                class="font-medium font-mono tracking-wide"
                :model-value="view.apiKey.value"
                @update:model-value="view.setApiKey(String($event))">
                <template #leading><FpIcon name="icon-[lucide--key-square]" /></template>
                <template v-if="view.keyWorks.value" #trailing>
                    <span class="flex items-center gap-1.5 px-2 font-sans text-12 text-success">
                        <FpIcon name="icon-[lucide--circle-check]" class="text-13" />
                        {{ t('Works') }}
                    </span>
                </template>
            </FpInput>
        </div>

        <FpEyebrow class="ml-0! pt-2.5 pb-2">{{ t('Site access') }}</FpEyebrow>
        <FpFormRow
            v-for="site in view.sites.value"
            :key="site.key"
            plain
            compact
            inline
            :label="site.host"
            :description="site.description">
            <template #leading>
                <FpIcon name="icon-[lucide--globe]" class="text-16 text-fg-3" />
            </template>
            <template #label>
                <span class="font-medium font-mono text-13">{{ site.host }}</span>
            </template>
            <span v-if="site.allowed" class="flex items-center gap-1.5 pr-2.5 text-12.5 text-success">
                <FpIcon name="icon-[lucide--circle-check]" class="text-14" />
                {{ t('Allowed') }}
            </span>
            <FpButton
                v-else
                size="sm"
                color="accent"
                :label="t('Allow')"
                @click="view.allowSite(site.key)" />
        </FpFormRow>
        <SectionNote v-if="view.showFirefoxNote.value" icon="icon-[simple-icons--firefoxbrowser]">
            {{ t('Firefox asks for each site separately. Without access, autofill and Steam data are off for that site.') }}
        </SectionNote>
    </div>
</template>
